import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  retryAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  retryAuth: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Tenta recuperar sessão existente no localStorage
      const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();

      if (existingSession && !sessionError) {
        setSession(existingSession);
        setUser(existingSession.user);
        await inicializarDados(existingSession.user.id);
        setIsLoading(false);
        return;
      }

      // O aplicativo é de uso direto: tenta uma sessão anônima e, se o projeto
      // não tiver esse recurso habilitado, continua em modo local somente leitura.
      const { data: anonymousData } = await supabase.auth.signInAnonymously();
      if (anonymousData.session && anonymousData.user) {
        setSession(anonymousData.session);
        setUser(anonymousData.user);
      } else {
        setUser({
          id: '00000000-0000-0000-0000-000000000000',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'acesso-direto@local',
          app_metadata: {},
          user_metadata: { modo: 'direto' },
          created_at: new Date().toISOString(),
        } as User);
      }
      setError(null);
    } catch (err) {
      console.warn('Não foi possível sincronizar a sessão; seguindo em modo direto.', err);
      setError(null);
      setUser({
        id: '00000000-0000-0000-0000-000000000000',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'acesso-direto@local',
        app_metadata: {},
        user_metadata: { modo: 'direto' },
        created_at: new Date().toISOString(),
      } as User);
    } finally {
      setIsLoading(false);
    }
  };

  const inicializarDados = async (userId: string) => {
    try {
      // Chamada da procedure de categorias padrão se não existirem
      await supabase.rpc('garantir_categorias_padrao');
      
      // Gerar lançamentos recorrentes pendentes para o mês atual
      await processarRecorrencias(userId);
    } catch (e) {
      console.warn('Erro ao inicializar categorias ou recorrências:', e);
    }
  };

  const processarRecorrencias = async (userId: string) => {
    try {
      // Buscar lançamentos recorrentes
      const { data: recorrentes } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('user_id', userId)
        .eq('recorrente', true);

      if (!recorrentes || recorrentes.length === 0) return;

      const hoje = new Date();
      const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

      for (const rec of recorrentes) {
        const dataOriginal = rec.data ? new Date(rec.data) : hoje;
        const diaOriginal = String(dataOriginal.getDate()).padStart(2, '0');
        const novaData = `${mesAtualStr}-${diaOriginal}`;

        // Checar se já existe lançamento para este mês com a mesma descrição e origem
        const { data: existe } = await supabase
          .from('lancamentos')
          .select('id')
          .eq('user_id', userId)
          .eq('descricao', rec.descricao)
          .eq('origem', rec.origem)
          .gte('data', `${mesAtualStr}-01`)
          .lte('data', `${mesAtualStr}-31`)
          .limit(1);

        if (!existe || existe.length === 0) {
          // Criar como pendente no mês atual
          await supabase.from('lancamentos').insert({
            user_id: userId,
            tipo: rec.tipo,
            valor: rec.valor,
            data: novaData,
            vencimento: novaData,
            descricao: rec.descricao,
            origem: rec.origem,
            categoria_id: rec.categoria_id,
            forma_pagamento: rec.forma_pagamento,
            status: 'pendente',
            recorrente: true,
            observacao: 'Gerado automaticamente por recorrência mensal',
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao processar lançamentos recorrentes:', e);
    }
  };

  useEffect(() => {
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        retryAuth: initAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
