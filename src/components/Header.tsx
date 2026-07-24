import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Search,
  Server,
  User as UserIcon,
  LogOut,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { User, ApiConfig } from '../types';

interface HeaderProps {
  currentUser?: User | null;
  onToggleSidebar?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  apiConfig?: ApiConfig;
  onOpenApiConfig?: () => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSwitchRole?: (role: 'admin' | 'cliente') => void;
  activeTabTitle?: string;
  showToast?: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
  theme,
  onToggleTheme,
  apiConfig,
  onOpenApiConfig,
  onLogout,
  onOpenLoginModal,
  searchQuery = '',
  onSearchChange,
  onSwitchRole,
  activeTabTitle = 'Controle de Jobs',
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isDark = theme ? theme === 'dark' : Boolean(darkMode);
  const handleToggleTheme = onToggleTheme || onToggleDarkMode || (() => {});
  const handleLogout = onLogout || onOpenLoginModal || (() => {});

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors shadow-xs">
      {/* Left section: Breadcrumb & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Alternar Menu Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
            S
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">Sothink</span>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">{activeTabTitle}</span>
          </div>
        </div>
      </div>

      {/* Center: Sleek Search Bar */}
      {onSearchChange && (
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar clientes, jobs ou atas..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:text-slate-100 placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>
      )}

      {/* Right Section: Actions & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PHP API Status indicator */}
        {onOpenApiConfig && (
          <button
            onClick={onOpenApiConfig}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              apiConfig?.useRemoteApi
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
            title="Status da API REST PHP"
          >
            <Server className="w-3.5 h-3.5 text-blue-600" />
            <span>{apiConfig?.useRemoteApi ? 'API PHP' : 'Local REST'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={handleToggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
          title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.nome}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/20"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                {getInitials(currentUser?.nome)}
              </div>
            )}

            <div className="hidden sm:block text-left pr-1">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {currentUser?.nome || 'Agência Sothink'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {currentUser?.role === 'cliente' ? 'Cliente Portal' : currentUser?.cargo || 'Admin'}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2"
              onClick={() => setUserMenuOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {currentUser?.nome || 'Agência Sothink'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email || 'sothink.gestao@gmail.com'}
                </p>
              </div>

              <div className="p-1.5 space-y-1">
                {onSwitchRole && (
                  <button
                    onClick={() => onSwitchRole(currentUser?.role === 'admin' ? 'cliente' : 'admin')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    {currentUser?.role === 'admin' ? 'Visão do Cliente' : 'Modo Admin'}
                  </button>
                )}

                {onOpenApiConfig && (
                  <button
                    onClick={onOpenApiConfig}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Server className="w-4 h-4 text-blue-600" />
                    Endpoint API PHP
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Trocar Usuário / Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
