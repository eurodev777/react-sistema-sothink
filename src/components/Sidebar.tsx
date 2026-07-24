import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Kanban,
  CheckSquare,
  ShieldCheck,
  Code2,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { User } from '../types';

export type ActiveTab = 'dashboard' | 'clientes' | 'atas' | 'jobs' | 'templates' | 'relatorios' | 'portal' | 'api-docs';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  collapsed?: boolean;
  currentUser?: User | null;
  counts?: {
    clientes: number;
    atas: number;
    jobs: number;
  };
  clientesCount?: number;
  atasCount?: number;
  jobsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed = false,
  currentUser,
  counts,
  clientesCount = 0,
  atasCount = 0,
  jobsCount = 0,
}) => {
  const isClient = currentUser?.role === 'cliente';

  const cCount = counts ? counts.clientes : clientesCount;
  const aCount = counts ? counts.atas : atasCount;
  const jCount = counts ? counts.jobs : jobsCount;

  const navItems = isClient
    ? [
        {
          id: 'portal' as ActiveTab,
          label: 'Área do Cliente',
          icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,
          badge: jCount,
        },
      ]
    : [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'clientes' as ActiveTab,
          label: 'CRM Clientes',
          icon: <Building2 className="w-4 h-4" />,
          badge: cCount,
        },
        {
          id: 'jobs' as ActiveTab,
          label: 'Controle de Jobs',
          icon: <Kanban className="w-4 h-4" />,
          badge: jCount,
        },
        {
          id: 'relatorios' as ActiveTab,
          label: 'Relatórios de Tráfego',
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          id: 'atas' as ActiveTab,
          label: 'Atas de Reunião',
          icon: <FileText className="w-4 h-4" />,
          badge: aCount,
        },
        {
          id: 'templates' as ActiveTab,
          label: 'Listas de Checklist',
          icon: <CheckSquare className="w-4 h-4" />,
        },
        {
          id: 'portal' as ActiveTab,
          label: 'Visão Portal Cliente',
          icon: <ShieldCheck className="w-4 h-4" />,
          tag: 'Preview',
        },
        {
          id: 'api-docs' as ActiveTab,
          label: 'Integração API PHP',
          icon: <Code2 className="w-4 h-4" />,
        },
      ];

  return (
    <aside
      className={`bg-[#0f172a] text-white transition-all duration-200 shrink-0 flex flex-col justify-between border-r border-slate-800/80 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      <div className="flex flex-col">
        {/* Sidebar Brand Logo */}
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">SOTHINK</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm mx-auto">
              S
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {!collapsed && (
            <div className="px-3 pt-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {isClient ? 'Portal Exclusivo' : 'Menu Principal'}
            </div>
          )}

          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all group relative ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <div className="flex-1 text-left flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.tag && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 ml-2">
                        {item.tag}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info in sidebar */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agência Sothink OS</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Gestão operacional em tempo real com Kanban, CRM e Atas.
          </p>
        </div>
      )}
    </aside>
  );
};
