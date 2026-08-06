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
  Megaphone,
} from 'lucide-react';
import { User } from '../types';
import logo from '../assets/logo.jpeg';

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
          icon: <ShieldCheck className="w-5 h-5" />,
          badge: jCount,
        },
      ]
    : [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          id: 'clientes' as ActiveTab,
          label: 'Clientes',
          icon: <Building2 className="w-5 h-5" />,
          badge: cCount,
        },
        {
          id: 'jobs' as ActiveTab,
          label: 'Jobs',
          icon: <Kanban className="w-5 h-5" />,
          badge: jCount,
        },
        {
          id: 'relatorios' as ActiveTab,
          label: 'Relatórios',
          icon: <TrendingUp className="w-5 h-5" />,
        },
        {
          id: 'atas' as ActiveTab,
          label: 'Atendimento',
          icon: <FileText className="w-5 h-5" />,
          badge: aCount,
        },
        {
          id: 'trafego' as ActiveTab,
          label: 'Tráfego',
          icon: <Megaphone className="w-5 h-5" />,
          badge: aCount,
        }
      ];

  return (
    <aside
      className={`bg-white text-slate-800 transition-all duration-300 shrink-0 flex flex-col border-r border-slate-200 h-full ${
        collapsed ? 'w-12' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Brand Logo */}
        <div className={`h-16 flex items-center border-b border-slate-200 transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
          {!collapsed ? (
            <img src={logo} alt="Sothink Logo" className="h-8 w-auto object-contain" />
          ) : (
            // Quando fechado, mostra uma versão reduzida do logo (ou uma letra/ícone para não quebrar o visual)
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
              S
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-0.5 mt-2 space-y-2 flex-1 overflow-y-auto">
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
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center py-3 rounded-xl text-sm font-semibold transition-all group relative ${
                  collapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={`shrink-0 transition-transform duration-200 ${
                  collapsed ? 'group-hover:scale-110' : ''
                } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <div className="flex-1 text-left flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>

                    {/* Mostra a Badge apenas se não estiver minimizado */}
                    {/* {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )} */}
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