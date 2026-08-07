import React, { useState, useRef, useEffect } from "react";
import {
  Kanban,
  Calendar as CalendarIcon,
  List,
  Plus,
  Search,
  X,
  Sparkles,
  Paperclip,
  CheckSquare,
  MessageSquare,
  History,
  ChevronRight,
  Loader2,
  Trash2,
  Upload,
  Download,
  FileText,
  Save,
  Archive, // <-- Adicionado o ícone Archive
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
      id: "Aprovação Interna",
      title: "5. Aprovação Interna",
      color: "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20",
    },
    {
      id: "Alterações",
      title: "6. Alterações",
      color: "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20",
    },
    {
      id: "Revisão",
      title: "7. Revisão",
      color: "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
    },
    {
      id: "Aprovação Cliente",
      title: "8. Aprovação Cliente",
      color: "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20",
    },
    {
      id: "Publicar / Enviar para Produção",
      title: "9. Publicar / Enviar para Produção",
      color: "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20",
    },
    {
      id: "Finalizado",
      title: "10. Finalizado",
      color: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
    },
    {
      id: "Pausado / Cancelado",
      title: "11. Pausado / Cancelado",
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

const getInitials = (name: string) => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatDateSafe = (dateStr?: string, formatType: "short" | "full" = "full") => {
  if (!dateStr) return "-";
  try {
    const safeString = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`;
    const dateObj = new Date(safeString);
    if (formatType === "short") {
      return dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    }
    return dateObj.toLocaleDateString("pt-BR");
  } catch (e) {
    return dateStr;
  }
};

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
  jobs: propJobs,
  clientes: propClientes,
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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterClientId, setFilterClientId] = useState("all");
  const [filterResponsavel, setFilterResponsavel] = useState("all");
  const [filterUrgencia, setFilterUrgencia] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  
  // NOVO ESTADO: Controla a exibição de jobs arquivados
  const [showArchived, setShowArchived] = useState(false);

  const [activeJob, setActiveJob] = useState<Job | null>(
    selectedJobFromApp || null
  );
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [newCommentText, setNewCommentText] = useState("");
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  const [clientes, setClientes] = useState<EmpresaCliente[]>(propClientes || []);
  const [jobs, setJobs] = useState<Job[]>(propJobs || []);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  // SINCRONIZADORES DE ESTADO COM O APP.TSX
  useEffect(() => {
    if (propJobs) {
      setJobs(propJobs);
    }
  }, [propJobs]);

  useEffect(() => {
    if (propClientes) {
      setClientes(propClientes);
    }
  }, [propClientes]);

  // Mantemos para atualizações internas forçadas (como ao salvar anexos)
  const fetchAllJobs = async () => {
    try {
      const response = await fetch(
        "https://sothink.com.br/app/api/listar?tabela=jobs"
      );
      const data = await response.json();
      setJobs(data);
      return data;
    } catch (error) {
      console.error("Erro ao carregar jobs:", error);
      return null;
    }
  };

  const getLoggedUser = () => {
    try {
      const storedUser = localStorage.getItem("@d2r:user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.error("Erro ao ler usuário do localStorage", e);
    }
    return currentUser;
  };

  const loggedUser = getLoggedUser();

  // Carrega apenas os usuários (pois eles não vêm via prop do App.tsx)
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const response = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=usuarios"
        );
        const data = await response.json();
        setUsuarios(data);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    };
    carregarUsuarios();
  }, []);

  const handleSaveChanges = async () => {
    if (!activeJob || !activeJob.id) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("tabela", "jobs");
      formData.append("id", activeJob.id);

      const camposBase = [
        "cliente_id",
        "titulo",
        "briefing",
        "prioridade",
        "status",
        "data_inicio", 
        "data_entrega",
        "responsavel",
      ];
      camposBase.forEach((campo) => {
        if (
          activeJob[campo as keyof Job] !== undefined &&
          activeJob[campo as keyof Job] !== null
        ) {
          formData.append(campo, String(activeJob[campo as keyof Job]));
        }
      });

      const hasAcesso =
        activeJob.permitir_acesso_cliente === true ||
        activeJob.permitir_acesso_cliente === "1" ||
        activeJob.permitir_acesso_cliente === 1;
      
      formData.append("permitir_acesso_cliente", hasAcesso ? "1" : "0");

      formData.append("descricao", JSON.stringify(activeJob.comentarios || []));
      formData.append("checklists", JSON.stringify(activeJob.checklists || []));

      if (activeJob.anexos && activeJob.anexos.length > 0) {
        activeJob.anexos.forEach((anx: any) => {
          if (anx.rawFile) {
            formData.append("arquivos[]", anx.rawFile);
          }
        });
      }

      const response = await fetch("https://sothink.com.br/app/api/editar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.sucesso) {
        showToast(
          "success",
          "Alterações salvas!",
          "Job atualizado no banco com sucesso."
        );

        const freshJobs = await fetchAllJobs();
        if (freshJobs) {
          const updatedActive = freshJobs.find(
            (j: Job) => j.id === activeJob.id
          );
          if (updatedActive) {
            setActiveJob(updatedActive);
            if (onSaveJob) await onSaveJob(updatedActive);
          }
        }
      } else {
        showToast("error", data.erro || "Erro ao salvar no banco.");
      }
    } catch (e: any) {
      showToast("error", "Erro de conexão", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeJob) return;

    const files = Array.from(e.target.files) as File[];

    const newAnexos = files.map((file) => ({
      id: `new-arq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: file.name,
      tamanho: formatFileSize(file.size),
      tipo: file.type || "application/octet-stream",
      url: URL.createObjectURL(file),
      data_upload: new Date().toLocaleString("pt-BR"),
      rawFile: file,
    }));

    const updatedAnexos = [...(activeJob.anexos || []), ...newAnexos];
    handleUpdateActiveJobField("anexos", updatedAnexos);
    e.target.value = "";
  };

  const handleDeleteAnexo = async (anexoId: string | number) => {
    if (!activeJob) return;

    const idStr = String(anexoId);

    const updatedAnexos = (activeJob.anexos || []).filter(
      (a) => String(a.id) !== idStr
    );
    handleUpdateActiveJobField("anexos", updatedAnexos);

    if (!idStr.startsWith("new-")) {
      try {
        const response = await fetch(
          `https://sothink.com.br/app/api/deletar?id=${idStr}&tabela=jobs_arquivos`
        );
        const data = await response.json();
        if (data.sucesso) showToast("info", "Arquivo apagado com sucesso.");
      } catch (e) {
        console.error("Erro ao deletar arquivo", e);
      }
    }
  };

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
          if (onDeleteJob) await onDeleteJob(activeJob.id);
          setJobs((prev) => prev.filter((j) => j.id !== activeJob.id));
          setActiveJob(null);
          showToast("info", "Job Excluído com sucesso");
        } else {
          showToast("error", data.erro || "Erro ao excluir job");
        }
      } catch (error) {
        showToast("error", "Erro de conexão com a API ao excluir");
      }
    }
  };

  // NOVA FUNÇÃO: Arquivar ou Restaurar Job
  const handleArchiveToggle = async () => {
    if (!activeJob?.id) return;
    
    const isCurrentlyArchived = (activeJob as any).arquivado === 1 || (activeJob as any).arquivado === "1";
    const newValue = isCurrentlyArchived ? "0" : "1";
    const actionMsg = isCurrentlyArchived ? "restaurado" : "arquivado";

    try {
      const formData = new FormData();
      formData.append("tabela", "jobs");
      formData.append("id", activeJob.id);
      formData.append("arquivado", newValue);

      const response = await fetch("https://sothink.com.br/app/api/editar", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();

      if (data.sucesso) {
        showToast("success", `Job ${actionMsg} com sucesso!`);
        
        // Atualiza a listagem local
        setJobs((prev) =>
          prev.map((j) => (j.id === activeJob.id ? { ...j, arquivado: newValue } : j))
        );
        
        // Fecha o modal e limpa a seleção
        setActiveJob(null);
        if (onClearSelectedJob) onClearSelectedJob();
      } else {
        showToast("error", data.erro || `Erro ao atualizar status de arquivamento`);
      }
    } catch (error) {
      showToast("error", "Erro de conexão com a API");
    }
  };

  useEffect(() => {
    if (selectedJobFromApp) {
      setActiveJob(selectedJobFromApp);
    }
  }, [selectedJobFromApp]);

  // Modificado para respeitar a visualização de arquivados
  const filteredJobs = jobs?.filter((j) => {
    // Lógica de Arquivados
    const isArchived = (j as any).arquivado === 1 || (j as any).arquivado === "1";
    if (showArchived && !isArchived) return false; // Se quer ver arquivados, esconde os ativos
    if (!showArchived && isArchived) return false; // Se quer ver ativos, esconde os arquivados

    const matchesSearch =
      j.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.nome_job?.toLowerCase().includes(searchTerm.toLowerCase());

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

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: targetStatus } : j))
    );

    try {
      const formData = new FormData();
      formData.append("tabela", "jobs");
      formData.append("id", jobId);
      formData.append("status", targetStatus);

      const response = await fetch("https://sothink.com.br/app/api/editar", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.sucesso) {
        if (onSaveJob) {
          await onSaveJob({ id: targetJob.id, status: targetStatus });
        }
        if (targetStatus === "Finalizado") {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          showToast("success", "Job Finalizado! 🎉", targetJob.titulo);
        } else {
          showToast(
            "info",
            "Status Atualizado",
            `Movido para: ${targetStatus}`
          );
        }
      } else {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, status: targetJob.status } : j
          )
        );
        showToast("error", data.erro || "Erro ao atualizar status no banco.");
      }
    } catch (e: any) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: targetJob.status } : j
        )
      );
      showToast("error", "Erro ao mover job", e.message);
    } finally {
      setDraggedJobId(null);
    }
  };

  const handleUpdateActiveJobField = (field: keyof Job, value: any) => {
    if (!activeJob) return;
    const updated = { ...activeJob, [field]: value };
    setActiveJob(updated);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeJob) return;

    const nowStr = new Date().toLocaleString("pt-BR");
    const newCom = {
      id: `cm-${Date.now()}`,
      usuario: loggedUser?.nome || "Usuário",
      cargo: loggedUser?.role || "Membro",
      texto: newCommentText.trim(),
      data_hora: nowStr,
    };

    const updatedComms = [...(activeJob.comentarios || []), newCom];
    handleUpdateActiveJobField("comentarios", updatedComms);
    setNewCommentText("");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Quadro de Jobs
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/50">
              {filteredJobs.length}
            </span>
            {showArchived && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                Visualizando Arquivados
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerencie as demandas da agência em tempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendário
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
          </div>

          {/* BOTÃO PARA ALTERNAR VISUALIZAÇÃO DE ARQUIVADOS */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all border ${
              showArchived
                ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
            }`}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? "Voltar aos Ativos" : "Ver Arquivados"}
          </button>

          <button
            onClick={onOpenNewJobModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />+ Novo Job
          </button>
        </div>
      </div>

      {/* Barras de Filtro */}
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
          {usuarios.map((u) => (
            <option key={u.id} value={u.nome}>
              {u.nome} {u.cargo ? `(${u.cargo})` : ""}
            </option>
          ))}
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

      {/* KANBAN */}
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
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
                    {col.title}
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 font-black text-[10px] text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-xs shrink-0">
                    {columnJobs.length}
                  </span>
                </div>

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
                              {job.nome_fantasia}
                            </span>
                          </div>

                          <div className="font-semibold text-sm leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
                            {job.titulo || job.nome_job}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-medium">
                                📅{" "}
                                {job.data_inicio
                                  ? formatDateSafe(job.data_inicio, "short")
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

                            <div className="flex items-center gap-2 shrink-0">
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
                                <span className="hidden sm:block">
                                  {job.prioridade}
                                </span>
                              </div>
                              {job.responsavel && (
                                <div
                                  className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-[10px] font-extrabold shadow-sm"
                                  title={`Responsável: ${job.responsavel}`}
                                >
                                  {getInitials(job.responsavel)}
                                </div>
                              )}
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

      {/* CALENDAR */}
      {viewMode === "calendar" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" /> Cronograma
              Semanal & Mensal de Jobs
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
                    {job.nome_fantasia}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 font-bold text-[10px]">
                    {job.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {job.titulo}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Início: {formatDateSafe(job.data_inicio)}</span>
                  <span className="font-bold text-rose-600">
                    Entrega: {formatDateSafe(job.data_entrega)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
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
                <th className="pb-3 text-right">Prazo Inicio</th>
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
                    {job.nome_fantasia}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 font-bold text-[10px] text-indigo-600">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 font-bold">{job.prioridade}</td>
                  <td className="py-3">{job.responsavel}</td>
                  <td className="py-3 text-right font-mono">
                    {formatDateSafe(job.data_inicio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAILED JOB MODAL */}
      {activeJob && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 pt-10 overflow-y-auto"
          onClick={() => {
            setActiveJob(null);
            if (onClearSelectedJob) onClearSelectedJob();
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/50">
                    {activeJob.nome_fantasia}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {activeJob.id}
                  </span>
                  {((activeJob as any).arquivado === 1 || (activeJob as any).arquivado === "1") && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200/50">
                      Arquivado
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={activeJob.titulo}
                  onChange={(e) =>
                    handleUpdateActiveJobField("titulo", e.target.value)
                  }
                  className="w-full text-xl font-extrabold text-slate-900 dark:text-white bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 py-1 rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  title="Salvar alterações no banco"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </button>

                <div className="flex gap-2">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              <div className="lg:col-span-2 space-y-6">
                {/* Briefing */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> Briefing
                      do Job
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={activeJob.briefing || ""}
                    onChange={(e) =>
                      handleUpdateActiveJobField("briefing", e.target.value)
                    }
                    placeholder="Escreva o briefing detalhado do job..."
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                {/* Checklist */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />{" "}
                      Checklist (
                      {activeJob.checklists?.filter((c) => c.concluido)
                        .length || 0}
                      /{activeJob.checklists?.length || 0})
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {activeJob.checklists?.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative"
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={item.concluido}
                            onChange={(e) => {
                              const updated = [...(activeJob.checklists || [])];
                              updated[idx] = {
                                ...updated[idx],
                                concluido: e.target.checked,
                              };
                              handleUpdateActiveJobField("checklists", updated);
                            }}
                            className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={item.texto}
                            placeholder="O que precisa ser feito?"
                            onChange={(e) => {
                              const updated = [...(activeJob.checklists || [])];
                              updated[idx] = {
                                ...updated[idx],
                                texto: e.target.value,
                              };
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
                            onClick={async () => {
                              const itemToRemove = activeJob.checklists?.[idx];
                              const updated = activeJob.checklists?.filter(
                                (_, i) => i !== idx
                              );
                              handleUpdateActiveJobField("checklists", updated);

                              if (
                                itemToRemove &&
                                !String(itemToRemove.id).startsWith("new-")
                              ) {
                                try {
                                  await fetch(
                                    `https://sothink.com.br/app/api/deletar?id=${itemToRemove.id}&tabela=jobs_checklists`
                                  );
                                } catch (e) {
                                  console.error("Erro ao deletar checklist", e);
                                }
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pl-6 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                          <div className="flex-1">
                            <input
                              type="date"
                              value={item.data || ""}
                              onChange={(e) => {
                                const updated = [
                                  ...(activeJob.checklists || []),
                                ];
                                updated[idx] = {
                                  ...updated[idx],
                                  data: e.target.value,
                                };
                                handleUpdateActiveJobField(
                                  "checklists",
                                  updated
                                );
                              }}
                              className="w-full text-[10px] bg-transparent text-slate-500 border-none outline-none focus:ring-0 p-0"
                            />
                          </div>
                          <div className="flex-1">
                            <select
                              value={item.responsavel || ""}
                              onChange={(e) => {
                                const updated = [
                                  ...(activeJob.checklists || []),
                                ];
                                updated[idx] = {
                                  ...updated[idx],
                                  responsavel: e.target.value,
                                };
                                handleUpdateActiveJobField(
                                  "checklists",
                                  updated
                                );
                              }}
                              className="w-full text-[10px] bg-transparent text-slate-500 border-none outline-none focus:ring-0 p-0"
                            >
                              <option value="">Sem responsável</option>
                              {usuarios.map((u) => (
                                <option key={u.id} value={u.nome}>
                                  {u.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newItem = {
                          id: `new-chk-${Date.now()}-${Math.random()
                            .toString(36)
                            .substring(2, 6)}`,
                          texto: "",
                          concluido: false,
                          responsavel: "",
                          data: "",
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

                {/* Anexos */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-500" /> Anexos &
                      Arquivos do Job ({activeJob.anexos?.length || 0})
                    </h4>
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95">
                      <Upload className="w-3.5 h-3.5" /> + Anexar
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {!activeJob.anexos || activeJob.anexos.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-center text-slate-400 text-xs space-y-1">
                      <Paperclip className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">
                        Nenhum arquivo anexado.
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
                            <div className="flex-1 min-w-0">
                              <h5
                                className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate"
                                title={anx.nome}
                              >
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
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAnexo(anx.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

                {/* Comentários */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />{" "}
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

              {/* BARRA LATERAL DIREITA */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">
                  Parâmetros do Job
                </h4>

                <div className="relative">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assessor Responsável
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 transition-colors"
                  >
                    {activeJob.responsavel ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                          {getInitials(activeJob.responsavel)}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {activeJob.responsavel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Sem responsável...</span>
                    )}
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        showUserDropdown ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-20 overflow-hidden">
                      <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateActiveJobField("responsavel", "");
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          Nenhum
                        </button>
                        {usuarios.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              handleUpdateActiveJobField("responsavel", u.nome);
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {getInitials(u.nome)}
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                              {u.nome}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Atual
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
                        "prioridade",
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
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={activeJob.data_inicio || ""}
                    onChange={(e) =>
                      handleUpdateActiveJobField("data_inicio", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-indigo-600 mb-3"
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

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={
                        activeJob.permitir_acesso_cliente === true ||
                        activeJob.permitir_acesso_cliente === "1" ||
                        activeJob.permitir_acesso_cliente === 1
                      }
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

                {/* BOTÕES DE AÇÃO: Excluir e Arquivar/Restaurar */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleDeleteJob}
                    className="w-full px-4 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-600 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Job
                  </button>

                  <button
                    type="button"
                    onClick={handleArchiveToggle}
                    className="w-full px-4 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-600 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Archive className="w-4 h-4" /> 
                    {((activeJob as any).arquivado === 1 || (activeJob as any).arquivado === "1") ? "Restaurar Job" : "Arquivar Job"}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};