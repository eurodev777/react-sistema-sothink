import React, { useState, useRef } from "react";
import {
  Kanban,
  Calendar as CalendarIcon,
  List,
  Plus,
  Search,
  Filter,
  X,
  Mic,
  MicOff,
  Sparkles,
  Paperclip,
  CheckSquare,
  MessageSquare,
  History,
  AlertCircle,
  Clock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Lock,
  Volume2,
  CheckCircle2,
  Tag,
  ShieldAlert,
  Upload,
  Download,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  Job,
  JobStatus,
  JobUrgencia,
  EmpresaCliente,
  ChecklistTemplate,
  User,
  Anexo,
} from "../types";
import { apiService } from "../services/apiService";

// The 12 exact Kanban Columns required
export const KANBAN_COLUMNS: { id: JobStatus; title: string; color: string }[] =
  [
    {
      id: "Novos Jobs (Análise)",
      title: "1. Novos Jobs (Análise)",
      color: "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20",
    },
    {
      id: "Aguardando Terceiros",
      title: "2. Aguardando Terceiros",
      color: "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20",
    },
    {
      id: "Programado",
      title: "3. Programado",
      color: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
    },
    {
      id: "Em Andamento",
      title: "4. Em Andamento",
      color: "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
    },
    {
      id: "Alterações",
      title: "5. Alterações",
      color: "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20",
    },
    {
      id: "Revisão",
      title: "6. Revisão",
      color: "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
    },
    {
      id: "Aprovação Interna",
      title: "7. Aprovação Interna",
      color: "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20",
    },
    {
      id: "Aprovação Clientes",
      title: "8. Aprovação Clientes",
      color: "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20",
    },
    {
      id: "Finalizado",
      title: "9. Finalizado",
      color: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
    },
    {
      id: "Publicar Campanha",
      title: "10. Publicar Campanha",
      color: "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20",
    },
    {
      id: "Enviar para Produção",
      title: "11. Enviar para Produção",
      color: "border-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-950/20",
    },
    {
      id: "Pausado / Cancelado",
      title: "12. Pausado / Cancelado",
      color: "border-slate-500 bg-slate-100/50 dark:bg-slate-800/20",
    },
  ];

export const TAGS_PRESETS = [
  "SOCIAL",
  "TRÁFEGO",
  "ADVERTISING",
  "ESTRATÉGIA",
  "DESIGN",
  "ENVIAR PARA PRODUÇÃO",
];

interface JobsKanbanViewProps {
  jobs: Job[];
  clientes: EmpresaCliente[];
  templates: ChecklistTemplate[];
  currentUser: User | null;
  onSaveJob: (jobData: Partial<Job>) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    desc?: string
  ) => void;
  selectedJobFromApp?: Job | null;
  onClearSelectedJob?: () => void;
  onOpenNewJobModal: () => void;
}

export const JobsKanbanView: React.FC<JobsKanbanViewProps> = ({
  templates,
  currentUser,
  onSaveJob,
  onDeleteJob,
  showToast,
  selectedJobFromApp,
  onClearSelectedJob,
  onOpenNewJobModal,
}) => {
  const [viewMode, setViewMode] = useState<"kanban" | "calendar" | "list">(
    "kanban"
  );

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClientId, setFilterClientId] = useState("all");
  const [filterResponsavel, setFilterResponsavel] = useState("all");
  const [filterUrgencia, setFilterUrgencia] = useState("all");
  const [filterTag, setFilterTag] = useState("all");

  // Selected Job for Modal Detail
  const [activeJob, setActiveJob] = useState<Job | null>(
    selectedJobFromApp || null
  );
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Audio Recording State for Briefing
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // New Comment State
  const [newCommentText, setNewCommentText] = useState("");

  // Drag state
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<EmpresaCliente[]>([]);
  const [jobs, setJobs] = useState([]);

  React.useEffect(() => {
    const carregarJobs = async () => {
      try {
        const response = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=jobs"
        );

        const data = await response.json();

        console.log(data);

        setJobs(data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };

    carregarJobs();
  }, []);

  React.useEffect(() => {
    const carregarClientes = async () => {
      try {
        const response = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=clientes"
        );

        const data = await response.json();

        setClientes(data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };

    carregarClientes();
  }, []);

  // Função para deletar o job ativo
  const handleDeleteJob = async () => {
    if (!activeJob?.id) return;

    if (
      window.confirm(
        "Tem certeza que deseja excluir este job? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        const response = await fetch(
          `https://sothink.com.br/app/api/deletar?id=${activeJob.id}&tabela=jobs`
        );
        const data = await response.json();

        if (data.sucesso) {
          // Se houver uma prop onDeleteJob passando do componente pai
          if (onDeleteJob) {
            await onDeleteJob(activeJob.id);
          }

          // Remove o job do state local para não precisar recarregar a página inteira
          setJobs((prev) => prev.filter((j) => j.id !== activeJob.id));

          setActiveJob(null);
          showToast("info", "Job Excluído com sucesso");

          // Descomente a linha abaixo se realmente preferir recarregar a página inteira
          // window.location.reload();
        } else {
          showToast("error", data.erro || "Erro ao excluir job");
        }
      } catch (error) {
        showToast("error", "Erro de conexão com a API ao excluir");
      }
    }
  };

  // Sync selected job from prop
  React.useEffect(() => {
    if (selectedJobFromApp) {
      setActiveJob(selectedJobFromApp);
    }
  }, [selectedJobFromApp]);

  const filteredJobs = jobs?.filter((j) => {
    const matchesSearch =
      j.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.nome_job.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient =
      filterClientId === "all" || j.cliente_id === filterClientId;
    const matchesResponsavel =
      filterResponsavel === "all" || j.responsavel === filterResponsavel;
    const matchesUrgencia =
      filterUrgencia === "all" || j.prioridade === filterUrgencia;
    const matchesTag = filterTag === "all" || j?.etiquetas?.includes(filterTag);

    return (
      matchesSearch &&
      matchesClient &&
      matchesResponsavel &&
      matchesUrgencia &&
      matchesTag
    );
  });

  // Handle Drag & Drop move column
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedJobId(id);
  };

  const handleDropColumn = async (
    e: React.DragEvent,
    targetStatus: JobStatus
  ) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/plain") || draggedJobId;
    if (!jobId) return;

    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob || targetJob.status === targetStatus) return;

    try {
      await onSaveJob({
        id: targetJob.id,
        status: targetStatus,
      });

      if (targetStatus === "Finalizado") {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        showToast("success", "Job Finalizado! 🎉", targetJob.titulo);
      } else {
        showToast("info", "Status Atualizado", `Movido para: ${targetStatus}`);
      }
    } catch (e: any) {
      showToast("error", "Erro ao mover job", e.message);
    } finally {
      setDraggedJobId(null);
    }
  };

  // Audio Recording Methods
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (activeJob) {
            setTranscribing(true);
            try {
              const res = await apiService.transcribeAudioBriefing(
                base64Audio,
                "audio/webm"
              );
              if (res.success && res.transcription) {
                const updatedBriefing = activeJob.briefing
                  ? `${activeJob.briefing}\n\n[Transcrição Áudio Gemini AI]:\n${res.transcription}`
                  : `[Transcrição Áudio Gemini AI]:\n${res.transcription}`;

                await handleUpdateActiveJobField("briefing", updatedBriefing);
                showToast(
                  "success",
                  "Áudio Transcrito com Gemini AI!",
                  "Briefing atualizado."
                );
              }
            } catch (err: any) {
              showToast("error", "Erro na Transcrição", err.message);
            } finally {
              setTranscribing(false);
            }
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      showToast(
        "error",
        "Permissão de Microfone",
        "Não foi possível acessar o microfone."
      );
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Update active job field & save
  const handleUpdateActiveJobField = async (field: keyof Job, value: any) => {
    if (!activeJob) return;

    const updated = { ...activeJob, [field]: value };
    setActiveJob(updated);

    await onSaveJob({
      id: activeJob.id,
      [field]: value,
    });
  };

  // Import checklist template into current job
  const handleImportTemplate = async (template: ChecklistTemplate) => {
    if (!activeJob) return;
    const newItems = template.itens.map((item) => ({
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      texto: item,
      concluido: false,
      responsavel: activeJob.responsavel,
    }));

    const currentChecklists = activeJob.checklists || [];
    const updatedChecklists = [...currentChecklists, ...newItems];

    await handleUpdateActiveJobField("checklists", updatedChecklists);
    showToast(
      "success",
      "Template Importado!",
      `Adicionados ${newItems.length} itens.`
    );
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Upload Attachment Files to activeJob
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeJob) return;

    const files = Array.from(e.target.files) as File[];
    const newAnexos: Anexo[] = [];

    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || "");
        reader.readAsDataURL(file);
      });

      newAnexos.push({
        id: `anx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nome: file.name,
        tamanho: formatFileSize(file.size),
        tipo: file.type || "application/octet-stream",
        url: base64,
        data_upload: new Date().toLocaleString("pt-BR"),
      });
    }

    const updatedAnexos = [...(activeJob.anexos || []), ...newAnexos];
    await handleUpdateActiveJobField("anexos", updatedAnexos);
    showToast(
      "success",
      "Anexo(s) adicionado(s)!",
      `${newAnexos.length} arquivo(s) anexado(s) com sucesso.`
    );
    e.target.value = "";
  };

  // Delete Anexo from activeJob
  const handleDeleteAnexo = async (anexoId: string) => {
    if (!activeJob) return;
    const updatedAnexos = (activeJob.anexos || []).filter(
      (a) => a.id !== anexoId
    );
    await handleUpdateActiveJobField("anexos", updatedAnexos);
    showToast("info", "Anexo removido!");
  };

  // Add Comment to active job
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeJob) return;

    const nowStr = new Date().toLocaleString("pt-BR");
    const newCom = {
      id: `cm-${Date.now()}`,
      usuario: currentUser?.nome || "Carlos Eduardo (Sothink)",
      cargo: currentUser?.cargo || "Membro Agência",
      texto: newCommentText.trim(),
      data_hora: nowStr,
    };

    const updatedComms = [...(activeJob.comentarios || []), newCom];
    await handleUpdateActiveJobField("comentarios", updatedComms);
    setNewCommentText("");
    showToast("success", "Comentário Registrado");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Quadro de Jobs
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/50">
              {filteredJobs.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerencie as demandas da agência em tempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switch */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendário
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
          </div>

          <button
            onClick={onOpenNewJobModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />+ Novo Job
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou cliente..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <select
          value={filterClientId}
          onChange={(e) => setFilterClientId(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <option value="all">Todos os Clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome_fantasia || c.razao_social}
            </option>
          ))}
        </select>

        <select
          value={filterResponsavel}
          onChange={(e) => setFilterResponsavel(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <option value="all">Todos os Colaboradores</option>
          <option value="Mariana Costa">Mariana Costa (Social)</option>
          <option value="Lucas Silva">Lucas Silva (Tráfego)</option>
          <option value="André Mendonça">André Mendonça (Design)</option>
          <option value="Carlos Eduardo (Sothink)">
            Carlos Eduardo (Diretor)
          </option>
        </select>

        <select
          value={filterUrgencia}
          onChange={(e) => setFilterUrgencia(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <option value="all">Todas as Urgências</option>
          <option value="Baixo">Baixo</option>
          <option value="Médio">Médio</option>
          <option value="Alto">Alto</option>
          <option value="Crítico">Crítico</option>
        </select>

        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <option value="all">Todas as Etiquetas</option>
          {TAGS_PRESETS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* 1. KANBAN VIEW (12 COLUMNS) */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x min-h-[600px]">
          {KANBAN_COLUMNS.map((col) => {
            const columnJobs = filteredJobs?.filter((j) => j.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropColumn(e, col.id)}
                className={`w-72 shrink-0 rounded-2xl border ${col.color} p-3 flex flex-col justify-between max-h-[750px] overflow-hidden shadow-sm`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
                    {col.title}
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 font-black text-[10px] text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-xs shrink-0">
                    {columnJobs.length}
                  </span>
                </div>

                {/* Column Job Cards List */}
                <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1">
                  {columnJobs.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 italic">
                      Nenhum job nesta coluna
                    </div>
                  ) : (
                    columnJobs.map((job) => {
                      const totalItems = job.checklists?.length || 0;
                      const doneItems =
                        job.checklists?.filter((c) => c.concluido).length || 0;

                      return (
                        <div
                          key={job.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, job.id)}
                          onClick={() => setActiveJob(job)}
                          className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-blue-500/60 transition-all cursor-grab active:cursor-grabbing space-y-3 text-xs"
                        >
                          {/* Tags Pills */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {job?.etiquetas && job?.etiquetas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(job?.etiquetas) &&
                                  job.etiquetas.map((t) => {
                                    const lower = t.toLowerCase();
                                    let tagClass = "tag-design";
                                    if (lower.includes("social"))
                                      tagClass = "tag-social";
                                    if (
                                      lower.includes("tráfego") ||
                                      lower.includes("traffic")
                                    )
                                      tagClass = "tag-traffic";

                                    return (
                                      <span
                                        key={t}
                                        className={`tag ${tagClass}`}
                                      >
                                        {t}
                                      </span>
                                    );
                                  })}
                              </div>
                            ) : (
                              <span className="tag tag-design">General</span>
                            )}

                            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[100px]">
                              {job.cliente_nome}
                            </span>
                          </div>

                          {/* Title */}
                          <div className="font-semibold text-sm leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
                            {job.titulo || job.nome_job}
                          </div>

                          {/* Footer Meta & Priority Dot */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-medium">
                                📅{" "}
                                {job.data_entrega
                                  ? new Date(
                                      job.data_entrega
                                    ).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                    })
                                  : "A definir"}
                              </span>

                              {job.anexos && job.anexos.length > 0 && (
                                <span
                                  className="flex items-center gap-0.5 font-bold text-blue-600 dark:text-blue-400"
                                  title={`${job.anexos.length} anexo(s)`}
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {job.anexos.length}
                                </span>
                              )}

                              {totalItems > 0 && (
                                <span
                                  className="flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400"
                                  title={`Checklist: ${doneItems}/${totalItems}`}
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  {doneItems}/{totalItems}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 font-medium text-[11px]">
                              <span
                                className={`priority-dot ${
                                  job.prioridade === "Crítico" ||
                                  job.prioridade === "Alto"
                                    ? "priority-high"
                                    : job.prioridade === "Médio"
                                    ? "priority-med"
                                    : "priority-low"
                                }`}
                              />
                              <span>{job.prioridade}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Cronograma Semanal & Mensal de Jobs
            </h3>
            <span className="text-xs text-slate-400">
              Organizado por Data de Início / Entrega
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs?.map((job) => (
              <div
                key={job.id}
                onClick={() => setActiveJob(job)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {job.cliente_nome}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 font-bold text-[10px]">
                    {job.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {job.titulo}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Início: {job.data_inicio || "-"}</span>
                  <span className="font-bold text-rose-600">
                    Entrega: {job.data_entrega || "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LIST VIEW */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                <th className="pb-3">Título / Job</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Urgência</th>
                <th className="pb-3">Assessor Responsável</th>
                <th className="pb-3 text-right">Prazo Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJobs?.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => setActiveJob(job)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                    {job.titulo}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">
                    {job.cliente_nome}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 font-bold text-[10px] text-indigo-600">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 font-bold">{job.prioridade}</td>
                  <td className="py-3">{job.responsavel}</td>
                  <td className="py-3 text-right font-mono">
                    {job.data_entrega || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================== */}
      {/* DETAILED JOB MODAL (EDITABLE BY ADMINS + AUDIT LOG)   */}
      {/* ==================================================== */}
      {activeJob && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setActiveJob(null);
            if (onClearSelectedJob) onClearSelectedJob();
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/50">
                    {activeJob.cliente_nome}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {activeJob.id}
                  </span>
                </div>

                {/* Editable Job Title */}
                <input
                  type="text"
                  value={activeJob.titulo}
                  onChange={(e) =>
                    handleUpdateActiveJobField("titulo", e.target.value)
                  }
                  className="w-full text-xl font-extrabold text-slate-900 dark:text-white bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 py-1 rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5"
                  title="Histórico de alterações (Apenas Admins)"
                >
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  Últimos Ajustes ({activeJob.historico?.length || 0})
                </button>

                <button
                  onClick={() => {
                    setActiveJob(null);
                    if (onClearSelectedJob) onClearSelectedJob();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Form Fields Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              {/* Left 2 Cols: Briefing, Checklists, Comments */}
              <div className="lg:col-span-2 space-y-6">
                {/* Briefing Section with Gemini Audio Transcription */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Briefing do Job (Texto & Voz AI)
                    </label>

                    {/* Audio Recorder Button */}
                    <button
                      type="button"
                      onClick={
                        isRecording ? stopAudioRecording : startAudioRecording
                      }
                      disabled={transcribing}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        isRecording
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                      }`}
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                          Transcrevendo com Gemini...
                        </>
                      ) : isRecording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" /> Gravando (
                          {recordingTime}s) - Parar
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" /> Gravar Briefing em
                          Áudio
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={activeJob.briefing || ""}
                    onChange={(e) =>
                      handleUpdateActiveJobField("briefing", e.target.value)
                    }
                    placeholder="Escreva o briefing do job ou grave um áudio para transcrição automática..."
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                {/* Sub-tasks & Checklists Section */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                      Checklist / Sub-tarefas (
                      {activeJob.checklists?.filter((c) => c.concluido)
                        .length || 0}
                      /{activeJob.checklists?.length || 0})
                    </h4>

                    {/* Import Checklist Templates Dropdown */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Importar Lista Pronta
                      </button>

                      <div className="hidden group-hover:block absolute right-0 mt-1 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-20">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                          Modelos de Checklist
                        </div>
                        {templates.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => handleImportTemplate(tmpl)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 truncate"
                          >
                            {tmpl.titulo} ({tmpl.itens.length} itens)
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Checklist Items List */}
                  <div className="space-y-2">
                    {activeJob.checklists?.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={item.concluido}
                          onChange={(e) => {
                            const updated = [...(activeJob.checklists || [])];
                            updated[idx].concluido = e.target.checked;
                            handleUpdateActiveJobField("checklists", updated);
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={item.texto}
                          onChange={(e) => {
                            const updated = [...(activeJob.checklists || [])];
                            updated[idx].texto = e.target.value;
                            handleUpdateActiveJobField("checklists", updated);
                          }}
                          className={`flex-1 bg-transparent border-none text-xs focus:outline-none ${
                            item.concluido
                              ? "line-through text-slate-400"
                              : "font-semibold text-slate-800 dark:text-slate-200"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = activeJob.checklists?.filter(
                              (_, i) => i !== idx
                            );
                            handleUpdateActiveJobField("checklists", updated);
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newItem = {
                          id: `chk-${Date.now()}`,
                          texto: "Nova sub-tarefa",
                          concluido: false,
                          responsavel: activeJob.responsavel,
                        };
                        handleUpdateActiveJobField("checklists", [
                          ...(activeJob.checklists || []),
                          newItem,
                        ]);
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                    >
                      + Adicionar Item de Checklist
                    </button>
                  </div>
                </div>

                {/* Anexos / Arquivos do Job Section */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-500" />
                      Anexos & Arquivos do Job ({activeJob.anexos?.length || 0})
                    </h4>

                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      + Anexar Arquivos
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Attachments List */}
                  {!activeJob.anexos || activeJob.anexos.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-center text-slate-400 text-xs space-y-1">
                      <Paperclip className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">
                        Nenhum arquivo anexado a este job.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Clique no botão acima para adicionar imagens, PDFs ou
                        documentos.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeJob.anexos.map((anx) => {
                        const isImage =
                          anx.tipo?.startsWith("image/") ||
                          anx.nome.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

                        return (
                          <div
                            key={anx.id}
                            className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-indigo-500/50 transition-all"
                          >
                            {/* Thumbnail or File Icon */}
                            {isImage && anx.url ? (
                              <img
                                src={anx.url}
                                alt={anx.nome}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <h5
                                className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate"
                                title={anx.nome}
                              >
                                {anx.nome}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {anx.tamanho} • {anx.data_upload}
                              </p>
                            </div>

                            {/* Actions: Download & Delete */}
                            <div className="flex items-center gap-1 shrink-0">
                              {anx.url && (
                                <a
                                  href={anx.url}
                                  download={anx.nome}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                                  title="Baixar / Visualizar arquivo"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteAnexo(anx.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
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

                {/* Comments Section */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    Comentários & Alinhamentos
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeJob.comentarios?.map((com) => (
                      <div
                        key={com.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {com.usuario} ({com.cargo})
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {com.data_hora}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          {com.texto}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Escrever um comentário..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Side Settings Sidebar */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">
                  Parâmetros do Job
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Atual (Coluna Kanban)
                  </label>
                  <select
                    value={activeJob.status}
                    onChange={(e) =>
                      handleUpdateActiveJobField(
                        "status",
                        e.target.value as JobStatus
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-indigo-600"
                  >
                    {KANBAN_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grau de Urgência
                  </label>
                  <select
                    value={activeJob.prioridade}
                    onChange={(e) =>
                      handleUpdateActiveJobField(
                        "urgencia",
                        e.target.value as JobUrgencia
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assessor Responsável
                  </label>
                  <input
                    type="text"
                    value={activeJob.responsavel}
                    onChange={(e) =>
                      handleUpdateActiveJobField("responsavel", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={activeJob.data_inicio || ""}
                    onChange={(e) =>
                      handleUpdateActiveJobField("data_inicio", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Entrega / Prazo
                  </label>
                  <input
                    type="date"
                    value={activeJob.data_entrega || ""}
                    onChange={(e) =>
                      handleUpdateActiveJobField("data_entrega", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-rose-600"
                  />
                </div>

                {/* Client Portal Toggle */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={activeJob.permitir_acesso_cliente}
                      onChange={(e) =>
                        handleUpdateActiveJobField(
                          "permitir_acesso_cliente",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Permitir acesso do cliente
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ativa visualização restrita para o cliente no Portal.
                  </p>
                </div>

                {/* BOTÃO DE EXCLUIR JOB */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-4">
                  <button
                    type="button"
                    onClick={handleDeleteJob}
                    className="w-full px-4 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Job Definitivamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal ("Últimos Ajustes") */}
      {showAuditModal && activeJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Histórico de Últimos Ajustes (Audit Log)
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Qualquer alteração realizada por administradores fica
              permanentemente documentada com usuário, data e horário.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto text-xs">
              {activeJob.historico && activeJob.historico.length > 0 ? (
                activeJob.historico.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <span>👤 {h.usuario}</span>
                      <span className="font-mono text-slate-400">
                        {h.data_hora}
                      </span>
                    </div>
                    <div className="text-slate-800 dark:text-slate-200">
                      Campo modificado:{" "}
                      <strong className="text-indigo-500">
                        {h.campo_alterado}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      De: "{h.valor_anterior}" ➔ Para: "{h.valor_novo}"
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400">
                  Nenhum ajuste registrado anteriormente neste job.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
