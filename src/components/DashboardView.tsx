import React from 'react';
import {
  Building2,
  FileText,
  Kanban,
  Plus,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Calendar as CalendarIcon,
  CheckCircle2,
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
  onNavigateTab: (tab: 'clientes' | 'atas' | 'jobs') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clientes,
  atas,
  jobs,
  onOpenNewCliente,
  onOpenNewAta,
  onOpenNewJob,
  onSelectJob,
  onNavigateTab,
}) => {
  const jobsEmAndamento = jobs.filter((j) => j.status === 'Em Andamento').length;
  const jobsAprovacaoCliente = jobs.filter((j) => j.status === 'Aprovação Clientes').length;
  const jobsParaAnalise = jobs.filter((j) => j.status === 'Novos Jobs (Análise)').length;
  const jobsCriticos = jobs.filter((j) => j.urgencia === 'Crítico' || j.urgencia === 'Alto').length;

  const recentJobs = [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const recentAtas = [...atas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner Greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Sothink Control Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Painel de Gestão da Agência
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Acompanhamento de clientes, atas de reunião, aprovações e o quadro Kanban de Jobs em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenNewCliente}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
            <button
              onClick={onOpenNewAta}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              Nova Ata
            </button>
            <button
              onClick={onOpenNewJob}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novo Job
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('clientes')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Clientes Ativos
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {clientes.length}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +100%
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Empresas com contrato ativo
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('jobs')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Jobs em Andamento
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Kanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {jobsEmAndamento}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              de {jobs.length} total
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {jobsParaAnalise} novos aguardando análise
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('jobs')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Aprovação do Cliente
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {jobsAprovacaoCliente}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
              Pendente
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Aguardando validação no Portal
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('atas')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Atas Registradas
            </span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {atas.length}
            </span>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              Reuniões
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Com plano de ação e responsáveis
          </p>
        </div>
      </div>

      {/* Main Content Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Jobs Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Controle de Jobs Recentes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Últimas solicitações registradas no Kanban
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('jobs')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Ver Kanban Completo <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Job / Título</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Urgência</th>
                  <th className="pb-3 text-right">Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                      {job.titulo_job || job.nome_job}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                      {job.cliente_nome}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-800/40">
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                          job.urgencia === 'Crítico'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                            : job.urgencia === 'Alto'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {job.urgencia}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {job.data_entrega ? new Date(job.data_entrega).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Recent Atas & Quick Info */}
        <div className="space-y-6">
          {/* Atas Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Últimas Atas de Reunião
              </h3>
              <button
                onClick={() => onNavigateTab('atas')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Ver Todas
              </button>
            </div>

            <div className="space-y-3">
              {recentAtas.map((ata) => (
                <div
                  key={ata.id}
                  onClick={() => onNavigateTab('atas')}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {ata.cliente_nome}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(ata.data_reuniao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                    {ata.objetivo}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>Resp: {ata.responsavel}</span>
                    <span>• {ata.acoes.length} tarefas pendentes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sothink Agency Info Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white space-y-3 shadow-lg shadow-indigo-500/20">
            <h4 className="font-extrabold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              Sothink Marketing
            </h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              O sistema está totalmente integrado às rotas REST da API em PHP. Utilize o botão no menu superior para alternar entre o servidor de testes e seu endpoint PHP de produção.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
