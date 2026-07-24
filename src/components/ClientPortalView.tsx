import React, { useState } from 'react';
import {
  Building2,
  Kanban,
  CheckCircle2,
  Clock,
  MessageSquare,
  LogOut,
  Sparkles,
  X,
  Send,
  Plus,
  FileText,
  TrendingUp,
  Paperclip,
  Upload,
  Download,
  Trash2,
} from 'lucide-react';
import { EmpresaCliente, Job, Relatorio, Anexo } from '../types';
import { RelatoriosView } from './RelatoriosView';

interface ClientPortalViewProps {
  client: EmpresaCliente;
  jobs: Job[];
  relatorios: Relatorio[];
  onLogoutClient: () => void;
  onSaveJob: (jobData: Partial<Job>) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  client,
  jobs,
  relatorios,
  onLogoutClient,
  onSaveJob,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'relatorios'>('jobs');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [commentText, setCommentText] = useState('');
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);

  // New job state
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobBriefing, setNewJobBriefing] = useState('');
  const [newJobUrgencia, setNewJobUrgencia] = useState<'Baixo' | 'Médio' | 'Alto' | 'Urgente'>('Médio');

  // Filter jobs for this client
  const clientJobs = jobs.filter(
    (j) => j.cliente_id === client.id && j.permitir_acesso_cliente !== false
  );

  // Filter reports for this client
  const clientRelatorios = relatorios.filter(
    (r) => r.cliente_id === client.id || r.cliente_nome.toLowerCase().includes((client.nome_fantasia || client.razao_social).toLowerCase())
  );

  const handleApproveJob = async (job: Job) => {
    try {
      await onSaveJob({
        id: job.id,
        status: 'Finalizado',
      });
      showToast('success', 'Job Aprovado pelo Cliente! 🎉', 'Status atualizado no Kanban.');
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...selectedJob, status: 'Finalizado' });
      }
    } catch (err: any) {
      showToast('error', 'Erro ao aprovar', err.message);
    }
  };

  const handleRequestAlteration = async (job: Job) => {
    try {
      await onSaveJob({
        id: job.id,
        status: 'Alterações',
      });
      showToast('info', 'Solicitação de Alteração Enviada!', 'A equipe Sothink foi notificada.');
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...selectedJob, status: 'Alterações' });
      }
    } catch (err: any) {
      showToast('error', 'Erro ao solicitar alteração', err.message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClientFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedJob) return;

    const files = Array.from(e.target.files) as File[];
    const newAnexos: Anexo[] = [];

    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.readAsDataURL(file);
      });

      newAnexos.push({
        id: `anx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nome: file.name,
        tamanho: formatFileSize(file.size),
        tipo: file.type || 'application/octet-stream',
        url: base64,
        data_upload: new Date().toLocaleString('pt-BR'),
      });
    }

    const updatedAnexos = [...(selectedJob.anexos || []), ...newAnexos];
    await onSaveJob({
      id: selectedJob.id,
      anexos: updatedAnexos,
    });

    setSelectedJob({ ...selectedJob, anexos: updatedAnexos });
    showToast('success', 'Anexo(s) adicionado(s)!', `${newAnexos.length} arquivo(s) enviado(s) à agência.`);
    e.target.value = '';
  };

  const handleClientDeleteAnexo = async (anexoId: string) => {
    if (!selectedJob) return;
    const updatedAnexos = (selectedJob.anexos || []).filter((a) => a.id !== anexoId);
    await onSaveJob({
      id: selectedJob.id,
      anexos: updatedAnexos,
    });
    setSelectedJob({ ...selectedJob, anexos: updatedAnexos });
    showToast('info', 'Anexo removido!');
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedJob) return;

    const newCom = {
      id: `cm-${Date.now()}`,
      usuario: `${client.nome_fantasia || client.razao_social} (Cliente)`,
      cargo: 'Cliente Responsável',
      texto: commentText.trim(),
      data_hora: new Date().toLocaleString('pt-BR'),
    };

    const updatedComments = [...(selectedJob.comentarios || []), newCom];
    await onSaveJob({
      id: selectedJob.id,
      comentarios: updatedComments,
    });

    setSelectedJob({ ...selectedJob, comentarios: updatedComments });
    setCommentText('');
    showToast('success', 'Comentário Enviado', 'Mensagem entregue à equipe Sothink.');
  };

  const handleCreateJobByClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim() || !newJobBriefing.trim()) {
      showToast('error', 'Preencha o título e a solicitação do job.');
      return;
    }

    try {
      await onSaveJob({
        cliente_id: client.id,
        cliente_nome: client.nome_fantasia || client.razao_social,
        nome_job: newJobTitle,
        titulo_job: newJobTitle,
        briefing: newJobBriefing,
        urgencia: newJobUrgencia,
        status: 'Briefing Pendente',
        data_criacao: new Date().toISOString().split('T')[0],
        permitir_acesso_cliente: true,
        etiquetas: ['CLIENTE'],
      });

      setCreateJobModalOpen(false);
      setNewJobTitle('');
      setNewJobBriefing('');
      showToast('success', 'Solicitação de Job Criada! 🚀', 'Sua solicitação deu entrada na fila da Sothink.');
    } catch (err: any) {
      showToast('error', 'Erro ao criar job', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Portal Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 font-black text-white flex items-center justify-center text-lg shadow-lg shadow-blue-600/30">
            S
          </div>
          <div>
            <h1 className="font-black text-white text-base tracking-tight flex items-center gap-2">
              Portal do Cliente Sothink
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Acesso Seguro
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {client.nome_fantasia || client.razao_social} ({client.cnpj})
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Meus Jobs ({clientJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'relatorios'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Relatórios ({clientRelatorios.length})
          </button>
        </div>

        <button
          onClick={onLogoutClient}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          Sair
        </button>
      </header>

      {/* Mobile Tabs */}
      <div className="flex sm:hidden border-b border-slate-800 bg-slate-900 p-2 gap-2">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl ${
            activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          Jobs ({clientJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('relatorios')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl ${
            activeTab === 'relatorios' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          Relatórios ({clientRelatorios.length})
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-blue-500/30 shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Painel Exclusivo do Cliente
          </div>
          <h2 className="text-2xl font-black text-white">
            Bem-vindo, {client.nome_fantasia || client.razao_social}!
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Sua central para solicitar novos trabalhos, acompanhar a produção de campanhas e consultar os relatórios mensais de investimento.
          </p>
        </div>

        {/* TAB 1: JOBS */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Kanban className="w-5 h-5 text-blue-400" />
                Seus Jobs em Andamento ({clientJobs.length})
              </h3>

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
                <p>Clique no botão <strong>"+ Solicitar / Criar Job"</strong> para abrir uma solicitação para a equipe Sothink.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {clientJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg hover:border-blue-500 cursor-pointer transition-all space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800">
                          {job.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Prazo: {job.data_entrega || '-'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">
                        {job.titulo_job || job.nome_job}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {job.briefing || job.descricao}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        {job.comentarios?.length || 0} mensagens
                      </span>

                      <span className="font-bold text-blue-400 group-hover:underline">
                        Detalhes ➔
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RELATÓRIOS */}
        {activeTab === 'relatorios' && (
          <RelatoriosView
            relatorios={clientRelatorios}
            clientes={[client]}
            onSaveRelatorio={async () => {}}
            onDeleteRelatorio={async () => {}}
            showToast={showToast}
            isClientView={true}
          />
        )}
      </main>

      {/* Selected Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 text-xs text-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 font-bold text-xs border border-blue-800">
                  {selectedJob.status}
                </span>
                <h3 className="text-xl font-black text-white mt-2">
                  {selectedJob.titulo_job || selectedJob.nome_job}
                </h3>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Briefing Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-white text-xs">Briefing & Orientação do Job</h4>
              <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                {selectedJob.briefing || 'Sem descrição.'}
              </p>
            </div>

            {/* Anexos & Arquivos Section */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-400" />
                  Anexos e Arquivos ({selectedJob.anexos?.length || 0})
                </h4>

                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  + Enviar Arquivos
                  <input
                    type="file"
                    multiple
                    onChange={handleClientFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {!selectedJob.anexos || selectedJob.anexos.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">Nenhum arquivo anexado a esta demanda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedJob.anexos.map((anx) => {
                    const isImage = anx.tipo?.startsWith('image/') || anx.nome.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

                    return (
                      <div
                        key={anx.id}
                        className="flex items-center gap-2.5 p-2 bg-slate-900 rounded-xl border border-slate-800"
                      >
                        {isImage && anx.url ? (
                          <img
                            src={anx.url}
                            alt={anx.nome}
                            className="w-9 h-9 object-cover rounded-lg border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center shrink-0 text-blue-400">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-white text-xs truncate" title={anx.nome}>
                            {anx.nome}
                          </h5>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {anx.tamanho}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {anx.url && (
                            <a
                              href={anx.url}
                              download={anx.nome}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-400"
                              title="Baixar arquivo"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleClientDeleteAnexo(anx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400"
                            title="Remover anexo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Client Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-950/40 rounded-2xl border border-blue-900/60">
              <div className="flex-1">
                <h5 className="font-bold text-white text-xs">Validação de Entrega</h5>
                <p className="text-[11px] text-slate-400">
                  Você aprova o resultado do job ou deseja solicitar alterações?
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRequestAlteration(selectedJob)}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/20"
                >
                  Solicitar Alteração
                </button>
                <button
                  onClick={() => handleApproveJob(selectedJob)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aprovar Job
                </button>
              </div>
            </div>

            {/* Comments Stream */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Histórico de Mensagens com a Agência
              </h4>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedJob.comentarios?.map((com) => (
                  <div
                    key={com.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-400">{com.usuario}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{com.data_hora}</span>
                    </div>
                    <p className="text-slate-300">{com.texto}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendComment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enviar mensagem para a equipe da Sothink..."
                  className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Client to Create Job */}
      {createJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Solicitar Novo Job para a Agência
              </h3>
              <button
                onClick={() => setCreateJobModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJobByClient} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Título / Nome da Demanda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arte para Redes Sociais - Promoção de Carnaval"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Urgência Desejada
                </label>
                <select
                  value={newJobUrgencia}
                  onChange={(e) => setNewJobUrgencia(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Baixo">Baixo (Até 10 dias)</option>
                  <option value="Médio">Médio (Até 5 dias)</option>
                  <option value="Alto">Alto (Até 48h)</option>
                  <option value="Urgente">Urgente (Mesmo dia / 24h)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Briefing / Detalhes da Solicitação *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva o que precisa, objetivo, formatos desejados e referências..."
                  value={newJobBriefing}
                  onChange={(e) => setNewJobBriefing(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateJobModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-600/30"
                >
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
