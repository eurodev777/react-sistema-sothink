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
          icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
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
        }
      ];

  return (
    <aside
      className={`bg-white text-slate-800 transition-all duration-200 shrink-0 flex flex-col justify-between border-r border-slate-200 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      <div className="flex flex-col">
        {/* Sidebar Brand Logo */}
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">SOTHINK</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm mx-auto shadow-sm">
              S
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {!collapsed && (
            <div className="px-3 pt-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
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
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <div className="flex-1 text-left flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>

                    {/* {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )} */}

                    {(item as any).tag && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 ml-2">
                        {(item as any).tag}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};