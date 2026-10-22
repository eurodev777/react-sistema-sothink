import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { User } from "../types";
const API_URL = "https://sothink.com.br/app/api/operacional";
const USERS_API_URL = "https://sothink.com.br/app/api/listar?tabela=usuarios";
const CLIENTS_API_URL = "https://sothink.com.br/app/api/listar?tabela=clientes";
const CREATE_JOB_API = "https://sothink.com.br/app/api/inserir?tabela=jobs";
type AreaOperacional =
  | "CS ATENDIMENTO"
  | "SOCIAL"
  | "TRÁFEGO"
  | "PROGRAMAÇÃO"
  | "COMERCIAL"
  | "FINANCEIRO";
type PrioridadeOperacional = "Baixo" | "Médio" | "Alto" | "Crítico";
type StatusOperacional = "PENDENTE" | "EM ANDAMENTO" | "CONCLUÍDO" | "PAUSADO";
interface AssuntoOperacional {
  id: string | number;
  area: AreaOperacional;
  titulo: string;
  descricao?: string;
  prioridade?: PrioridadeOperacional;
  status?: StatusOperacional;
  responsavel_id?: string;
  responsavel_nome?: string;
  data_inicio?: string;
  data_entrega?: string;
  ordem?: number | string;
  criador_id?: string;
  criador_nome?: string;
  data_criacao?: string;
  data_atualizacao?: string;
}
interface OperacionalViewProps {
  users: User[];
  currentUser: User | null;
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    desc?: string,
  ) => void;
}
interface FormAssunto {
  area: AreaOperacional;
  titulo: string;
  descricao: string;
  prioridade: PrioridadeOperacional;
  status: StatusOperacional;
  responsavel_id: string;
  responsavel_nome: string;
  data_inicio: string;
  data_entrega: string;
}
type JobPrioridade = "Baixo" | "Médio" | "Alto" | "Crítico";
const JOB_STATUS_OPTIONS = [
  "Novos Jobs (Análise)",
  "Aguardando Terceiros",
  "Programado",
  "Em Andamento",
  "Aprovação Interna",
  "Revisão",
  "Aprovação Cliente",
  "Publicar / Enviar para Produção",
  "Finalizado",
  "Pausado / Cancelado",
] as const;
const JOB_TAGS = [
  "SOCIAL",
  "TRÁFEGO",
  "PROGRAMAÇÃO",
  "AJUSTES",
  "ADVERTISING",
  "ESTRATÉGIA",
  "DESIGN",
  "ENVIAR PARA PRODUÇÃO",
] as const;
interface ClienteJob {
  id: string;
  nome_fantasia?: string;
  razao_social?: string;
}
interface JobCreateForm {
  cliente_id: string;
  titulo: string;
  briefing: string;
  prioridade: JobPrioridade;
  status: string;
  responsavel: string;
  data_inicio: string;
  data_entrega: string;
  etiquetas: string[];
}
const emptyJobForm = (): JobCreateForm => ({
  cliente_id: "",
  titulo: "",
  briefing: "",
  prioridade: "Médio",
  status: "Novos Jobs (Análise)",
  responsavel: "",
  data_inicio: new Date().toISOString().slice(0, 10),
  data_entrega: "",
  etiquetas: [],
});
const mapOperationalPriorityToJob = (
  priority?: PrioridadeOperacional,
): JobPrioridade => {
  if (priority === "Baixo") return "Baixo";
  if (priority === "Alto") return "Alto";
  if (priority === "Crítico") return "Crítico";
  return "Médio";
};
const mapOperationalStatusToJob = (status?: StatusOperacional): string => {
  if (status === "EM ANDAMENTO") return "Em Andamento";
  if (status === "CONCLUÍDO") return "Finalizado";
  if (status === "PAUSADO") return "Pausado / Cancelado";
  return "Novos Jobs (Análise)";
};
const mapOperationalAreaToTags = (area?: AreaOperacional): string[] => {
  if (area === "SOCIAL") return ["SOCIAL"];
  if (area === "TRÁFEGO") return ["TRÁFEGO"];
  if (area === "PROGRAMAÇÃO") return ["PROGRAMAÇÃO"];
  return [];
};
const COLUNAS: {
  id: AreaOperacional;
  title: string;
  color: string;
}[] = [
  {
    id: "CS ATENDIMENTO",
    title: "CS ATENDIMENTO",
    color: "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20",
  },
  {
    id: "SOCIAL",
    title: "SOCIAL",
    color: "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20",
  },
  {
    id: "TRÁFEGO",
    title: "TRÁFEGO",
    color: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
  },
  {
    id: "PROGRAMAÇÃO",
    title: "PROGRAMAÇÃO",
    color: "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20",
  },
  {
    id: "COMERCIAL",
    title: "COMERCIAL",
    color: "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  },
  {
    id: "FINANCEIRO",
    title: "FINANCEIRO",
    color: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
  },
];
const emptyForm = (): FormAssunto => ({
  area: "CS ATENDIMENTO",
  titulo: "",
  descricao: "",
  prioridade: "Médio",
  status: "PENDENTE",
  responsavel_id: "",
  responsavel_nome: "",
  data_inicio: new Date().toISOString().slice(0, 10),
  data_entrega: "",
});
const safeDate = (value?: string) => {
  if (!value || value.startsWith("0000")) return "";
  return value.split("T")[0].split(" ")[0];
};
// Critério idêntico ao ORDER BY da API, inclusive para registros antigos com ordem 0.
const compareOrdemOperacional = (
  a: AssuntoOperacional,
  b: AssuntoOperacional,
) => {
  const diferenca = Number(a.ordem ?? 0) - Number(b.ordem ?? 0);
  if (diferenca !== 0) return diferenca;
  const da = safeDate(a.data_entrega) || "9999-12-31";
  const db = safeDate(b.data_entrega) || "9999-12-31";
  if (da !== db) return da.localeCompare(db);
  return String(b.id).localeCompare(String(a.id), "pt-BR", { numeric: true });
};

// Organiza TODAS as tarefas da(s) coluna(s), inclusive as ocultas pelos filtros.
const reordenarAssuntosLocalmente = (
  anteriores: AssuntoOperacional[],
  id: string,
  areaDestino: AreaOperacional,
  idAlvo: string | null,
  posicao: "before" | "after",
): AssuntoOperacional[] => {
  const movido = anteriores.find((item) => String(item.id) === id);
  if (!movido || idAlvo === id) return anteriores;
  const areaOrigem = movido.area;
  const origem = anteriores
    .filter((item) => item.area === areaOrigem && String(item.id) !== id)
    .sort(compareOrdemOperacional);
  const destino = (
    areaDestino === areaOrigem
      ? origem
      : anteriores
          .filter((item) => item.area === areaDestino)
          .sort(compareOrdemOperacional)
  ).slice();

  const indiceAlvo = idAlvo
    ? destino.findIndex((item) => String(item.id) === idAlvo)
    : -1;
  // Destino desconhecido: não alterar a ordem até o servidor confirmar.
  if (idAlvo && indiceAlvo === -1) return anteriores;
  const indiceInsercao =
    indiceAlvo === -1
      ? destino.length
      : indiceAlvo + (posicao === "after" ? 1 : 0);
  destino.splice(indiceInsercao, 0, { ...movido, area: areaDestino });

  const atualizados = new Map<string, AssuntoOperacional>();
  if (areaOrigem !== areaDestino) {
    origem.forEach((item, index) =>
      atualizados.set(String(item.id), { ...item, ordem: index + 1 }),
    );
  }
  destino.forEach((item, index) =>
    atualizados.set(String(item.id), {
      ...item,
      area: areaDestino,
      ordem: index + 1,
    }),
  );
  return anteriores.map((item) => atualizados.get(String(item.id)) || item);
};

const formatDate = (value?: string) => {
  const date = safeDate(value);
  if (!date) return "-";
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("pt-BR");
};
const initials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};
const priorityClass = (priority?: string) => {
  if (priority === "Crítico")
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
  if (priority === "Alto")
    return "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300";
  if (priority === "Médio")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
};
const statusClass = (status?: string) => {
  if (status === "CONCLUÍDO")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (status === "EM ANDAMENTO")
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
  if (status === "PAUSADO")
    return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
};
const deadlineClass = (date?: string, status?: string) => {
  const key = safeDate(date);
  if (!key || status === "CONCLUÍDO")
    return "text-slate-500 dark:text-slate-400";
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  if (key < todayKey) return "text-rose-600 dark:text-rose-400 font-extrabold";
  if (key === todayKey)
    return "text-amber-600 dark:text-amber-300 font-extrabold";
  return "text-slate-500 dark:text-slate-400";
};
async function parseJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `Erro HTTP ${response.status}`);
  }
}
export const OperacionalView: React.FC<OperacionalViewProps> = ({
  users,
  currentUser,
  showToast,
}) => {
  const [assuntos, setAssuntos] = useState<AssuntoOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuariosApi, setUsuariosApi] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [clientesApi, setClientesApi] = useState<ClienteJob[]>([]);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobSaving, setJobSaving] = useState(false);
  const [jobForm, setJobForm] = useState<JobCreateForm>(emptyJobForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("all");
  const [filterPrioridade, setFilterPrioridade] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [activeAssunto, setActiveAssunto] = useState<AssuntoOperacional | null>(
    null,
  );
  const [form, setForm] = useState<FormAssunto>(emptyForm());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const savingOrderRef = useRef(false);
  const colaboradores = useMemo(() => {
    const todos = [...(Array.isArray(users) ? users : []), ...usuariosApi];
    const porId = new Map<string, any>();
    todos.forEach((user: any) => {
      const id = String(user?.id ?? user?.usuario_id ?? "").trim();
      if (!id) return;
      const nomeExibicao = String(
        user?.nome || user?.name || user?.usuario || user?.email || "",
      ).trim();
      if (!nomeExibicao) return;
      const ativo = user?.ativo;
      const estaInativo =
        ativo === false ||
        ativo === 0 ||
        ativo === "0" ||
        String(ativo).toLowerCase() === "false";
      if (estaInativo) return;
      const atual = porId.get(id);
      porId.set(id, {
        ...(atual || {}),
        ...user,
        id,
        nome: nomeExibicao,
      });
    });
    return Array.from(porId.values()).sort((a: any, b: any) =>
      String(a?.nome || "").localeCompare(String(b?.nome || ""), "pt-BR"),
    );
  }, [users, usuariosApi]);
  const loadUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const response = await fetch(USERS_API_URL, {
        cache: "no-store",
      });
      const data = await parseJson(response);
      if (!response.ok || data?.erro) {
        throw new Error(data?.erro || `Erro HTTP ${response.status}`);
      }
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.dados)
          ? data.dados
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setUsuariosApi(lista);
    } catch (error: any) {
      console.error("Erro ao carregar colaboradores do Operacional:", error);
      setUsuariosApi([]);
      showToast(
        "error",
        "Erro ao carregar colaboradores",
        error?.message || "Não foi possível carregar a equipe.",
      );
    } finally {
      setLoadingUsuarios(false);
    }
  };
  const loadClientes = async () => {
    try {
      const response = await fetch(CLIENTS_API_URL, { cache: "no-store" });
      const data = await parseJson(response);
      if (!response.ok || data?.erro) {
        throw new Error(data?.erro || `Erro HTTP ${response.status}`);
      }
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.dados)
          ? data.dados
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setClientesApi(
        lista
          .filter((cliente: any) => cliente?.id)
          .sort((a: any, b: any) =>
            String(a?.nome_fantasia || a?.razao_social || "").localeCompare(
              String(b?.nome_fantasia || b?.razao_social || ""),
              "pt-BR",
            ),
          ),
      );
    } catch (error: any) {
      console.error("Erro ao carregar clientes do Operacional:", error);
      setClientesApi([]);
      showToast(
        "error",
        "Erro ao carregar clientes",
        error?.message || "Não foi possível carregar os clientes.",
      );
    }
  };
  const loadAssuntos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}?action=read`, {
        cache: "no-store",
      });
      const data = await parseJson(response);
      if (!response.ok || data?.erro) {
        throw new Error(data?.erro || `Erro HTTP ${response.status}`);
      }
      setAssuntos(Array.isArray(data) ? data : data?.dados || []);
    } catch (error: any) {
      showToast(
        "error",
        "Erro ao carregar Operacional",
        error?.message || "Não foi possível carregar os assuntos.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAssuntos();
    loadUsuarios();
    loadClientes();
  }, []);
  const availableDates = useMemo(
    () =>
      Array.from(
        new Set(
          assuntos
            .map((item) => safeDate(item.data_entrega || item.data_inicio))
            .filter(Boolean),
        ),
      ).sort(),
    [assuntos],
  );
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return assuntos.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.titulo || "")
          .toLowerCase()
          .includes(term) ||
        String(item.descricao || "")
          .toLowerCase()
          .includes(term) ||
        String(item.responsavel_nome || "")
          .toLowerCase()
          .includes(term);
      const matchesResponsavel =
        filterResponsavel === "all" ||
        String(item.responsavel_id || "") === String(filterResponsavel);
      const matchesPrioridade =
        filterPrioridade === "all" || item.prioridade === filterPrioridade;
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;
      const itemDate = safeDate(item.data_entrega || item.data_inicio);
      const matchesDate = filterDate === "all" || itemDate === filterDate;
      return (
        matchesSearch &&
        matchesResponsavel &&
        matchesPrioridade &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    assuntos,
    searchTerm,
    filterResponsavel,
    filterPrioridade,
    filterStatus,
    filterDate,
  ]);
  const columnItems = (area: AreaOperacional) =>
    filtered.filter((item) => item.area === area).sort(compareOrdemOperacional);
  const openNew = () => {
    setForm(emptyForm());
    setNewModalOpen(true);
  };
  const openAssunto = (item: AssuntoOperacional) => {
    setActiveAssunto(item);
    setForm({
      area: item.area || "CS ATENDIMENTO",
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      prioridade: item.prioridade || "Médio",
      status: item.status || "PENDENTE",
      responsavel_id: String(item.responsavel_id || ""),
      responsavel_nome: item.responsavel_nome || "",
      data_inicio: safeDate(item.data_inicio),
      data_entrega: safeDate(item.data_entrega),
    });
  };
  const openJobFromAssunto = () => {
    if (!activeAssunto) return;
    setJobForm({
      cliente_id: "",
      titulo: form.titulo || activeAssunto.titulo || "",
      briefing: form.descricao || activeAssunto.descricao || "",
      prioridade: mapOperationalPriorityToJob(
        form.prioridade || activeAssunto.prioridade,
      ),
      status: mapOperationalStatusToJob(form.status || activeAssunto.status),
      responsavel:
        form.responsavel_nome || activeAssunto.responsavel_nome || "",
      data_inicio:
        form.data_inicio ||
        safeDate(activeAssunto.data_inicio) ||
        new Date().toISOString().slice(0, 10),
      data_entrega:
        form.data_entrega || safeDate(activeAssunto.data_entrega) || "",
      etiquetas: mapOperationalAreaToTags(form.area || activeAssunto.area),
    });
    setJobModalOpen(true);
  };
  const toggleJobTag = (tag: string) => {
    setJobForm((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(tag)
        ? prev.etiquetas.filter((item) => item !== tag)
        : [...prev.etiquetas, tag],
    }));
  };
  const createJobFromAssunto = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jobForm.cliente_id) {
      showToast("error", "Selecione o cliente do Job.");
      return;
    }
    if (!jobForm.titulo.trim()) {
      showToast("error", "Informe o título do Job.");
      return;
    }
    try {
      setJobSaving(true);
      const body = new FormData();
      body.append("tabela", "jobs");
      body.append("cliente_id", jobForm.cliente_id);
      body.append("titulo", jobForm.titulo.trim());
      body.append("briefing", jobForm.briefing.trim());
      body.append("descricao", "");
      body.append("prioridade", jobForm.prioridade);
      body.append("status", jobForm.status);
      body.append("data_inicio", jobForm.data_inicio || "");
      body.append("data_entrega", jobForm.data_entrega || "");
      body.append("data_criacao", new Date().toISOString().slice(0, 10));
      body.append("responsavel", jobForm.responsavel || "");
      body.append("etiquetas", JSON.stringify(jobForm.etiquetas));
      body.append("permitir_acesso_cliente", "0");
      body.append("ordem", "0");
      body.append("arquivado", "0");
      body.append("links", "[]");
      const response = await fetch(CREATE_JOB_API, {
        method: "POST",
        body,
      });
      const data = await parseJson(response);
      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível criar o Job.");
      }
      const cliente = clientesApi.find(
        (item) => String(item.id) === String(jobForm.cliente_id),
      );
      setJobModalOpen(false);
      showToast(
        "success",
        "Job criado no Kanban!",
        `${jobForm.titulo} · ${
          cliente?.nome_fantasia || cliente?.razao_social || "Cliente"
        }`,
      );
    } catch (error: any) {
      showToast(
        "error",
        "Erro ao criar Job",
        error?.message || "Não foi possível criar o Job no Kanban.",
      );
    } finally {
      setJobSaving(false);
    }
  };
  const onSelectResponsavel = (id: string) => {
    const selected = colaboradores.find(
      (user: any) => String(user.id) === String(id),
    ) as any;
    setForm((prev) => ({
      ...prev,
      responsavel_id: id,
      responsavel_nome: selected?.nome || "",
    }));
  };
  const saveNew = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.titulo.trim()) {
      showToast("error", "Informe o título do assunto.");
      return;
    }
    try {
      setSaving(true);
      const body = new FormData();
      body.append("action", "create");
      Object.entries(form).forEach(([key, value]) =>
        body.append(key, String(value ?? "")),
      );
      body.append("criador_id", String((currentUser as any)?.id || ""));
      body.append(
        "criador_nome",
        String((currentUser as any)?.nome || (currentUser as any)?.name || ""),
      );
      const response = await fetch(API_URL, { method: "POST", body });
      const data = await parseJson(response);
      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível criar o assunto.");
      }
      setNewModalOpen(false);
      setForm(emptyForm());
      await loadAssuntos();
      showToast("success", "Novo assunto criado!");
    } catch (error: any) {
      showToast("error", "Erro ao criar assunto", error?.message);
    } finally {
      setSaving(false);
    }
  };
  const saveActive = async () => {
    if (!activeAssunto?.id || !form.titulo.trim()) return;
    try {
      setSaving(true);
      const body = new FormData();
      body.append("action", "update");
      body.append("id", String(activeAssunto.id));
      Object.entries(form).forEach(([key, value]) =>
        body.append(key, String(value ?? "")),
      );
      const response = await fetch(API_URL, { method: "POST", body });
      const data = await parseJson(response);
      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível salvar o assunto.");
      }
      setActiveAssunto(null);
      await loadAssuntos();
      showToast("success", "Assunto atualizado!");
    } catch (error: any) {
      showToast("error", "Erro ao salvar assunto", error?.message);
    } finally {
      setSaving(false);
    }
  };
  const deleteActive = async () => {
    if (!activeAssunto?.id) return;
    if (
      !window.confirm(
        `Excluir permanentemente o assunto "${activeAssunto.titulo}"?`,
      )
    )
      return;
    try {
      setSaving(true);
      const body = new FormData();
      body.append("action", "delete");
      body.append("id", String(activeAssunto.id));
      const response = await fetch(API_URL, { method: "POST", body });
      const data = await parseJson(response);
      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível excluir o assunto.");
      }
      setActiveAssunto(null);
      await loadAssuntos();
      showToast("info", "Assunto excluído.");
    } catch (error: any) {
      showToast("error", "Erro ao excluir assunto", error?.message);
    } finally {
      setSaving(false);
    }
  };
  const deleteAssuntoDireto = async (item: AssuntoOperacional) => {
    if (!item?.id) return;
    if (!window.confirm(`Excluir permanentemente o assunto "${item.titulo}"?`))
      return;
    try {
      const body = new FormData();
      body.append("action", "delete");
      body.append("id", String(item.id));
      const response = await fetch(API_URL, { method: "POST", body });
      const data = await parseJson(response);
      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível excluir o assunto.");
      }
      setAssuntos((prev) =>
        prev.filter((assunto) => String(assunto.id) !== String(item.id)),
      );
      if (activeAssunto && String(activeAssunto.id) === String(item.id)) {
        setActiveAssunto(null);
      }
      showToast("info", "Assunto excluído.");
    } catch (error: any) {
      showToast("error", "Erro ao excluir assunto", error?.message);
    }
  };
  const limparArraste = () => {
    draggedIdRef.current = null;
    setDraggedId(null);
    setDragOver(null);
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    id: string | number,
  ) => {
    if (savingOrderRef.current) {
      event.preventDefault();
      return;
    }
    const chave = String(id);
    draggedIdRef.current = chave;
    setDraggedId(chave);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", chave);
  };

  const handleDragOverCard = (
    event: React.DragEvent<HTMLElement>,
    item: AssuntoOperacional,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (savingOrderRef.current || draggedIdRef.current === String(item.id))
      return;
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDragOver((prev) =>
      prev?.id === String(item.id) && prev.position === position
        ? prev
        : { id: String(item.id), position },
    );
  };

  const moveAssunto = async (
    id: string,
    areaDestino: AreaOperacional,
    idAlvo: string | null,
    posicao: "before" | "after" = "after",
  ) => {
    if (savingOrderRef.current) return;
    const movido = assuntos.find((item) => String(item.id) === id);
    if (!movido || idAlvo === id) return;
    // Soltar no espaço vazio da própria coluna mantém a ordem, exceto
    // quando o card não é o último (nesse caso, envia para o final).
    const antes = assuntos;
    const depois = reordenarAssuntosLocalmente(
      antes,
      id,
      areaDestino,
      idAlvo,
      posicao,
    );
    if (depois === antes) return;
    if (
      antes.every(
        (item, index) =>
          item.area === depois[index].area &&
          Number(item.ordem) === Number(depois[index].ordem),
      )
    )
      return;

    savingOrderRef.current = true;
    setSavingOrder(true);
    setAssuntos(depois);
    try {
      const body = new FormData();
      body.append("action", "reorder");
      body.append("id", id);
      body.append("area", areaDestino);
      if (idAlvo) body.append("target_id", idAlvo);
      body.append("position", posicao);

      const response = await fetch(API_URL, { method: "POST", body });
      const data = await parseJson(response);
      if (!response.ok || data?.sucesso !== true) {
        throw new Error(
          data?.erro || "Não foi possível salvar a ordem dos cards.",
        );
      }
      // A ordem que vale é a confirmada pela API, incluindo os cards filtrados.
      if (Array.isArray(data.itens)) {
        const ordens = new Map<
          string,
          { area: AreaOperacional; ordem: number }
        >(
          data.itens.map((item: any) => [
            String(item.id),
            { area: item.area as AreaOperacional, ordem: Number(item.ordem) },
          ]),
        );
        setAssuntos((prev) =>
          prev.map((item) => {
            const atualizado = ordens.get(String(item.id));
            return atualizado ? { ...item, ...atualizado } : item;
          }),
        );
      }
      if (movido.area !== areaDestino) {
        showToast("info", "Assunto movido", `Área: ${areaDestino}`);
      }
    } catch (error: any) {
      setAssuntos(antes);
      showToast("error", "Erro ao salvar ordem", error?.message);
    } finally {
      savingOrderRef.current = false;
      setSavingOrder(false);
    }
  };

  const handleDropCard = (
    event: React.DragEvent<HTMLElement>,
    alvo: AssuntoOperacional,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const id = draggedIdRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    const posicao =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    limparArraste();
    if (id) void moveAssunto(id, alvo.area, String(alvo.id), posicao);
  };

  const handleDropColumn = (
    event: React.DragEvent<HTMLElement>,
    area: AreaOperacional,
  ) => {
    event.preventDefault();
    const id = draggedIdRef.current;
    limparArraste();
    if (id) void moveAssunto(id, area, null, "after");
  };

  const renderFormFields = () => (
    <div className="space-y-4 text-xs">
      <div>
        <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
          Assunto *
        </label>
        <input
          value={form.titulo}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, titulo: event.target.value }))
          }
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Ex.: Ajustar processo de aprovação de social"
        />
      </div>
      <div>
        <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
          Descrição / alinhamento
        </label>
        <textarea
          rows={4}
          value={form.descricao}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, descricao: event.target.value }))
          }
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Descreva o que precisa ser tratado pela equipe..."
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
            Área
          </label>
          <select
            value={form.area}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                area: event.target.value as AreaOperacional,
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
          >
            {COLUNAS.map((coluna) => (
              <option key={coluna.id} value={coluna.id}>
                {coluna.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
            Colaborador responsável
          </label>
          <select
            value={form.responsavel_id}
            onChange={(event) => onSelectResponsavel(event.target.value)}
            disabled={loadingUsuarios && colaboradores.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 disabled:opacity-60"
          >
            <option value="">
              {loadingUsuarios && colaboradores.length === 0
                ? "Carregando equipe..."
                : "Sem responsável"}
            </option>
            {colaboradores.map((user: any) => (
              <option key={String(user.id)} value={String(user.id)}>
                {user.nome}
                {user.cargo ? ` (${user.cargo})` : ""}
              </option>
            ))}
          </select>
          {!loadingUsuarios && colaboradores.length === 0 && (
            <p className="mt-1 text-[10px] font-bold text-rose-500">
              Nenhum colaborador ativo foi retornado pela tabela usuarios.
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
            Prioridade
          </label>
          <select
            value={form.prioridade}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                prioridade: event.target.value as PrioridadeOperacional,
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option>Baixo</option>
            <option>Médio</option>
            <option>Alto</option>
            <option>Crítico</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
            Andamento
          </label>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                status: event.target.value as StatusOperacional,
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option>PENDENTE</option>
            <option>EM ANDAMENTO</option>
            <option>CONCLUÍDO</option>
            <option>PAUSADO</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
            Data de início
          </label>
          <input
            type="date"
            value={form.data_inicio}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, data_inicio: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
            Prazo / entrega
          </label>
          <input
            type="date"
            value={form.data_entrega}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, data_entrega: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>
    </div>
  );
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <BriefcaseBusiness className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Quadro Geral — Operacional
            <span className="rounded-full border border-indigo-200/50 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              {filtered.length}
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Demandas internas da equipe. Este quadro não possui vínculo com
            clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          NOVO ASSUNTO
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar assunto..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <select
          value={filterResponsavel}
          onChange={(event) => setFilterResponsavel(event.target.value)}
          disabled={loadingUsuarios && colaboradores.length === 0}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 disabled:opacity-60"
        >
          <option value="all">
            {loadingUsuarios && colaboradores.length === 0
              ? "Carregando colaboradores..."
              : "Todos os Colaboradores"}
          </option>
          {colaboradores.map((user: any) => (
            <option key={String(user.id)} value={String(user.id)}>
              {user.nome}
            </option>
          ))}
        </select>
        <select
          value={filterPrioridade}
          onChange={(event) => setFilterPrioridade(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="all">Todas as Urgências</option>
          <option>Baixo</option>
          <option>Médio</option>
          <option>Alto</option>
          <option>Crítico</option>
        </select>
        <select
          value={filterDate}
          onChange={(event) => setFilterDate(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="all">Todas as Datas</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>
              {formatDate(date)}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="all">Todos os Andamentos</option>
          <option>PENDENTE</option>
          <option>EM ANDAMENTO</option>
          <option>CONCLUÍDO</option>
          <option>PAUSADO</option>
        </select>
      </div>
      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="flex min-h-[600px] gap-4 overflow-x-auto pb-6 pt-1">
          {COLUNAS.map((coluna) => {
            const items = columnItems(coluna.id);
            return (
              <section
                key={coluna.id}
                onDragOver={(event) => {
                  if (draggedIdRef.current && !savingOrderRef.current) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(event) => handleDropColumn(event, coluna.id)}
                className={`flex max-h-[760px] w-72 shrink-0 flex-col overflow-hidden rounded-2xl border p-3 shadow-sm ${coluna.color}`}
              >
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 dark:border-slate-800/60">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {coluna.title}
                  </h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                    {items.length}
                  </span>
                </div>
                <div className="my-2 flex-1 space-y-3 overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300/70 p-5 text-center text-[11px] italic text-slate-400 dark:border-slate-700">
                      Nenhum assunto nesta coluna
                    </div>
                  ) : (
                    items.map((item) => (
                      <article
                        key={item.id}
                        draggable={!savingOrder}
                        onDragStart={(event) => handleDragStart(event, item.id)}
                        onDragOver={(event) => handleDragOverCard(event, item)}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(event) => handleDropCard(event, item)}
                        onDragEnd={limparArraste}
                        onClick={() => {
                          if (!draggedId && !savingOrder) openAssunto(item);
                        }}
                        title="Arraste para reordenar ou mover para outra área"
                        className={`cursor-grab active:cursor-grabbing space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm transition hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${
                          draggedId === String(item.id) ? "opacity-40" : ""
                        } ${
                          dragOver?.id === String(item.id)
                            ? dragOver.position === "before"
                              ? "border-t-4 border-t-indigo-500"
                              : "border-b-4 border-b-indigo-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold ${priorityClass(
                              item.prioridade,
                            )}`}
                          >
                            {item.prioridade || "Médio"}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold ${statusClass(
                              item.status,
                            )}`}
                          >
                            {item.status || "PENDENTE"}
                          </span>
                        </div>
                        <div>
                          <h4 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
                            {item.titulo}
                          </h4>
                          {item.descricao && (
                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {item.descricao}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-[9px] font-black text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                title={
                                  item.responsavel_nome || "Sem responsável"
                                }
                              >
                                {initials(item.responsavel_nome)}
                              </div>
                              <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {item.responsavel_nome || "Sem responsável"}
                              </span>
                            </div>
                            <span
                              className={`flex shrink-0 items-center gap-1 text-[10px] ${deadlineClass(
                                item.data_entrega,
                                item.status,
                              )}`}
                            >
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(
                                item.data_entrega || item.data_inicio,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteAssuntoDireto(item);
                              }}
                              className="flex h-8 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30"
                              title="Excluir assunto"
                              aria-label={`Excluir ${item.titulo}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {newModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 pt-10 backdrop-blur-sm"
          onClick={() => !saving && setNewModalOpen(false)}
        >
          <form
            onSubmit={saveNew}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Novo Assunto Operacional
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  Demanda interna vinculada à equipe, sem cliente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderFormFields()}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-extrabold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Criar assunto
              </button>
            </div>
          </form>
        </div>
      )}
      {activeAssunto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 pt-10 backdrop-blur-sm"
          onClick={() => !saving && setActiveAssunto(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                  <BriefcaseBusiness className="h-4 w-4 text-indigo-500" />
                  Job Operacional
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  ID #{activeAssunto.id} · criado por{" "}
                  {activeAssunto.criador_nome || "Equipe Sothink"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveAssunto(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderFormFields()}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Transformar este assunto em Job
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    Abre uma segunda tela para completar os dados e criar o Job
                    no Kanban de Jobs.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openJobFromAssunto}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black text-white transition hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  ABRIR JOB NO KANBAN
                </button>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={deleteActive}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="h-4 w-4" />
                Excluir assunto
              </button>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveAssunto(null)}
                  className="px-4 py-2 font-bold text-slate-500"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={saveActive}
                  disabled={saving || !form.titulo.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {jobModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4 pt-8 backdrop-blur-sm"
          onClick={() => !jobSaving && setJobModalOpen(false)}
        >
          <form
            onSubmit={createJobFromAssunto}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                  <BriefcaseBusiness className="h-5 w-5 text-indigo-500" />
                  Criar Job no Kanban
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  Complete os dados abaixo. O Job será criado no quadro oficial
                  de Jobs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setJobModalOpen(false)}
                disabled={jobSaving}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Cliente *
                </label>
                <select
                  required
                  value={jobForm.cliente_id}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      cliente_id: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientesApi.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome_fantasia ||
                        cliente.razao_social ||
                        cliente.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Título do Job *
                </label>
                <input
                  required
                  value={jobForm.titulo}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      titulo: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Responsável
                </label>
                <select
                  value={jobForm.responsavel}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      responsavel: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Sem responsável</option>
                  {colaboradores.map((usuario: any) => (
                    <option key={String(usuario.id)} value={usuario.nome}>
                      {usuario.nome}
                      {usuario.cargo ? ` (${usuario.cargo})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Status atual
                </label>
                <select
                  value={jobForm.status}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      status: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  {JOB_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Grau de urgência
                </label>
                <select
                  value={jobForm.prioridade}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      prioridade: event.target.value as JobPrioridade,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="Baixo">Baixo</option>
                  <option value="Médio">Normal - 7 dias</option>
                  <option value="Alto">Alto</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                    Início
                  </label>
                  <input
                    type="date"
                    value={jobForm.data_inicio}
                    onChange={(event) =>
                      setJobForm((prev) => ({
                        ...prev,
                        data_inicio: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                    Entrega
                  </label>
                  <input
                    type="date"
                    value={jobForm.data_entrega}
                    onChange={(event) =>
                      setJobForm((prev) => ({
                        ...prev,
                        data_entrega: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Briefing
                </label>
                <textarea
                  rows={5}
                  value={jobForm.briefing}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      briefing: event.target.value,
                    }))
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Informações que devem ir para o Job..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block font-bold text-slate-700 dark:text-slate-300">
                  Etiquetas / Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TAGS.map((tag) => {
                    const selected = jobForm.etiquetas.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleJobTag(tag)}
                        className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-extrabold transition ${
                          selected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJobModalOpen(false)}
                disabled={jobSaving}
                className="px-4 py-2 font-bold text-slate-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  jobSaving || !jobForm.cliente_id || !jobForm.titulo.trim()
                }
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
              >
                {jobSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BriefcaseBusiness className="h-4 w-4" />
                )}
                Criar Job no Kanban
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
