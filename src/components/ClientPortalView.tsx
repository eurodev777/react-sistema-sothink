import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Kanban,
  LogOut,
  Sparkles,
  X,
  Plus,
  FileText,
  TrendingUp,
  Paperclip,
  Download,
  CalendarDays,
  LayoutDashboard,
  CheckSquare,
  UserRound,
} from 'lucide-react';
import { EmpresaCliente, Job, Relatorio } from '../types';
import { ClientAtasView } from './ClientAtasView';
import { ClientRelatoriosView } from './ClientRelatoriosView';
import { ClientDashboardTrafego } from './ClientDashboardTrafego';

interface ClientPortalViewProps {
  client: EmpresaCliente;
  jobs: Job[];
  relatorios?: Relatorio[]; // mantido por compatibilidade com o App atual
  onLogoutClient: () => void;
  onSaveJob: (jobData: Partial<Job>) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

type ClientTab = 'dashboard' | 'jobs' | 'atas' | 'relatorios';

const formatDateSafe = (date?: string) => {
  if (!date || date === '0000-00-00') return '-';
  try {
    const safe = date.includes('T') ? date : `${date}T12:00:00`;
    return new Date(safe).toLocaleDateString('pt-BR');
  } catch {
    return date;
  }
};

const getJobTitle = (job: Job) =>
  job.titulo || (job as any).titulo_job || (job as any).nome_job || 'Job sem título';

const parseArray = <T,>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  client,
  jobs,
  onLogoutClient,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<ClientTab>('dashboard');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobBriefing, setNewJobBriefing] = useState('');
  const [newJobUrgencia, setNewJobUrgencia] = useState<'Baixo' | 'Médio' | 'Alto' | 'Crítico'>('Médio');

  // Mantém uma lista local para o novo job aparecer imediatamente no portal.
  const [portalJobs, setPortalJobs] = useState<Job[]>(jobs || []);

  useEffect(() => {
    setPortalJobs(jobs || []);
  }, [jobs]);

  const fetchPortalJobs = async () => {
    const response = await fetch('https://sothink.com.br/app/api/listar?tabela=jobs', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status} ao carregar os jobs.`);
    }

    const data = await response.json();
    setPortalJobs(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPortalJobs().catch((error) => {
      console.error('Erro ao atualizar jobs do portal:', error);
    });
  }, [client.id]);

  // O cliente enxerga SOMENTE jobs vinculados ao próprio cliente_id.
  // Não damos ações de edição/aprovação/comentário/anexo neste portal.
  const clientJobs = useMemo(
    () => portalJobs.filter((job) => String(job.cliente_id) === String(client.id)),
    [portalJobs, client.id]
  );

  const handleCreateJobByClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newJobTitle.trim() || !newJobBriefing.trim()) {
      showToast('error', 'Campos obrigatórios', 'Preencha o título e o briefing da solicitação.');
      return;
    }

    setIsCreatingJob(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];

      const form = new FormData();
      form.append('tabela', 'jobs');
      form.append('cliente_id', String(client.id));
      form.append('titulo', newJobTitle.trim());
      form.append('briefing', newJobBriefing.trim());
      form.append('descricao', '[]');
      form.append('prioridade', newJobUrgencia);
      form.append('status', 'Novos Jobs (Análise)');
      form.append('data_inicio', hoje);
      form.append('data_criacao', hoje);
      form.append('data_entrega', '');
      form.append('responsavel', '');
      form.append('etiquetas', JSON.stringify(['CLIENTE']));
      form.append('permitir_acesso_cliente', '1');
      form.append('ordem', '0');
      form.append('arquivado', '0');

      const response = await fetch(
        'https://sothink.com.br/app/api/inserir?tabela=jobs',
        {
          method: 'POST',
          body: form,
        }
      );

      const texto = await response.text();

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${texto}`);
      }

      let result: any = {};
      try {
        result = texto ? JSON.parse(texto) : {};
      } catch {
        throw new Error(`A API retornou uma resposta inválida: ${texto}`);
      }

      if (result?.erro || result?.sucesso === false) {
        throw new Error(result?.erro || 'A API recusou a criação do job.');
      }

      // Recarrega direto do banco para aparecer imediatamente para o cliente.
      await fetchPortalJobs();

      setCreateJobModalOpen(false);
      setNewJobTitle('');
      setNewJobBriefing('');
      setNewJobUrgencia('Médio');

      showToast(
        'success',
        'Solicitação criada!',
        'O job foi criado no banco e vinculado automaticamente à sua empresa.'
      );
    } catch (err: any) {
      console.error('Erro ao criar job pelo cliente:', err);
      showToast(
        'error',
        'Erro ao criar job',
        err?.message || 'Não foi possível criar a solicitação.'
      );
    } finally {
      setIsCreatingJob(false);
    }
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs' as const, label: `Meus Jobs (${clientJobs.length})`, icon: Kanban },
    { id: 'atas' as const, label: 'Atas', icon: CalendarDays },
    { id: 'relatorios' as const, label: 'Relatórios', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 font-black text-white flex items-center justify-center text-lg shadow-lg shadow-blue-600/30 shrink-0">
            S
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-white text-base tracking-tight flex items-center gap-2">
              <span className="truncate">Portal do Cliente Sothink</span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Acesso Seguro
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate">
              {client.nome_fantasia || client.razao_social}
              {client.cnpj ? ` (${client.cnpj})` : ''}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onLogoutClient}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 shrink-0"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      <div className="flex lg:hidden border-b border-slate-800 bg-slate-900 p-2 gap-2 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`shrink-0 px-3 py-2 text-center text-xs font-bold rounded-xl flex items-center gap-1.5 ${
              activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-blue-500/30 shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Painel Exclusivo do Cliente
          </div>
          <h2 className="text-2xl font-black text-white">
            Bem-vindo, {client.nome_fantasia || client.razao_social}!
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Consulte sua operação, acompanhe os jobs, visualize atas e relatórios e confira os dados de tráfego da sua empresa.
          </p>
        </div>

        {activeTab === 'dashboard' && (
          <ClientDashboardTrafego client={client} showToast={showToast} />
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Kanban className="w-5 h-5 text-blue-400" />
                  Seus Jobs ({clientJobs.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Os jobs são somente para consulta. Para uma nova demanda, use “Solicitar / Criar Job”.
                </p>
              </div>

              <button
                onClick={() => setCreateJobModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Solicitar / Criar Job
              </button>
            </div>

            {clientJobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs space-y-3">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300 text-sm">Nenhum job cadastrado ainda.</p>
                <p>Clique em <strong>“Solicitar / Criar Job”</strong> para enviar uma nova demanda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {clientJobs.map((job) => (
                  <button
                    type="button"
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="text-left bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg hover:border-blue-500 cursor-pointer transition-all space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800 truncate">
                          {job.status || 'Sem status'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          Prazo: {formatDateSafe(job.data_entrega)}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">
                        {getJobTitle(job)}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {job.briefing || 'Sem briefing.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <UserRound className="w-3.5 h-3.5 text-blue-400" />
                        {job.responsavel || 'A definir'}
                      </span>
                      <span className="font-bold text-blue-400">Visualizar ➔</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'atas' && (
          <ClientAtasView client={client} showToast={showToast} />
        )}

        {activeTab === 'relatorios' && (
          <ClientRelatoriosView client={client} showToast={showToast} />
        )}
      </main>

      {selectedJob && (() => {
        const checklists = parseArray<any>((selectedJob as any).checklists);
        const anexos = Array.isArray((selectedJob as any).anexos) ? (selectedJob as any).anexos : [];
        const comentarios = parseArray<any>((selectedJob as any).comentarios || (selectedJob as any).descricao);
        const etiquetas = parseArray<string>((selectedJob as any).etiquetas);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 text-xs text-slate-200">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 font-bold text-xs border border-blue-800">
                    {selectedJob.status || 'Sem status'}
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">{getJobTitle(selectedJob)}</h3>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <InfoCard label="Prioridade" value={selectedJob.prioridade || '-'} />
                <InfoCard label="Responsável" value={selectedJob.responsavel || 'A definir'} />
                <InfoCard label="Início" value={formatDateSafe(selectedJob.data_inicio)} />
                <InfoCard label="Entrega" value={formatDateSafe(selectedJob.data_entrega)} />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-white text-xs">Briefing & Orientação do Job</h4>
                <p className="text-slate-300 whitespace-pre-line leading-relaxed">{selectedJob.briefing || 'Sem descrição.'}</p>
              </div>

              {etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {etiquetas.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {checklists.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-400" /> Checklist
                  </h4>
                  <div className="space-y-2">
                    {checklists.map((item: any, index: number) => (
                      <div key={item.id || index} className="flex items-start gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-[9px] ${item.concluido ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'}`}>
                          {item.concluido ? '✓' : ''}
                        </span>
                        <div className="flex-1">
                          <p className="text-slate-200">{item.texto || item.titulo || 'Item'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.responsavel || ''} {item.data ? `• ${formatDateSafe(item.data)}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-400" /> Anexos e Arquivos ({anexos.length})
                </h4>
                {anexos.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhum arquivo anexado.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {anexos.map((anx: any, index: number) => (
                      <div key={anx.id || index} className="flex items-center gap-2.5 p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center shrink-0 text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-white text-xs truncate">{anx.nome || anx.arquivo}</h5>
                          <p className="text-[10px] text-slate-400">{anx.tamanho || ''}</p>
                        </div>
                        {anx.url && (
                          <a href={anx.url} download={anx.nome} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-400" title="Baixar arquivo">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {comentarios.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-white text-xs">Histórico de Mensagens</h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {comentarios.map((com: any, index: number) => (
                      <div key={com.id || index} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px] gap-2">
                          <span className="font-bold text-blue-400">{com.usuario || 'Sothink'}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{com.data_hora || ''}</span>
                        </div>
                        <p className="text-slate-300">{com.texto || ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button onClick={() => setSelectedJob(null)} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {createJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" /> Solicitar Novo Job para a Agência
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Cliente: {client.nome_fantasia || client.razao_social}
                </p>
              </div>
              <button onClick={() => setCreateJobModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJobByClient} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Título / Nome da Demanda *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arte para Redes Sociais - Promoção de Setembro"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Urgência Desejada</label>
                <select
                  value={newJobUrgencia}
                  onChange={(e) => setNewJobUrgencia(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Baixo">Baixo</option>
                  <option value="Médio">Médio</option>
                  <option value="Alto">Alto</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Briefing / Detalhes da Solicitação *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Descreva o que precisa, objetivo, formatos desejados e referências..."
                  value={newJobBriefing}
                  onChange={(e) => setNewJobBriefing(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-200">
                Esta solicitação será vinculada automaticamente à empresa <strong>{client.nome_fantasia || client.razao_social}</strong> e entrará em <strong>Novos Jobs (Análise)</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setCreateJobModalOpen(false)} className="px-4 py-2 font-bold text-slate-400 hover:text-white">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingJob}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {isCreatingJob ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">{label}</span>
    <span className="text-xs text-slate-200 font-bold">{value}</span>
  </div>
);