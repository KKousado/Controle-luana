# Doces da Luana · App de Controle Financeiro 🧁

Web app mobile-first, desenhado com a linguagem visual iOS (Apple) para a **Luana**, proprietária da confeitaria **"Doces da Luana"**. O aplicativo responde de forma clara e objetiva: **quanto entrou, quanto saiu, onde estou gastando e quanto está sobrando.**

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 18+ (já instalado no ambiente local em `~/.local/node/bin` caso não esteja no seu PATH padrão).

### 2. Configurar Variáveis de Ambiente
O projeto já conta com o arquivo `.env` configurado. Certifique-se de preencher a senha cadastrada para Luana:
```env
VITE_SUPABASE_URL=https://unzzrlcminkudoolooer.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuenpybGNtaW5rdWRvb2xvb2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDk4MzgsImV4cCI6MjEwNjg4NTgzOH0.zx-nnqUDFzGGdY7kHLXtBcFKCkVjWOR355p8a76FRz8
VITE_LUANA_EMAIL=luana@docesdaluana.app
VITE_LUANA_PASSWORD=SUA_SENHA_AQUI
```

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm install
npm run dev
```
Acesse `http://localhost:5173` no seu navegador ou pelo Safari do iPhone conectado na mesma rede Wi-Fi.

---

## 📋 Passo a Passo Manual no Supabase (Crucial)

Para que o aplicativo funcione perfeitamente com Row Level Security (RLS) sem telas de login para a Luana:

1. Acesse o [Painel do Supabase](https://supabase.com/dashboard/project/unzzrlcminkudoolooer).
2. Vá em **Authentication → Users → Add user**:
   - **Email:** `luana@docesdaluana.app`
   - **Password:** Defina uma senha forte (e coloque a mesma no `.env` em `VITE_LUANA_PASSWORD`).
   - Marque a caixa **Auto Confirm User**.
3. Vá em **Authentication → Sign In / Providers** (ou Email):
   - **Desative a opção "Allow new users to sign up"** (isso impede que qualquer pessoa crie conta externamente).
4. Vá em **SQL Editor** no Supabase:
   - Abra o arquivo `supabase_schema.sql` gerado na raiz deste projeto.
   - Cole e clique em **Run** para criar as tabelas, índices, políticas de RLS e funções de inicialização de categorias e relatórios.

---

## 📱 Como Instalar no iPhone como PWA (App Nativo)

1. Abra o Safari no iPhone e acesse a URL do aplicativo (seja em rede local ou o link de produção na Vercel/Netlify).
2. Toque no botão de **Compartilhar** do Safari (quadrado com seta apontando para cima no centro inferior).
3. Role para baixo e selecione **"Adicionar à Tela de Início"**.
4. Toque em **"Adicionar"** no canto superior direito.
5. Pronto! O app aparecerá na tela do iPhone com o ícone da doceria, abrirá em tela cheia (sem barra do Safari) e manterá Luana logada silenciosamente.

---

## ☁️ Instruções de Deploy (Vercel ou Netlify)

### Na Vercel:
1. Suba este repositório para o GitHub ou faça deploy via Vercel CLI (`vercel`).
2. No painel da Vercel, vá em **Project Settings → Environment Variables** e adicione as 4 variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LUANA_EMAIL`
   - `VITE_LUANA_PASSWORD`
3. O build command padrão é: `npm run build` e o output directory é: `dist`.

---

## ✨ Funcionalidades Entregues

1. **Acesso Silencioso e Invisível:** Sem telas de login ou botões de sair. Entra direto com sessão persistente.
2. **Entradas & Saídas em Bottom Sheet:** Máscara de moeda em tempo real, autocompletar de origens (WhatsApp, iFood, Balcão, Atacadão), categorias com ícones refinados e suporte a despesas recorrentes.
3. **Extrato Inteligente:** Agrupado por dia, busca dinâmica em tempo real, filtros por tipo e status, exclusão com botão de **"Desfazer"** no Toast.
4. **Dashboard Completo:** Cards de métricas com variação percentual vs período anterior, gráficos (Donut de categorias, evolução no tempo, Top 5 origens de gastos e canais de venda), acompanhamento de metas mensais e insights inteligentes.
5. **Exportação & WhatsApp:** Baixar imagem em alta resolução (PNG com `html2canvas`), relatório formatado em PDF (`jsPDF`) e compartilhamento nativo para WhatsApp.
6. **Contas a Pagar e a Receber:** Alertas visuais de vencimento (vence hoje, amanhã, atrasadas) com baixa com um clique.
7. **Extras da Confeitaria:** Precificação de produtos com margem e sugestão de preço, taxas de maquininha/app por canal, exportação de planilha `.csv` compatível com Excel brasileiro e backup completo em `.json`.
