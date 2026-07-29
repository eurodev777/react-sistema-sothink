import React from 'react';
import {
  Users,
  FileText,
  ClipboardList,
  BarChart2,
  ArrowRight
} from 'lucide-react';
import { EmpresaCliente, AtaReuniao, Job } from '../types';

interface DashboardViewProps {
  clientes: EmpresaCliente[];
  atas: AtaReuniao[];
  jobs: Job[];
  onOpenNewCliente: () => void;
  onOpenNewAta: () => void;
  onOpenNewJob: () => void;
  onSelectJob: (job: Job) => void;
  onNavigateTab: (tab: 'clientes' | 'atas' | 'jobs' | 'relatorios') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clientes,
  atas,
  jobs,
  onNavigateTab,
}) => {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Sothink App
          </h1>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: CRM */}
          <div 
            onClick={() => onNavigateTab('clientes')}
            className="flex flex-col bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group space-y-6"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <span className="text-xs font-medium text-slate-600">
                  {clientes.length} cadastrados
                </span>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
              Clientes 
              </h2>
            </div>

            <div className="pt-2">
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                Acessar Módulo <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 2: Atas */}
          <div 
            onClick={() => onNavigateTab('atas')}
            className="flex flex-col bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group space-y-6"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <span className="text-xs font-medium text-slate-600">
                  {atas.length} registradas
                </span>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
              Atendimento 
              </h2>
            </div>

            <div className="pt-2">
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                Acessar Módulo <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 3: Kanban */}
          <div 
            onClick={() => onNavigateTab('jobs')}
            className="flex flex-col bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group space-y-6"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <span className="text-xs font-medium text-slate-600">
                  {jobs.length} ativos
                </span>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Jobs
              </h2>
            </div>

            <div className="pt-2">
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                Acessar Módulo <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 4: Dashboard / Relatórios */}
          <div 
            onClick={() => onNavigateTab('relatorios')}
            className="flex flex-col bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group space-y-6"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BarChart2 className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <span className="text-xs font-medium text-slate-600">
                  Visualizar Indicadores
                </span>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
              Relatórios
              </h2>
            </div>

            <div className="pt-2">
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                Acessar Módulo <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};