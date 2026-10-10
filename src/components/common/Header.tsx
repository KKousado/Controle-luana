import React from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Olá, Luana 👋',
  subtitle = 'Doces da Luana',
  rightElement,
}) => {
  return (
    <header className="sticky top-0 z-20 ios-glass border-b border-black/5 dark:border-white/10 px-5 pt-3 pb-3 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {rightElement && <div>{rightElement}</div>}
      </div>
    </header>
  );
};
