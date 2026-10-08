import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  GripVertical,
  History,
  Kanban,
  List,
  Loader2,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Plus,
  Search,
  Target,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

export type EtapaFunil =
  | "CONTATO"
  | "APRESENTACAO"
  | "AQUECIMENTO"
  | "NEGOCIACAO"
  | "FECHAMENTO";

export interface LeadProspeccao {
  id: number;
  empresa: string | null;
  cidade: string | null;
  estado: string | null;
  segmento: string | null;
  site: string | null;
  whatsapp: string | null;
  email: string | null;
  contato_nome: string | null;
  contato_cargo: string | null;
  etapa_funil: EtapaFunil | string | null;
  ordem: number | string | null;
  status: string;
  ultimo_contato: string | null;
  meio_contato: string | null;
  retorno: string;
  interesse: string;
  proxima_acao: string | null;
  followup_tarefa?: string | null;
  followup_status?: string | null;
  observacoes: string | null;
  fonte: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  data_criacao: string;
  data_atualizacao: string;
  ultima_observacao?: string | null;
  ultima_observacao_data?: string | null;
  ultima_observacao_autor?: string | null;
  total_observacoes?: number | string | null;
}

interface InteracaoLead {
  id: number;
  lead_id: number;
  data_contato: string;
  meio_contato: string | null;
  resultado: string | null;
  status_apos: string | null;
  interesse: string | null;
  observacao: string | null;
  proxima_acao: string | null;
  responsavel_nome: string | null;
}

interface ObservacaoLead {
  id: number;
  lead_id: number;
  observacao: string;
  autor_id: string | null;
  autor_nome: string | null;
  data_observacao: string;
  data_criacao?: string | null;
}

interface AgendamentoLead {
  id: number;
  lead_id: number;
  lead_empresa?: string | null;
  lead_contato_nome?: string | null;
  titulo: string;
  data_reuniao: string;
  hora_reuniao: string;
  duracao_minutos: number | string | null;
  tipo_reuniao: string | null;
  local_reuniao: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  participantes: string | null;
  objetivo: string | null;
  observacoes: string | null;
  status: string;
  data_criacao?: string | null;
  data_atualizacao?: string | null;
}

interface UsuarioAgenda {
  id: string;
  nome: string;
  email?: string | null;
  cargo?: string | null;
  ativo?: string | number | boolean | null;
}

interface Notice {
  type: "success" | "error" | "info";
  text: string;
}

interface InteractionForm {
  data_contato: string;
  meio_contato: string;
  resultado: string;
  status_apos: string;
  interesse: string;
  proxima_acao: string;
  observacao: string;
}

interface FollowupForm {
  tarefa: string;
  data: string;
  hora: string;
}

interface NewLeadForm {
  empresa: string;
  contato_nome: string;
  contato_cargo: string;
  cidade: string;
  estado: string;
  segmento: string;
  site: string;
  whatsapp: string;
  email: string;
  interesse: string;
  observacoes: string;
}

interface MeetingForm {
  id?: number;
  lead_id: string;
  titulo: string;
  data_reuniao: string;
  hora_reuniao: string;
  duracao_minutos: string;
  tipo_reuniao: string;
  local_reuniao: string;
  responsavel_id: string;
  responsavel_nome: string;
  participantes: string;
  objetivo: string;
  observacoes: string;
  status: string;
}

interface MeetingAvailabilitySlot {
  hora: string;
  disponivel: boolean;
  tipo?: string | null;
  motivo?: string | null;
}

interface AgendaBlock {
  id: number;
  data_bloqueio: string;
  hora_inicio: string;
  hora_fim: string;
  motivo: string | null;
  autor_id: string | null;
  autor_nome: string | null;
  data_criacao?: string | null;
}

const API_URL = "https://sothink.com.br/app/api/controleads";

const KANBAN_COLUMNS: {
  id: EtapaFunil;
  title: string;
  description: string;
  color: string;
  badge: string;
}[] = [
  {
    id: "CONTATO",
    title: "1. Contato",
    description: "Primeira abordagem e conexão",
    color: "border-sky-500",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  },
  {
    id: "APRESENTACAO",
    title: "2. Apresentação",
    description: "Empresa e solução apresentadas",
    color: "border-indigo-500",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
  {
    id: "AQUECIMENTO",
    title: "3. Aquecimento",
    description: "Nutrição e construção de interesse",
    color: "border-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
  {
    id: "NEGOCIACAO",
    title: "4. Negociação",
    description: "Proposta, objeções e condições",
    color: "border-violet-500",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  },
  {
    id: "FECHAMENTO",
    title: "5. Fechamento",
    description: "Decisão final e conversão",
    color: "border-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
];

const normalizeEtapa = (value?: string | null): EtapaFunil => {
  const stage = safe(value).toUpperCase();
  if (stage === "APRESENTACAO") return "APRESENTACAO";
  if (stage === "AQUECIMENTO") return "AQUECIMENTO";
  if (stage === "NEGOCIACAO") return "NEGOCIACAO";
  if (stage === "FECHAMENTO") return "FECHAMENTO";
  return "CONTATO";
};

const STATUS_OPTIONS = [
  "NOVO",
  "EM PROSPECÇÃO",
  "CONTATO ENVIADO",
  "AGUARDANDO RETORNO",
  "RETORNOU",
  "INTERESSADO",
  "REUNIÃO AGENDADA",
  "SEM INTERESSE",
  "SEM RETORNO",
  "CONVERTIDO",
];

const MEIO_OPTIONS = [
  "WhatsApp",
  "Telefone",
  "E-mail",
  "Instagram",
  "LinkedIn",
  "Outro",
];

const RETORNO_OPTIONS = [
  "AGUARDANDO RETORNO",
  "RESPONDEU",
  "NÃO RESPONDEU",
  "PEDIU RETORNO",
  "REUNIÃO AGENDADA",
  "SEM INTERESSE",
];

const INTERESSE_OPTIONS = ["NÃO AVALIADO", "BAIXO", "MÉDIO", "ALTO"];

const FOLLOWUP_TASK_OPTIONS = [
  "Retornar contato",
  "Enviar WhatsApp",
  "Fazer ligação",
  "Enviar e-mail",
  "Enviar apresentação",
  "Enviar proposta",
  "Cobrar retorno",
  "Reunião",
  "Outro",
];

const MEETING_STATUS_OPTIONS = ["AGENDADA", "REALIZADA", "CANCELADA"];
const MEETING_TYPE_OPTIONS = ["Online", "Presencial", "Telefone", "Híbrida"];
const MEETING_HOURS = Array.from({ length: 9 }, (_, index) => `${String(index + 9).padStart(2, "0")}:00`);
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const safe = (value: unknown) =>
  value === null || value === undefined || value === "null" ? "" : String(value);

type FollowupVisualState = "none" | "future" | "today" | "soon" | "late" | "done";

const getFollowupVisual = (
  lead: Pick<LeadProspeccao, "proxima_acao" | "followup_status">,
  nowMs: number
): {
  state: FollowupVisualState;
  label: string;
  containerClass: string;
  iconClass: string;
  textClass: string;
} => {
  const status = safe(lead.followup_status).toUpperCase();

  if (status === "CONCLUIDO") {
    return {
      state: "done",
      label: "Concluído",
      containerClass:
        "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
      iconClass: "text-slate-500",
      textClass: "text-slate-600 dark:text-slate-300",
    };
  }

  if (!lead.proxima_acao) {
    return {
      state: "none",
      label: "Sem follow-up",
      containerClass:
        "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20",
      iconClass: "text-indigo-500",
      textClass: "text-slate-500 dark:text-slate-400",
    };
  }

  const normalized = lead.proxima_acao.includes("T")
    ? lead.proxima_acao
    : lead.proxima_acao.replace(" ", "T");
  const due = new Date(normalized);

  if (Number.isNaN(due.getTime())) {
    return {
      state: "future",
      label: "Agendado",
      containerClass:
        "border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/70 dark:bg-indigo-950/20",
      iconClass: "text-indigo-500",
      textClass: "text-indigo-700 dark:text-indigo-300",
    };
  }

  const diff = due.getTime() - nowMs;

  if (diff < 0) {
    return {
      state: "late",
      label: "Atrasado",
      containerClass:
        "border-rose-300 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/30",
      iconClass: "text-rose-600 dark:text-rose-400",
      textClass: "text-rose-700 dark:text-rose-300",
    };
  }

  const now = new Date(nowMs);
  const sameDay =
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate();

  if (sameDay && diff <= 2 * 60 * 60 * 1000) {
    return {
      state: "soon",
      label: "Próximo do horário",
      containerClass:
        "border-amber-300 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/30",
      iconClass: "text-amber-600 dark:text-amber-400",
      textClass: "text-amber-800 dark:text-amber-300",
    };
  }

  if (sameDay) {
    return {
      state: "today",
      label: "Hoje",
      containerClass:
        "border-emerald-300 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/25",
      iconClass: "text-emerald-600 dark:text-emerald-400",
      textClass: "text-emerald-800 dark:text-emerald-300",
    };
  }

  return {
    state: "future",
    label: "Agendado",
    containerClass:
      "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/70 dark:bg-indigo-950/20",
    iconClass: "text-indigo-500",
    textClass: "text-indigo-700 dark:text-indigo-300",
  };
};

const nowForInput = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const todayForInput = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const formatCalendarDate = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const formatMeetingDate = (dateValue?: string | null, timeValue?: string | null) => {
  if (!dateValue) return "—";
  const normalized = `${dateValue}T${(timeValue || "00:00").slice(0, 5)}`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return `${dateValue} ${timeValue || ""}`.trim();
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getExcelValue = (row: Record<string, unknown>, aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeHeader(key))) {
      return safe(value).trim();
    }
  }
  return "";
};

const statusClass = (status: string) => {
  switch (status) {
    case "CONVERTIDO":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "INTERESSADO":
    case "REUNIÃO AGENDADA":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
    case "AGUARDANDO RETORNO":
    case "CONTATO ENVIADO":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    case "SEM INTERESSE":
    case "SEM RETORNO":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
};

const interestClass = (interest: string) => {
  if (interest === "ALTO")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (interest === "MÉDIO")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  if (interest === "BAIXO")
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || `Erro HTTP ${response.status}`);
  }
}

export const ControleLeadsView: React.FC = () => {
  const [leads, setLeads] = useState<LeadProspeccao[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [savingInteraction, setSavingInteraction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [interestFilter, setInterestFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverLeadId, setDragOverLeadId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadProspeccao | null>(null);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<InteracaoLead[]>([]);
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);
  const [observations, setObservations] = useState<ObservacaoLead[]>([]);
  const [observationText, setObservationText] = useState("");
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [agendamentos, setAgendamentos] = useState<AgendamentoLead[]>([]);
  const [meetingUsers, setMeetingUsers] = useState<UsuarioAgenda[]>([]);
  const [agendaMonth, setAgendaMonth] = useState(new Date().getMonth());
  const [agendaYear, setAgendaYear] = useState(new Date().getFullYear());
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [meetingSlots, setMeetingSlots] = useState<MeetingAvailabilitySlot[]>([]);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(todayForInput());
  const [blockReason, setBlockReason] = useState("");
  const [selectedBlockSlots, setSelectedBlockSlots] = useState<string[]>([]);
  const [agendaBlocks, setAgendaBlocks] = useState<AgendaBlock[]>([]);
  const [blockAvailability, setBlockAvailability] = useState<MeetingAvailabilitySlot[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState(false);
  const [meetingForm, setMeetingForm] = useState<MeetingForm>({
    lead_id: "",
    titulo: "",
    data_reuniao: todayForInput(),
    hora_reuniao: "10:00",
    duracao_minutos: "60",
    tipo_reuniao: "Online",
    local_reuniao: "Google Meet",
    responsavel_id: "",
    responsavel_nome: "",
    participantes: "",
    objetivo: "",
    observacoes: "",
    status: "AGENDADA",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [interaction, setInteraction] = useState<InteractionForm>({
    data_contato: nowForInput(),
    meio_contato: "WhatsApp",
    resultado: "AGUARDANDO RETORNO",
    status_apos: "AGUARDANDO RETORNO",
    interesse: "NÃO AVALIADO",
    proxima_acao: "",
    observacao: "",
  });

  const [followupOpen, setFollowupOpen] = useState(false);
  const [savingFollowup, setSavingFollowup] = useState(false);
  const [followupClock, setFollowupClock] = useState(Date.now());
  const [followupForm, setFollowupForm] = useState<FollowupForm>({
    tarefa: "Retornar contato",
    data: todayForInput(),
    hora: "10:00",
  });

  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [savingNewLead, setSavingNewLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState<NewLeadForm>({
    empresa: "",
    contato_nome: "",
    contato_cargo: "",
    cidade: "",
    estado: "",
    segmento: "",
    site: "",
    whatsapp: "",
    email: "",
    interesse: "NÃO AVALIADO",
    observacoes: "",
  });

  const showNotice = (next: Notice) => {
    setNotice(next);
    window.setTimeout(() => setNotice(null), 5000);
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=read`);
      const data = await parseJsonResponse(res);
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      setLeads([]);
      showNotice({ type: "error", text: "Não foi possível carregar os leads." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setFollowupClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const cities = useMemo<string[]>(() => {
    const uniqueCities = new Set<string>();
    leads.forEach((lead) => {
      const city = safe(lead.cidade).trim();
      if (city) uniqueCities.add(city);
    });
    return Array.from(uniqueCities).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return leads.filter((lead) => {
      const haystack = [
        lead.empresa,
        lead.cidade,
        lead.segmento,
        lead.whatsapp,
        lead.email,
        lead.contato_nome,
      ]
        .map(safe)
        .join(" ")
        .toLowerCase();

      return (
        (!term || haystack.includes(term)) &&
        (!statusFilter || lead.status === statusFilter) &&
        (!interestFilter || lead.interesse === interestFilter) &&
        (!cityFilter || safe(lead.cidade) === cityFilter)
      );
    });
  }, [leads, searchTerm, statusFilter, interestFilter, cityFilter]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const novos = leads.filter((lead) => lead.status === "NOVO").length;
    const contatados = leads.filter((lead) => Boolean(lead.ultimo_contato)).length;
    const interessados = leads.filter((lead) =>
      ["INTERESSADO", "REUNIÃO AGENDADA", "CONVERTIDO"].includes(lead.status)
    ).length;
    const convertidos = leads.filter((lead) => lead.status === "CONVERTIDO").length;

    return { total, novos, contatados, interessados, convertidos };
  }, [leads]);

  const patchLocalLead = (id: number, field: keyof LeadProspeccao, value: string) => {
    setLeads((previous) =>
      previous.map((lead) => (lead.id === id ? { ...lead, [field]: value } : lead))
    );
  };

  const saveField = async (
    id: number,
    field: keyof LeadProspeccao,
    value: string
  ) => {
    patchLocalLead(id, field, value);

    const form = new FormData();
    form.append("action", "update");
    form.append("id", String(id));
    form.append(String(field), value);

    try {
      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data.sucesso) {
        throw new Error(data.erro || "Erro ao salvar lead.");
      }
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao salvar alteração.",
      });
      fetchLeads();
    }
  };

  const handleAddLead = () => {
    setNewLeadForm({
      empresa: "",
      contato_nome: "",
      contato_cargo: "",
      cidade: "",
      estado: "",
      segmento: "",
      site: "",
      whatsapp: "",
      email: "",
      interesse: "NÃO AVALIADO",
      observacoes: "",
    });
    setNewLeadOpen(true);
  };

  const saveNewLead = async () => {
    const empresa = newLeadForm.empresa.trim();
    const whatsapp = newLeadForm.whatsapp.trim();
    const email = newLeadForm.email.trim();

    if (!empresa && !whatsapp && !email) {
      showNotice({
        type: "error",
        text: "Informe pelo menos Empresa, WhatsApp ou E-mail para criar o lead.",
      });
      return;
    }

    setSavingNewLead(true);
    let createdId: number | null = null;

    try {
      // 1. Cria o registro e recebe o ID usando a API que já existe.
      const createForm = new FormData();
      createForm.append("action", "create");
      createForm.append("fonte", "Manual");

      const loggedUser = getLoggedUser();
      if (loggedUser?.id || loggedUser?.usuario_id) {
        createForm.append(
          "responsavel_id",
          String(loggedUser?.id || loggedUser?.usuario_id || "")
        );
      }
      if (loggedUser?.nome || loggedUser?.name) {
        createForm.append(
          "responsavel_nome",
          String(loggedUser?.nome || loggedUser?.name || "")
        );
      }

      const createResponse = await fetch(API_URL, {
        method: "POST",
        body: createForm,
      });
      const createData = await parseJsonResponse(createResponse);

      if (!createResponse.ok || !createData.sucesso || !createData.id) {
        throw new Error(createData.erro || "Erro ao criar lead.");
      }

      createdId = Number(createData.id);

      // 2. Grava todos os dados preenchidos no modal.
      const updateForm = new FormData();
      updateForm.append("action", "update");
      updateForm.append("id", String(createdId));
      updateForm.append("empresa", newLeadForm.empresa.trim());
      updateForm.append("contato_nome", newLeadForm.contato_nome.trim());
      updateForm.append("contato_cargo", newLeadForm.contato_cargo.trim());
      updateForm.append("cidade", newLeadForm.cidade.trim());
      updateForm.append("estado", newLeadForm.estado.trim().toUpperCase().slice(0, 2));
      updateForm.append("segmento", newLeadForm.segmento.trim());
      updateForm.append("site", newLeadForm.site.trim());
      updateForm.append("whatsapp", newLeadForm.whatsapp.trim());
      updateForm.append("email", newLeadForm.email.trim());
      updateForm.append("interesse", newLeadForm.interesse || "NÃO AVALIADO");
      updateForm.append("observacoes", newLeadForm.observacoes.trim());
      updateForm.append("etapa_funil", "CONTATO");
      updateForm.append("status", "NOVO");
      updateForm.append("retorno", "SEM CONTATO");

      const updateResponse = await fetch(API_URL, {
        method: "POST",
        body: updateForm,
      });
      const updateData = await parseJsonResponse(updateResponse);

      if (!updateResponse.ok || !updateData.sucesso) {
        throw new Error(updateData.erro || "Erro ao salvar os dados do lead.");
      }

      // Se o lead já nasceu com uma observação, registra também no histórico permanente.
      if (newLeadForm.observacoes.trim()) {
        const observationForm = new FormData();
        observationForm.append("action", "observation_add");
        observationForm.append("lead_id", String(createdId));
        observationForm.append("observacao", newLeadForm.observacoes.trim());
        observationForm.append(
          "autor_id",
          String(loggedUser?.id || loggedUser?.usuario_id || "")
        );
        observationForm.append(
          "autor_nome",
          String(loggedUser?.nome || loggedUser?.name || "")
        );

        const observationResponse = await fetch(API_URL, {
          method: "POST",
          body: observationForm,
        });
        const observationData = await parseJsonResponse(observationResponse);

        if (!observationResponse.ok || !observationData?.sucesso) {
          throw new Error(observationData?.erro || "Erro ao registrar a observação inicial do lead.");
        }
      }

      // 3. Novo lead fica no topo da primeira coluna, não no final com ordem 999.
      const currentContactLeads = sortLeadsByOrder(
        leads.filter(
          (lead) =>
            Number(lead.id) !== createdId &&
            normalizeEtapa(lead.etapa_funil) === "CONTATO"
        )
      );

      const reorderForm = new FormData();
      reorderForm.append("action", "kanban_reorder");
      reorderForm.append(
        "items",
        JSON.stringify([
          { id: createdId, etapa_funil: "CONTATO", ordem: 1 },
          ...currentContactLeads.map((lead, index) => ({
            id: Number(lead.id),
            etapa_funil: "CONTATO",
            ordem: index + 2,
          })),
        ])
      );
      reorderForm.append(
        "responsavel_id",
        String(loggedUser?.id || loggedUser?.usuario_id || "")
      );
      reorderForm.append(
        "responsavel_nome",
        String(loggedUser?.nome || loggedUser?.name || "")
      );

      const reorderResponse = await fetch(API_URL, {
        method: "POST",
        body: reorderForm,
      });
      const reorderData = await parseJsonResponse(reorderResponse);

      if (!reorderResponse.ok || !reorderData.sucesso) {
        throw new Error(reorderData.erro || "Lead criado, mas não foi possível ordenar o Kanban.");
      }

      setNewLeadOpen(false);
      await fetchLeads();
      showNotice({
        type: "success",
        text: "Lead criado com sucesso e colocado no topo de Contato.",
      });
    } catch (error) {
      // Se a criação começou e algo depois falhou, evita deixar uma linha vazia perdida.
      if (createdId) {
        try {
          const cleanupForm = new FormData();
          cleanupForm.append("action", "delete");
          cleanupForm.append("id", String(createdId));
          await fetch(API_URL, { method: "POST", body: cleanupForm });
        } catch (cleanupError) {
          console.error("Erro ao limpar lead provisório:", cleanupError);
        }
      }

      console.error(error);
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao criar lead.",
      });
    } finally {
      setSavingNewLead(false);
    }
  };

  const handleArchiveLead = async (lead: LeadProspeccao) => {
    if (!window.confirm(`Arquivar o lead ${safe(lead.empresa) || `#${lead.id}`}?`)) return;

    const form = new FormData();
    form.append("action", "delete");
    form.append("id", String(lead.id));

    try {
      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data.sucesso) throw new Error(data.erro || "Erro ao arquivar lead.");
      setLeads((previous) => previous.filter((item) => item.id !== lead.id));
      showNotice({ type: "success", text: "Lead arquivado com sucesso." });
    } catch (error) {
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao arquivar lead.",
      });
    }
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
        raw: false,
      });

      const parsed = rows
        .map((row) => ({
          empresa: getExcelValue(row, ["Empresa", "Razão Social", "Nome Fantasia"]),
          cidade: getExcelValue(row, ["Cidade", "Município"]),
          estado: getExcelValue(row, ["Estado", "UF"]),
          segmento: getExcelValue(row, ["Segmento", "Ramo", "Categoria"]),
          site: getExcelValue(row, ["Site", "Website", "URL"]),
          whatsapp: getExcelValue(row, [
            "WhatsApp confirmado",
            "WhatsApp",
            "Telefone",
            "Celular",
          ]),
          email: getExcelValue(row, ["E-mail", "Email", "E mail"]),
        }))
        .filter((row) => row.empresa || row.whatsapp || row.email);

      if (parsed.length === 0) {
        throw new Error(
          "Não encontrei leads válidos. Confira se a planilha possui colunas como Empresa, Cidade, Segmento, Site, WhatsApp e E-mail."
        );
      }

      const chunkSize = 300;
      let imported = 0;
      let duplicates = 0;
      let errors = 0;

      for (let i = 0; i < parsed.length; i += chunkSize) {
        const chunk = parsed.slice(i, i + chunkSize);
        const form = new FormData();
        form.append("action", "import");
        form.append("arquivo", file.name);
        form.append("leads", JSON.stringify(chunk));

        const response = await fetch(API_URL, { method: "POST", body: form });
        const data = await parseJsonResponse(response);
        if (!response.ok || !data.sucesso) {
          throw new Error(data.erro || "Erro ao importar lote de leads.");
        }

        imported += Number(data.importados || 0);
        duplicates += Number(data.duplicados || 0);
        errors += Number(data.erros || 0);
      }

      await fetchLeads();
      showNotice({
        type: errors > 0 ? "info" : "success",
        text: `Importação concluída: ${imported} novos, ${duplicates} duplicados ignorados${
          errors ? ` e ${errors} com erro` : ""
        }.` ,
      });
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao ler a planilha.",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportCSV = () => {
    if (filteredLeads.length === 0) {
      showNotice({ type: "info", text: "Não há leads no filtro atual para exportar." });
      return;
    }

    const headers = [
      "Empresa",
      "Cidade",
      "Segmento",
      "Site",
      "WhatsApp",
      "E-mail",
      "Etapa CRM",
      "Status",
      "Último contato",
      "Meio",
      "Retorno",
      "Interesse",
      "Próxima ação",
      "Observações",
      "Fonte",
    ];

    const lines = filteredLeads.map((lead) => [
      lead.empresa,
      lead.cidade,
      lead.segmento,
      lead.site,
      lead.whatsapp,
      lead.email,
      normalizeEtapa(lead.etapa_funil),
      lead.status,
      lead.ultimo_contato,
      lead.meio_contato,
      lead.retorno,
      lead.interesse,
      lead.proxima_acao,
      lead.observacoes,
      lead.fonte,
    ]);

    const csv = [headers, ...lines]
      .map((row) =>
        row
          .map((cell) => `"${safe(cell).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "controle_de_leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openFollowup = (lead: LeadProspeccao) => {
    setSelectedLead(lead);

    const current = toInputDateTime(lead.proxima_acao);
    const [currentDate, currentTime] = current
      ? current.split("T")
      : [todayForInput(), "10:00"];

    setFollowupForm({
      tarefa: safe(lead.followup_tarefa) || "Retornar contato",
      data: currentDate || todayForInput(),
      hora: (currentTime || "10:00").slice(0, 5),
    });

    setFollowupOpen(true);
  };

  const saveFollowup = async () => {
    if (!selectedLead) return;

    if (!followupForm.tarefa.trim()) {
      showNotice({ type: "error", text: "Selecione uma tarefa para o follow-up." });
      return;
    }

    if (!followupForm.data || !followupForm.hora) {
      showNotice({ type: "error", text: "Informe a data e o horário do follow-up." });
      return;
    }

    setSavingFollowup(true);
    try {
      const form = new FormData();
      form.append("action", "update");
      form.append("id", String(selectedLead.id));
      form.append("followup_tarefa", followupForm.tarefa);
      form.append("followup_status", "PENDENTE");
      form.append("proxima_acao", `${followupForm.data}T${followupForm.hora}`);

      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);

      if (!response.ok || !data?.sucesso) {
        throw new Error(data?.erro || "Não foi possível salvar o follow-up.");
      }

      await fetchLeads();
      setFollowupClock(Date.now());
      setFollowupOpen(false);
      setSelectedLead(null);
      showNotice({ type: "success", text: "Follow-up agendado com sucesso." });
    } catch (error) {
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao salvar follow-up.",
      });
    } finally {
      setSavingFollowup(false);
    }
  };

  const completeFollowup = async () => {
    if (!selectedLead) return;

    setSavingFollowup(true);
    try {
      const form = new FormData();
      form.append("action", "update");
      form.append("id", String(selectedLead.id));
      form.append("followup_status", "CONCLUIDO");
      form.append("proxima_acao", "");

      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);

      if (!response.ok || !data?.sucesso) {
        throw new Error(data?.erro || "Não foi possível concluir o follow-up.");
      }

      await fetchLeads();
      setFollowupClock(Date.now());
      setFollowupOpen(false);
      setSelectedLead(null);
      showNotice({ type: "success", text: "Follow-up concluído." });
    } catch (error) {
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao concluir follow-up.",
      });
    } finally {
      setSavingFollowup(false);
    }
  };

  const openInteraction = (lead: LeadProspeccao) => {
    setSelectedLead(lead);
    setInteraction({
      data_contato: nowForInput(),
      meio_contato: lead.meio_contato || "WhatsApp",
      resultado: "AGUARDANDO RETORNO",
      status_apos: "AGUARDANDO RETORNO",
      interesse: lead.interesse || "NÃO AVALIADO",
      proxima_acao: "",
      observacao: "",
    });
    setInteractionOpen(true);
  };

  const saveInteraction = async () => {
    if (!selectedLead) return;

    setSavingInteraction(true);
    try {
      const form = new FormData();
      form.append("action", "add_interaction");
      form.append("lead_id", String(selectedLead.id));
      form.append("data_contato", interaction.data_contato);
      form.append("meio_contato", interaction.meio_contato);
      form.append("resultado", interaction.resultado);
      form.append("status_apos", interaction.status_apos);
      form.append("interesse", interaction.interesse);
      form.append("proxima_acao", interaction.proxima_acao);
      form.append("observacao", interaction.observacao);

      const loggedUser = getLoggedUser();
      form.append(
        "responsavel_id",
        String(loggedUser?.id || loggedUser?.usuario_id || "")
      );
      form.append(
        "responsavel_nome",
        String(loggedUser?.nome || loggedUser?.name || "")
      );

      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data.sucesso) {
        throw new Error(data.erro || "Erro ao registrar contato.");
      }

      setInteractionOpen(false);
      setSelectedLead(null);
      await fetchLeads();
      showNotice({ type: "success", text: "Contato registrado no histórico do lead." });
    } catch (error) {
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao registrar contato.",
      });
    } finally {
      setSavingInteraction(false);
    }
  };

  const openHistory = async (lead: LeadProspeccao) => {
    setSelectedLead(lead);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistory([]);

    try {
      const response = await fetch(`${API_URL}?action=history&lead_id=${lead.id}`);
      const data = await parseJsonResponse(response);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showNotice({ type: "error", text: "Não foi possível carregar o histórico." });
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadObservations = async (leadId: number) => {
    setObservationsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}?action=observation_list&lead_id=${leadId}`,
        { cache: "no-store" }
      );
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data?.erro || "Não foi possível carregar as observações.");
      }
      setObservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setObservations([]);
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível carregar as observações.",
      });
    } finally {
      setObservationsLoading(false);
    }
  };

  const openObservations = async (lead: LeadProspeccao) => {
    setSelectedLead(lead);
    setObservationText("");
    setObservations([]);
    setObservationsOpen(true);
    await loadObservations(Number(lead.id));
  };

  const saveObservation = async () => {
    if (!selectedLead) return;

    const text = observationText.trim();
    if (!text) {
      showNotice({ type: "info", text: "Digite uma observação antes de salvar." });
      return;
    }

    setSavingObservation(true);
    try {
      const loggedUser = getLoggedUser();
      const form = new FormData();
      form.append("action", "observation_add");
      form.append("lead_id", String(selectedLead.id));
      form.append("observacao", text);
      form.append(
        "autor_id",
        String(loggedUser?.id || loggedUser?.usuario_id || "")
      );
      form.append(
        "autor_nome",
        String(loggedUser?.nome || loggedUser?.name || "")
      );

      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);

      if (!response.ok || !data?.sucesso) {
        throw new Error(data?.erro || "Não foi possível salvar a observação.");
      }

      setObservationText("");
      await Promise.all([loadObservations(Number(selectedLead.id)), fetchLeads()]);
      showNotice({ type: "success", text: "Observação adicionada ao histórico do lead." });
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível salvar a observação.",
      });
    } finally {
      setSavingObservation(false);
    }
  };

  const fetchMeetingUsers = async () => {
    try {
      const response = await fetch(`${API_URL}?action=users`);
      const data = await parseJsonResponse(response);
      setMeetingUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar usuários da agenda:", error);
      setMeetingUsers([]);
    }
  };

  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=meeting_list`);
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.erro || "Erro ao carregar agendamentos.");
      }
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
      setAgendamentos([]);
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível carregar os agendamentos.",
      });
    } finally {
      setMeetingsLoading(false);
    }
  };

  const fetchMeetingAvailability = async (
    dateValue: string,
    durationValue: string,
    excludeId?: number
  ) => {
    if (!dateValue) {
      setMeetingSlots([]);
      return [];
    }

    setAvailabilityLoading(true);
    try {
      const params = new URLSearchParams({
        action: "meeting_availability",
        data: dateValue,
        duracao_minutos: durationValue || "60",
      });
      if (excludeId) params.set("exclude_id", String(excludeId));

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data?.sucesso) {
        throw new Error(data?.erro || "Não foi possível consultar os horários.");
      }

      const slots: MeetingAvailabilitySlot[] = Array.isArray(data.slots)
        ? data.slots
        : [];
      setMeetingSlots(slots);

      // Ao abrir uma reunião nova, se o horário padrão estiver ocupado,
      // seleciona automaticamente o primeiro horário realmente disponível.
      setMeetingForm((previous) => {
        if (
          previous.id ||
          previous.data_reuniao !== dateValue ||
          previous.duracao_minutos !== durationValue
        ) {
          return previous;
        }

        const selected = slots.find(
          (slot) => slot.hora === previous.hora_reuniao
        );
        if (selected?.disponivel) return previous;

        const firstAvailable = slots.find((slot) => slot.disponivel);
        return {
          ...previous,
          hora_reuniao: firstAvailable?.hora || "",
        };
      });

      return slots;
    } catch (error) {
      console.error("Erro ao consultar disponibilidade:", error);
      setMeetingSlots([]);
      showNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar os horários disponíveis.",
      });
      return [];
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!meetingOpen || !meetingForm.data_reuniao) return;

    fetchMeetingAvailability(
      meetingForm.data_reuniao,
      meetingForm.duracao_minutos || "60",
      meetingForm.id
    );
  }, [
    meetingOpen,
    meetingForm.data_reuniao,
    meetingForm.duracao_minutos,
    meetingForm.id,
  ]);

  const loadBlockDay = async (dateValue: string) => {
    if (!dateValue) return;

    setBlocksLoading(true);
    try {
      const [blocksResponse, availabilityResponse] = await Promise.all([
        fetch(
          `${API_URL}?action=block_list&data=${encodeURIComponent(dateValue)}`,
          { cache: "no-store" }
        ),
        fetch(
          `${API_URL}?action=meeting_availability&data=${encodeURIComponent(
            dateValue
          )}&duracao_minutos=60`,
          { cache: "no-store" }
        ),
      ]);

      const [blocksData, availabilityData] = await Promise.all([
        parseJsonResponse(blocksResponse),
        parseJsonResponse(availabilityResponse),
      ]);

      if (!blocksResponse.ok) {
        throw new Error(blocksData?.erro || "Erro ao carregar bloqueios.");
      }
      if (!availabilityResponse.ok || !availabilityData?.sucesso) {
        throw new Error(
          availabilityData?.erro || "Erro ao carregar disponibilidade."
        );
      }

      setAgendaBlocks(Array.isArray(blocksData) ? blocksData : []);
      setBlockAvailability(
        Array.isArray(availabilityData.slots) ? availabilityData.slots : []
      );
      setSelectedBlockSlots([]);
    } catch (error) {
      console.error("Erro ao carregar bloqueios:", error);
      setAgendaBlocks([]);
      setBlockAvailability([]);
      showNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os bloqueios.",
      });
    } finally {
      setBlocksLoading(false);
    }
  };

  const openBlockModal = async () => {
    const date = todayForInput();
    setBlockDate(date);
    setBlockReason("");
    setSelectedBlockSlots([]);
    setBlockOpen(true);
    await loadBlockDay(date);
  };

  useEffect(() => {
    if (!blockOpen || !blockDate) return;
    loadBlockDay(blockDate);
  }, [blockOpen, blockDate]);

  const toggleBlockSlot = (hour: string) => {
    const slot = blockAvailability.find((item) => item.hora === hour);
    if (slot && !slot.disponivel) return;

    setSelectedBlockSlots((previous) =>
      previous.includes(hour)
        ? previous.filter((item) => item !== hour)
        : [...previous, hour]
    );
  };

  const selectAllFreeBlockSlots = () => {
    setSelectedBlockSlots(
      blockAvailability
        .filter((slot) => slot.disponivel)
        .map((slot) => slot.hora)
    );
  };

  const saveBlocks = async () => {
    if (!blockDate) {
      showNotice({ type: "error", text: "Selecione a data do bloqueio." });
      return;
    }
    if (selectedBlockSlots.length === 0) {
      showNotice({
        type: "error",
        text: "Selecione pelo menos um horário para bloquear.",
      });
      return;
    }

    const loggedUser = getLoggedUser();
    setSavingBlocks(true);
    try {
      const form = new FormData();
      form.append("action", "block_save");
      form.append("data", blockDate);
      form.append("horarios", JSON.stringify(selectedBlockSlots));
      form.append("motivo", blockReason);
      form.append(
        "autor_id",
        String(loggedUser?.id || loggedUser?.usuario_id || "")
      );
      form.append(
        "autor_nome",
        safe(loggedUser?.nome || loggedUser?.name || loggedUser?.usuario)
      );

      const response = await fetch(API_URL, {
        method: "POST",
        body: form,
      });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data?.sucesso) {
        throw new Error(data?.erro || "Erro ao bloquear horários.");
      }

      await loadBlockDay(blockDate);

      if (meetingOpen && meetingForm.data_reuniao === blockDate) {
        await fetchMeetingAvailability(
          meetingForm.data_reuniao,
          meetingForm.duracao_minutos || "60",
          meetingForm.id
        );
      }

      const ignoredCount = Array.isArray(data.ignorados)
        ? data.ignorados.length
        : 0;
      showNotice({
        type: ignoredCount > 0 ? "info" : "success",
        text:
          ignoredCount > 0
            ? `${data.bloqueados || 0} horário(s) bloqueado(s). ${ignoredCount} já estavam ocupados ou bloqueados.`
            : `${data.bloqueados || 0} horário(s) bloqueado(s) com sucesso.`,
      });
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível bloquear os horários.",
      });
    } finally {
      setSavingBlocks(false);
    }
  };

  const deleteBlock = async (block: AgendaBlock) => {
    if (
      !window.confirm(
        `Liberar o horário ${safe(block.hora_inicio).slice(0, 5)} de ${formatMeetingDate(
          block.data_bloqueio,
          block.hora_inicio
        ).slice(0, 10)}?`
      )
    ) {
      return;
    }

    try {
      const form = new FormData();
      form.append("action", "block_delete");
      form.append("id", String(block.id));

      const response = await fetch(API_URL, {
        method: "POST",
        body: form,
      });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data?.sucesso) {
        throw new Error(data?.erro || "Erro ao liberar horário.");
      }

      await loadBlockDay(blockDate);
      showNotice({ type: "success", text: "Horário liberado novamente." });
    } catch (error) {
      showNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível liberar o horário.",
      });
    }
  };

  const openAgenda = async () => {
    setAgendaOpen(true);
    await Promise.all([fetchMeetings(), fetchMeetingUsers()]);
  };

  const buildDefaultMeetingForm = (
    lead?: LeadProspeccao | null,
    selectedDate?: string
  ): MeetingForm => {
    const loggedUser = getLoggedUser();
    const company = safe(lead?.empresa).trim();
    const contact = safe(lead?.contato_nome).trim();

    return {
      lead_id: lead ? String(lead.id) : "",
      titulo: company ? `Reunião comercial — ${company}` : "Reunião comercial",
      data_reuniao: selectedDate || todayForInput(),
      hora_reuniao: "10:00",
      duracao_minutos: "60",
      tipo_reuniao: "Online",
      local_reuniao: "Google Meet",
      responsavel_id: String(loggedUser?.id || loggedUser?.usuario_id || ""),
      responsavel_nome: safe(loggedUser?.nome || loggedUser?.name),
      participantes: contact || "",
      objetivo: "Apresentação e alinhamento comercial",
      observacoes: "",
      status: "AGENDADA",
    };
  };

  const openMeetingForLead = async (
    lead: LeadProspeccao,
    selectedDate?: string
  ) => {
    setSelectedLead(lead);
    setMeetingForm(buildDefaultMeetingForm(lead, selectedDate));
    if (meetingUsers.length === 0) {
      await fetchMeetingUsers();
    }
    setMeetingOpen(true);
  };

  const openNewMeetingFromAgenda = async (selectedDate?: string) => {
    setSelectedLead(null);
    setMeetingForm(buildDefaultMeetingForm(null, selectedDate));
    if (meetingUsers.length === 0) {
      await fetchMeetingUsers();
    }
    setMeetingOpen(true);
  };

  const openMeetingEdit = (meeting: AgendamentoLead) => {
    const lead = leads.find((item) => Number(item.id) === Number(meeting.lead_id)) || null;
    setSelectedLead(lead);
    setMeetingForm({
      id: Number(meeting.id),
      lead_id: String(meeting.lead_id),
      titulo: safe(meeting.titulo),
      data_reuniao: safe(meeting.data_reuniao),
      hora_reuniao: safe(meeting.hora_reuniao).slice(0, 5),
      duracao_minutos: String(meeting.duracao_minutos || 60),
      tipo_reuniao: safe(meeting.tipo_reuniao) || "Online",
      local_reuniao: safe(meeting.local_reuniao),
      responsavel_id: safe(meeting.responsavel_id),
      responsavel_nome: safe(meeting.responsavel_nome),
      participantes: safe(meeting.participantes),
      objetivo: safe(meeting.objetivo),
      observacoes: safe(meeting.observacoes),
      status: safe(meeting.status) || "AGENDADA",
    });
    setMeetingOpen(true);
  };

  const saveMeeting = async () => {
    if (!meetingForm.lead_id) {
      showNotice({ type: "error", text: "Selecione o lead da reunião." });
      return;
    }
    if (!meetingForm.data_reuniao || !meetingForm.hora_reuniao) {
      showNotice({ type: "error", text: "Informe data e selecione um horário disponível." });
      return;
    }

    if (meetingForm.status === "AGENDADA") {
      const selectedSlot = meetingSlots.find(
        (slot) => slot.hora === meetingForm.hora_reuniao
      );
      if (!selectedSlot?.disponivel) {
        showNotice({
          type: "error",
          text: selectedSlot?.motivo || "Este horário não está mais disponível.",
        });
        return;
      }
    }

    setSavingMeeting(true);
    try {
      const form = new FormData();
      form.append("action", "meeting_save");
      if (meetingForm.id) form.append("id", String(meetingForm.id));
      form.append("lead_id", meetingForm.lead_id);
      form.append("titulo", meetingForm.titulo);
      form.append("data_reuniao", meetingForm.data_reuniao);
      form.append("hora_reuniao", meetingForm.hora_reuniao);
      form.append("duracao_minutos", meetingForm.duracao_minutos || "60");
      form.append("tipo_reuniao", meetingForm.tipo_reuniao);
      form.append("local_reuniao", meetingForm.local_reuniao);
      form.append("responsavel_id", meetingForm.responsavel_id);
      form.append("responsavel_nome", meetingForm.responsavel_nome);
      form.append("participantes", meetingForm.participantes);
      form.append("objetivo", meetingForm.objetivo);
      form.append("observacoes", meetingForm.observacoes);
      form.append("status", meetingForm.status);

      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data.sucesso) {
        throw new Error(data.erro || "Erro ao salvar reunião.");
      }

      setMeetingOpen(false);
      await Promise.all([fetchMeetings(), fetchLeads()]);
      showNotice({
        type: "success",
        text: meetingForm.id ? "Reunião atualizada com sucesso." : "Reunião agendada com sucesso.",
      });
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao salvar reunião.",
      });
    } finally {
      setSavingMeeting(false);
    }
  };

  const deleteMeeting = async (meeting: AgendamentoLead) => {
    if (!window.confirm(`Excluir a reunião "${meeting.titulo}"?`)) return;

    try {
      const form = new FormData();
      form.append("action", "meeting_delete");
      form.append("id", String(meeting.id));

      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data.sucesso) {
        throw new Error(data.erro || "Erro ao excluir reunião.");
      }

      await fetchMeetings();
      showNotice({ type: "success", text: "Reunião removida da agenda." });
    } catch (error) {
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao excluir reunião.",
      });
    }
  };

  const handlePrevAgendaMonth = () => {
    if (agendaMonth === 0) {
      setAgendaMonth(11);
      setAgendaYear((year) => year - 1);
    } else {
      setAgendaMonth((month) => month - 1);
    }
  };

  const handleNextAgendaMonth = () => {
    if (agendaMonth === 11) {
      setAgendaMonth(0);
      setAgendaYear((year) => year + 1);
    } else {
      setAgendaMonth((month) => month + 1);
    }
  };

  const getMeetingsForDay = (day: number) => {
    const date = formatCalendarDate(agendaYear, agendaMonth, day);
    return agendamentos
      .filter((meeting) => meeting.data_reuniao === date)
      .sort((a, b) => safe(a.hora_reuniao).localeCompare(safe(b.hora_reuniao)));
  };

  const agendaDaysInMonth = new Date(agendaYear, agendaMonth + 1, 0).getDate();
  const agendaFirstDayIndex = new Date(agendaYear, agendaMonth, 1).getDay();

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return [...agendamentos]
      .filter((meeting) => {
        if (meeting.status === "CANCELADA") return false;
        const date = new Date(`${meeting.data_reuniao}T${safe(meeting.hora_reuniao).slice(0, 5) || "00:00"}`);
        return !Number.isNaN(date.getTime()) && date.getTime() >= now.getTime() - 60 * 60 * 1000;
      })
      .sort((a, b) =>
        `${a.data_reuniao} ${safe(a.hora_reuniao)}`.localeCompare(
          `${b.data_reuniao} ${safe(b.hora_reuniao)}`
        )
      )
      .slice(0, 8);
  }, [agendamentos]);

  const sortLeadsByOrder = (items: LeadProspeccao[]) =>
    [...items].sort((a, b) => {
      const orderA = Number(a.ordem);
      const orderB = Number(b.ordem);
      const safeA = Number.isFinite(orderA) && orderA > 0 ? orderA : 999999;
      const safeB = Number.isFinite(orderB) && orderB > 0 ? orderB : 999999;

      if (safeA !== safeB) return safeA - safeB;

      const dateA = a.data_criacao ? new Date(a.data_criacao.replace(" ", "T")).getTime() : 0;
      const dateB = b.data_criacao ? new Date(b.data_criacao.replace(" ", "T")).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;

      return Number(a.id) - Number(b.id);
    });

  const getSortedStageLeads = (stage: EtapaFunil) =>
    sortLeadsByOrder(
      filteredLeads.filter((lead) => normalizeEtapa(lead.etapa_funil) === stage)
    );

  const getAllSortedStageLeads = (stage: EtapaFunil) =>
    sortLeadsByOrder(
      leads.filter((lead) => normalizeEtapa(lead.etapa_funil) === stage)
    );

  const getLoggedUser = () => {
    try {
      const stored = localStorage.getItem("@d2r:user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const applyKanbanUpdates = (updates: LeadProspeccao[]) => {
    const map = new Map(updates.map((lead) => [Number(lead.id), lead]));
    setLeads((previous) =>
      previous.map((lead) => map.get(Number(lead.id)) || lead)
    );
  };

  const persistKanbanUpdates = async (updates: LeadProspeccao[]) => {
    if (updates.length === 0) return;

    const loggedUser = getLoggedUser();
    const form = new FormData();
    form.append("action", "kanban_reorder");
    form.append(
      "items",
      JSON.stringify(
        updates.map((lead) => ({
          id: Number(lead.id),
          etapa_funil: normalizeEtapa(lead.etapa_funil),
          ordem: Number(lead.ordem) || 0,
        }))
      )
    );
    form.append(
      "responsavel_id",
      String(loggedUser?.id || loggedUser?.usuario_id || "")
    );
    form.append(
      "responsavel_nome",
      String(loggedUser?.nome || loggedUser?.name || "")
    );

    const response = await fetch(API_URL, { method: "POST", body: form });
    const data = await parseJsonResponse(response);

    if (!response.ok || !data.sucesso) {
      throw new Error(data.erro || "Não foi possível salvar a posição do lead.");
    }
  };

  const handleDragStart = (event: React.DragEvent, id: number) => {
    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(id);
  };

  const handleDragOverCard = (event: React.DragEvent, targetLeadId: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggedLeadId !== targetLeadId) {
      setDragOverLeadId(targetLeadId);
    }
  };

  const handleDropOnCard = async (
    event: React.DragEvent,
    targetLead: LeadProspeccao
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverLeadId(null);

    const sourceId = Number(
      event.dataTransfer.getData("text/plain") || draggedLeadId
    );
    if (!sourceId || sourceId === Number(targetLead.id)) return;

    const sourceLead = leads.find((lead) => Number(lead.id) === sourceId);
    if (!sourceLead) return;

    const sourceStage = normalizeEtapa(sourceLead.etapa_funil);
    const targetStage = normalizeEtapa(targetLead.etapa_funil);

    const targetColumn = getAllSortedStageLeads(targetStage).filter(
      (lead) => Number(lead.id) !== sourceId
    );
    const targetIndex = targetColumn.findIndex(
      (lead) => Number(lead.id) === Number(targetLead.id)
    );

    const movedLead: LeadProspeccao = {
      ...sourceLead,
      etapa_funil: targetStage,
    };

    targetColumn.splice(targetIndex < 0 ? targetColumn.length : targetIndex, 0, movedLead);

    const targetUpdates = targetColumn.map((lead, index) => ({
      ...lead,
      etapa_funil: targetStage,
      ordem: index + 1,
    }));

    const sourceUpdates =
      sourceStage === targetStage
        ? []
        : getAllSortedStageLeads(sourceStage)
            .filter((lead) => Number(lead.id) !== sourceId)
            .map((lead, index) => ({
              ...lead,
              etapa_funil: sourceStage,
              ordem: index + 1,
            }));

    const updates = [...sourceUpdates, ...targetUpdates];
    applyKanbanUpdates(updates);

    try {
      await persistKanbanUpdates(updates);
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Erro ao salvar movimentação do Kanban.",
      });
      await fetchLeads();
    } finally {
      setDraggedLeadId(null);
    }
  };

  const handleDropColumn = async (
    event: React.DragEvent,
    targetStage: EtapaFunil
  ) => {
    event.preventDefault();

    const sourceId = Number(
      event.dataTransfer.getData("text/plain") || draggedLeadId
    );
    if (!sourceId) return;

    const sourceLead = leads.find((lead) => Number(lead.id) === sourceId);
    if (!sourceLead) return;

    const sourceStage = normalizeEtapa(sourceLead.etapa_funil);

    const targetColumn = getAllSortedStageLeads(targetStage).filter(
      (lead) => Number(lead.id) !== sourceId
    );

    targetColumn.push({
      ...sourceLead,
      etapa_funil: targetStage,
    });

    const targetUpdates = targetColumn.map((lead, index) => ({
      ...lead,
      etapa_funil: targetStage,
      ordem: index + 1,
    }));

    const sourceUpdates =
      sourceStage === targetStage
        ? []
        : getAllSortedStageLeads(sourceStage)
            .filter((lead) => Number(lead.id) !== sourceId)
            .map((lead, index) => ({
              ...lead,
              etapa_funil: sourceStage,
              ordem: index + 1,
            }));

    const updates = [...sourceUpdates, ...targetUpdates];
    applyKanbanUpdates(updates);

    try {
      await persistKanbanUpdates(updates);
      if (sourceStage !== targetStage) {
        const destination =
          KANBAN_COLUMNS.find((column) => column.id === targetStage)?.title ||
          targetStage;
        showNotice({
          type: "success",
          text: `${safe(sourceLead.empresa) || `Lead #${sourceLead.id}`} movido para ${destination.replace(/^\d+\.\s*/, "")}.`,
        });
      }
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Erro ao salvar movimentação do Kanban.",
      });
      await fetchLeads();
    } finally {
      setDraggedLeadId(null);
      setDragOverLeadId(null);
    }
  };

  const moveLeadToStage = async (
    lead: LeadProspeccao,
    targetStage: EtapaFunil
  ) => {
    const sourceStage = normalizeEtapa(lead.etapa_funil);
    if (sourceStage === targetStage) return;

    const targetColumn = getAllSortedStageLeads(targetStage).filter(
      (item) => Number(item.id) !== Number(lead.id)
    );
    targetColumn.push({ ...lead, etapa_funil: targetStage });

    const targetUpdates = targetColumn.map((item, index) => ({
      ...item,
      etapa_funil: targetStage,
      ordem: index + 1,
    }));

    const sourceUpdates = getAllSortedStageLeads(sourceStage)
      .filter((item) => Number(item.id) !== Number(lead.id))
      .map((item, index) => ({
        ...item,
        etapa_funil: sourceStage,
        ordem: index + 1,
      }));

    const updates = [...sourceUpdates, ...targetUpdates];
    applyKanbanUpdates(updates);

    try {
      await persistKanbanUpdates(updates);
    } catch (error) {
      console.error(error);
      showNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Erro ao mover lead de etapa.",
      });
      await fetchLeads();
    }
  };

  const whatsappLink = (value?: string | null) => {
    const digits = safe(value).replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-300">
      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : notice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
              : "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Controle de Leads
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            CRM comercial com Kanban, histórico de contatos, follow-up e importação de Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Kanban className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
          </div>

          <button
            onClick={openAgenda}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
          >
            <CalendarClock className="h-4 w-4" />
            Agenda
          </button>

          <button
            onClick={openBlockModal}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 shadow-sm transition hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
            title="Bloquear horários da agenda comercial"
          >
            <Clock3 className="h-4 w-4" />
            Bloquear horários
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importar Excel
          </button>

          <button
            onClick={handleAddLead}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus className="h-4 w-4" /> Novo Lead
          </button>

          <button
            onClick={exportCSV}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon={<Users className="h-4 w-4" />} label="Total" value={kpis.total} />
        <KpiCard icon={<Plus className="h-4 w-4" />} label="Novos" value={kpis.novos} />
        <KpiCard
          icon={<MessageSquarePlus className="h-4 w-4" />}
          label="Contatados"
          value={kpis.contatados}
        />
        <KpiCard
          icon={<Target className="h-4 w-4" />}
          label="Oportunidades"
          value={kpis.interessados}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Convertidos"
          value={kpis.convertidos}
        />
      </div>

      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1fr_180px_160px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar empresa, segmento, WhatsApp, e-mail..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={interestFilter}
          onChange={(event) => setInterestFilter(event.target.value)}
          className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          <option value="">Todo interesse</option>
          {INTERESSE_OPTIONS.map((interest) => (
            <option key={interest} value={interest}>
              {interest}
            </option>
          ))}
        </select>

        <select
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
          className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          <option value="">Todas as cidades</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {viewMode === "kanban" ? (
        <div className="overflow-x-auto pb-3">
          <div className="flex min-w-max items-start gap-4">
            {KANBAN_COLUMNS.map((column) => {
              const columnLeads = getSortedStageLeads(column.id);

              return (
                <section
                  key={column.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => handleDropColumn(event, column.id)}
                  className={`flex w-[320px] flex-none flex-col overflow-hidden rounded-2xl border border-slate-200 border-t-4 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${column.color}`}
                >
                  <div className="border-b border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {column.title}
                        </h2>
                        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          {column.description}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${column.badge}`}
                      >
                        {columnLeads.length}
                      </span>
                    </div>
                  </div>

                  <div className="min-h-[420px] space-y-2 p-2.5">
                    {columnLeads.length === 0 ? (
                      <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 text-center text-[11px] text-slate-400 dark:border-slate-700">
                        Arraste um lead para esta etapa
                      </div>
                    ) : (
                      columnLeads.map((lead) => {
                        const followupVisual = getFollowupVisual(lead, followupClock);
                        const dragging = draggedLeadId === Number(lead.id);
                        const isDragOver = dragOverLeadId === Number(lead.id);

                        return (
                          <article
                            key={lead.id}
                            draggable
                            onDragStart={(event) =>
                              handleDragStart(event, Number(lead.id))
                            }
                            onDragEnd={() => {
                              setDraggedLeadId(null);
                              setDragOverLeadId(null);
                            }}
                            onDragOver={(event) =>
                              handleDragOverCard(event, Number(lead.id))
                            }
                            onDragLeave={() => setDragOverLeadId(null)}
                            onDrop={(event) => handleDropOnCard(event, lead)}
                            className={`group cursor-grab rounded-xl border bg-white p-3 shadow-sm transition active:cursor-grabbing dark:bg-slate-950 ${
                              isDragOver
                                ? "border-indigo-500 ring-2 ring-indigo-500/20"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700"
                            } ${dragging ? "opacity-40" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 text-slate-300 transition group-hover:text-slate-500 dark:text-slate-700 dark:group-hover:text-slate-500">
                                <GripVertical className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h3
                                      className="truncate text-sm font-extrabold text-slate-900 dark:text-white"
                                      title={safe(lead.empresa)}
                                    >
                                      {safe(lead.empresa) || `Lead #${lead.id}`}
                                    </h3>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                      {lead.segmento && (
                                        <span className="max-w-[180px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          {lead.segmento}
                                        </span>
                                      )}
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[9px] font-black ${interestClass(
                                          lead.interesse
                                        )}`}
                                      >
                                        {safe(lead.interesse) || "NÃO AVALIADO"}
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[9px] font-black ${statusClass(
                                          lead.status
                                        )}`}
                                      >
                                        {safe(lead.status) || "NOVO"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  {lead.cidade && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">
                                        {lead.cidade}
                                        {lead.estado ? `/${lead.estado}` : ""}
                                      </span>
                                    </div>
                                  )}

                                  {lead.whatsapp && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <a
                                        href={whatsappLink(lead.whatsapp)}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(event) => event.stopPropagation()}
                                        className="truncate font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                                      >
                                        {lead.whatsapp}
                                      </a>
                                    </div>
                                  )}

                                  {lead.email && (
                                    <div className="flex items-center gap-1.5">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <a
                                        href={`mailto:${lead.email}`}
                                        onClick={(event) => event.stopPropagation()}
                                        className="truncate hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                                      >
                                        {lead.email}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openFollowup(lead);
                                  }}
                                  className={`mt-3 w-full rounded-lg border px-2.5 py-2 text-left transition ${followupVisual.containerClass}`}
                                  title="Abrir tarefa de follow-up"
                                >
                                  <div className={`flex items-center gap-1.5 text-[10px] font-black ${followupVisual.textClass}`}>
                                    <CalendarClock className={`h-3.5 w-3.5 ${followupVisual.iconClass}`} />
                                    <span className="truncate">
                                      {safe(lead.followup_tarefa) ||
                                        (lead.proxima_acao ? "Follow-up" : "Adicionar follow-up")}
                                    </span>
                                  </div>
                                  <div className={`mt-1 flex items-center justify-between gap-2 text-[9px] font-bold ${followupVisual.textClass}`}>
                                    <span>
                                      {lead.proxima_acao
                                        ? formatDateTime(lead.proxima_acao)
                                        : followupVisual.label}
                                    </span>
                                    <span className="rounded-full bg-white/70 px-2 py-0.5 uppercase tracking-wide dark:bg-slate-950/50">
                                      {followupVisual.label}
                                    </span>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openObservations(lead);
                                  }}
                                  className="mt-3 w-full rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-left transition hover:border-amber-300 hover:bg-amber-100/70 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/35"
                                  title="Abrir histórico de observações deste lead"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                      <MessageSquarePlus className="h-3.5 w-3.5" />
                                      Observações
                                    </div>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-slate-900/80 dark:text-amber-300">
                                      {Number(lead.total_observacoes || 0)}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 line-clamp-2 whitespace-normal text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
                                    {safe(lead.ultima_observacao) ||
                                      safe(lead.observacoes) ||
                                      "Clique para adicionar a primeira observação."}
                                  </div>
                                  {lead.ultima_observacao_data && (
                                    <div className="mt-1 text-[9px] text-slate-400">
                                      {formatDateTime(lead.ultima_observacao_data)}
                                      {lead.ultima_observacao_autor
                                        ? ` · ${lead.ultima_observacao_autor}`
                                        : ""}
                                    </div>
                                  )}
                                </button>

                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                                  <div className="min-w-0 text-[9px] text-slate-400">
                                    <div className="truncate">
                                      {lead.ultimo_contato
                                        ? `Último: ${formatDateTime(lead.ultimo_contato)}`
                                        : "Ainda sem contato"}
                                    </div>
                                    {lead.responsavel_nome && (
                                      <div className="mt-0.5 truncate font-semibold">
                                        {lead.responsavel_nome}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openInteraction(lead);
                                      }}
                                      title="Registrar contato"
                                      className="cursor-pointer rounded-lg p-1.5 text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800"
                                    >
                                      <MessageSquarePlus className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openMeetingForLead(lead);
                                      }}
                                      title="Agendar reunião"
                                      className="cursor-pointer rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
                                    >
                                      <CalendarClock className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openHistory(lead);
                                      }}
                                      title="Histórico"
                                      className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                    >
                                      <History className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Funil de Prospecção
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {filteredLeads.length} lead(s) no filtro atual
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[2380px] whitespace-nowrap text-left text-xs">
            <thead className="bg-slate-300/70 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-3 py-3 w-44">Etapa CRM</th>
                <th className="px-3 py-3 w-48">Status</th>
                <th className="px-3 py-3 w-64">Empresa</th>
                <th className="px-3 py-3 w-40">Cidade</th>
                <th className="px-3 py-3 w-64">Segmento</th>
                <th className="px-3 py-3 w-56">Site</th>
                <th className="px-3 py-3 w-52">Contato</th>
                <th className="px-3 py-3 w-56">WhatsApp</th>
                <th className="px-3 py-3 w-64">E-mail</th>
                <th className="px-3 py-3 w-40">Último contato</th>
                <th className="px-3 py-3 w-32">Meio</th>
                <th className="px-3 py-3 w-44">Retorno</th>
                <th className="px-3 py-3 w-36">Interesse</th>
                <th className="px-3 py-3 w-52">Follow-up</th>
                <th className="px-3 py-3 w-72">Observações</th>
                <th className="px-3 py-3 w-28 text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400">
                    Nenhum lead encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group bg-slate-100/70 transition-colors hover:bg-slate-200/70 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-1">
                      <select
                        value={normalizeEtapa(lead.etapa_funil)}
                        onChange={(event) =>
                          moveLeadToStage(
                            lead,
                            event.target.value as EtapaFunil
                          )
                        }
                        className="w-full cursor-pointer rounded bg-slate-200 px-2 py-1.5 font-bold text-slate-700 outline-none dark:bg-slate-800 dark:text-slate-200"
                      >
                        {KANBAN_COLUMNS.map((column) => (
                          <option key={column.id} value={column.id}>
                            {column.title.replace(/^\d+\.\s*/, "")}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-1">
                      <select
                        value={safe(lead.status) || "NOVO"}
                        onChange={(event) => saveField(lead.id, "status", event.target.value)}
                        className={`w-full cursor-pointer rounded px-2 py-1.5 font-bold outline-none ${statusClass(
                          lead.status
                        )}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status} className="bg-white text-slate-800">
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-1">
                      <div className="flex items-center gap-1">
                        <input
                          value={safe(lead.empresa)}
                          onChange={(event) => patchLocalLead(lead.id, "empresa", event.target.value)}
                          onBlur={(event) => saveField(lead.id, "empresa", event.target.value)}
                          placeholder="Nome da empresa"
                          className="min-w-0 flex-1 rounded bg-transparent px-2 py-1.5 font-semibold outline-none transition hover:bg-white/70 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:hover:bg-slate-950 dark:focus:bg-slate-950"
                        />
                        {lead.site && (
                          <a
                            href={lead.site.startsWith("http") ? lead.site : `https://${lead.site}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir site"
                            className="rounded p-1 text-slate-400 hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-950"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    <EditableCell lead={lead} field="cidade" onLocal={patchLocalLead} onSave={saveField} />
                    <EditableCell lead={lead} field="segmento" onLocal={patchLocalLead} onSave={saveField} />
                    <EditableCell lead={lead} field="site" onLocal={patchLocalLead} onSave={saveField} />
                    <EditableCell lead={lead} field="contato_nome" onLocal={patchLocalLead} onSave={saveField} />
                    <EditableCell lead={lead} field="whatsapp" onLocal={patchLocalLead} onSave={saveField} />
                    <EditableCell lead={lead} field="email" onLocal={patchLocalLead} onSave={saveField} />

                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {formatDateTime(lead.ultimo_contato)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {safe(lead.meio_contato) || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {safe(lead.retorno) || "—"}
                    </td>

                    <td className="p-1">
                      <select
                        value={safe(lead.interesse) || "NÃO AVALIADO"}
                        onChange={(event) => saveField(lead.id, "interesse", event.target.value)}
                        className={`w-full cursor-pointer rounded px-2 py-1.5 font-bold outline-none ${interestClass(
                          lead.interesse
                        )}`}
                      >
                        {INTERESSE_OPTIONS.map((interest) => (
                          <option key={interest} value={interest} className="bg-white text-slate-800">
                            {interest}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-1">
                      <button
                        type="button"
                        onClick={() => openFollowup(lead)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                          getFollowupVisual(lead, followupClock).containerClass
                        }`}
                        title="Abrir tarefa de follow-up"
                      >
                        <div
                          className={`flex items-center gap-1.5 text-[10px] font-black ${
                            getFollowupVisual(lead, followupClock).textClass
                          }`}
                        >
                          <CalendarClock
                            className={`h-3.5 w-3.5 ${
                              getFollowupVisual(lead, followupClock).iconClass
                            }`}
                          />
                          <span className="max-w-[150px] truncate">
                            {safe(lead.followup_tarefa) ||
                              (lead.proxima_acao ? "Follow-up" : "Adicionar follow-up")}
                          </span>
                        </div>
                        <div
                          className={`mt-1 text-[9px] font-bold ${
                            getFollowupVisual(lead, followupClock).textClass
                          }`}
                        >
                          {lead.proxima_acao
                            ? formatDateTime(lead.proxima_acao)
                            : getFollowupVisual(lead, followupClock).label}
                        </div>
                      </button>
                    </td>

                    <td className="p-1">
                      <button
                        type="button"
                        onClick={() => openObservations(lead)}
                        className="w-full rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-2 text-left transition hover:border-amber-300 hover:bg-amber-100/70 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/35"
                        title="Abrir histórico de observações"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300">
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                            Histórico
                          </span>
                          <span className="text-[9px] font-black text-amber-700 dark:text-amber-300">
                            {Number(lead.total_observacoes || 0)}
                          </span>
                        </div>
                        <div className="mt-1 max-w-[260px] truncate text-[10px] text-slate-600 dark:text-slate-300">
                          {safe(lead.ultima_observacao) ||
                            safe(lead.observacoes) ||
                            "Adicionar observação"}
                        </div>
                      </button>
                    </td>

                    <td className="p-1 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => openInteraction(lead)}
                          title="Registrar contato"
                          className="cursor-pointer rounded p-1.5 text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800"
                        >
                          <MessageSquarePlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openMeetingForLead(lead)}
                          title="Agendar reunião"
                          className="cursor-pointer rounded p-1.5 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openHistory(lead)}
                          title="Ver histórico"
                          className="cursor-pointer rounded p-1.5 text-slate-500 transition hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveLead(lead)}
                          title="Arquivar lead"
                          className="cursor-pointer rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      )}

      {newLeadOpen && (
        <Modal title="Novo lead" onClose={() => !savingNewLead && setNewLeadOpen(false)}>
          <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Cadastrar novo lead
                </h4>
                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  O lead será criado somente ao salvar e entrará no topo da etapa Contato com status Novo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField label="Empresa">
                <input
                  autoFocus
                  value={newLeadForm.empresa}
                  onChange={(event) =>
                    setNewLeadForm((previous) => ({
                      ...previous,
                      empresa: event.target.value,
                    }))
                  }
                  placeholder="Nome da empresa"
                  className="field-input"
                />
              </FormField>
            </div>

            <FormField label="Nome do contato">
              <input
                value={newLeadForm.contato_nome}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    contato_nome: event.target.value,
                  }))
                }
                placeholder="Ex.: João Silva"
                className="field-input"
              />
            </FormField>

            <FormField label="Cargo do contato">
              <input
                value={newLeadForm.contato_cargo}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    contato_cargo: event.target.value,
                  }))
                }
                placeholder="Ex.: Diretor comercial"
                className="field-input"
              />
            </FormField>

            <FormField label="WhatsApp">
              <input
                value={newLeadForm.whatsapp}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    whatsapp: event.target.value,
                  }))
                }
                placeholder="(13) 99999-9999"
                className="field-input"
              />
            </FormField>

            <FormField label="E-mail">
              <input
                type="email"
                value={newLeadForm.email}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
                placeholder="contato@empresa.com.br"
                className="field-input"
              />
            </FormField>

            <FormField label="Cidade">
              <input
                value={newLeadForm.cidade}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    cidade: event.target.value,
                  }))
                }
                placeholder="Cidade"
                className="field-input"
              />
            </FormField>

            <FormField label="Estado">
              <input
                maxLength={2}
                value={newLeadForm.estado}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    estado: event.target.value.toUpperCase().slice(0, 2),
                  }))
                }
                placeholder="SP"
                className="field-input"
              />
            </FormField>

            <FormField label="Segmento">
              <input
                value={newLeadForm.segmento}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    segmento: event.target.value,
                  }))
                }
                placeholder="Ex.: Indústria, varejo, clínica..."
                className="field-input"
              />
            </FormField>

            <FormField label="Site">
              <input
                value={newLeadForm.site}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    site: event.target.value,
                  }))
                }
                placeholder="https://empresa.com.br"
                className="field-input"
              />
            </FormField>

            <FormField label="Interesse inicial">
              <select
                value={newLeadForm.interesse}
                onChange={(event) =>
                  setNewLeadForm((previous) => ({
                    ...previous,
                    interesse: event.target.value,
                  }))
                }
                className="field-input"
              >
                {INTERESSE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex items-end">
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <strong className="text-slate-700 dark:text-slate-200">Entrada automática:</strong>{" "}
                Contato • Novo • Sem contato
              </div>
            </div>

            <div className="md:col-span-2">
              <FormField label="Observações">
                <textarea
                  rows={4}
                  value={newLeadForm.observacoes}
                  onChange={(event) =>
                    setNewLeadForm((previous) => ({
                      ...previous,
                      observacoes: event.target.value,
                    }))
                  }
                  placeholder="Informações iniciais, origem do contato, contexto comercial..."
                  className="field-input resize-none"
                />
              </FormField>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              type="button"
              onClick={() => setNewLeadOpen(false)}
              disabled={savingNewLead}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveNewLead}
              disabled={savingNewLead}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingNewLead ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar lead
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {agendaOpen && (
        <WideModal
          title="Agenda comercial de Leads"
          subtitle="Visualize e organize reuniões do funil comercial."
          onClose={() => setAgendaOpen(false)}
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {MONTH_NAMES[agendaMonth]} {agendaYear}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Clique em um dia para criar uma reunião.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevAgendaMonth}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      setAgendaMonth(now.getMonth());
                      setAgendaYear(now.getFullYear());
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={handleNextAgendaMonth}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    title="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openNewMeetingFromAgenda()}
                    className="ml-1 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova reunião
                  </button>
                </div>
              </div>

              {meetingsLoading ? (
                <div className="flex min-h-[440px] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                      {WEEK_DAYS.map((day) => (
                        <div
                          key={day}
                          className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-400"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7">
                      {Array.from({ length: agendaFirstDayIndex }).map((_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="min-h-[118px] border-b border-r border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30"
                        />
                      ))}

                      {Array.from({ length: agendaDaysInMonth }).map((_, index) => {
                        const day = index + 1;
                        const date = formatCalendarDate(agendaYear, agendaMonth, day);
                        const meetings = getMeetingsForDay(day);
                        const now = new Date();
                        const isToday =
                          day === now.getDate() &&
                          agendaMonth === now.getMonth() &&
                          agendaYear === now.getFullYear();

                        return (
                          <div
                            key={day}
                            onClick={() => openNewMeetingFromAgenda(date)}
                            className="group min-h-[118px] cursor-pointer border-b border-r border-slate-100 bg-white p-2 transition hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-indigo-950/10"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                  isToday
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {day}
                              </span>
                              <Plus className="h-3.5 w-3.5 text-indigo-500 opacity-0 transition group-hover:opacity-100" />
                            </div>

                            <div className="space-y-1">
                              {meetings.slice(0, 3).map((meeting) => (
                                <button
                                  type="button"
                                  key={meeting.id}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openMeetingEdit(meeting);
                                  }}
                                  className={`block w-full truncate rounded-md border px-2 py-1 text-left text-[9px] font-bold transition ${
                                    meeting.status === "CANCELADA"
                                      ? "border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-slate-800 dark:bg-slate-900"
                                      : meeting.status === "REALIZADA"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                      : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300"
                                  }`}
                                  title={`${meeting.hora_reuniao} • ${meeting.lead_empresa || meeting.titulo}`}
                                >
                                  {safe(meeting.hora_reuniao).slice(0, 5)} •{" "}
                                  {meeting.lead_empresa || meeting.titulo}
                                </button>
                              ))}
                              {meetings.length > 3 && (
                                <div className="text-[9px] font-bold text-slate-400">
                                  +{meetings.length - 3} reunião(ões)
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Próximas reuniões
                  </h4>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Agenda comercial mais próxima.
                  </p>
                </div>
                <CalendarClock className="h-5 w-5 text-indigo-500" />
              </div>

              <div className="space-y-2">
                {upcomingMeetings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400 dark:border-slate-700">
                    Nenhuma reunião futura.
                  </div>
                ) : (
                  upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openMeetingEdit(meeting)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                            {meeting.lead_empresa || meeting.titulo}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatMeetingDate(meeting.data_reuniao, meeting.hora_reuniao)}
                          </div>
                          {meeting.responsavel_nome && (
                            <div className="mt-1 truncate text-[10px] text-slate-500">
                              Responsável: {meeting.responsavel_nome}
                            </div>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMeeting(meeting)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                          title="Excluir reunião"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {meeting.local_reuniao && (
                        <div className="mt-2 flex items-center gap-1.5 truncate text-[10px] text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {meeting.local_reuniao}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </WideModal>
      )}

      {blockOpen && (
        <Modal
          title="Bloquear horários da agenda"
          onClose={() => setBlockOpen(false)}
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
              Use esta tela quando quiser impedir novos agendamentos de leads em um dia ou horário.
              Reuniões já existentes de clientes e leads também aparecem como ocupadas e não podem ser bloqueadas por cima.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Dia">
                <input
                  type="date"
                  value={blockDate}
                  min={todayForInput()}
                  onChange={(event) => setBlockDate(event.target.value)}
                  className="field-input"
                />
              </FormField>

              <FormField label="Motivo do bloqueio (opcional)">
                <input
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Ex.: compromisso externo, treinamento..."
                  className="field-input"
                />
              </FormField>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Horários de 09:00 às 17:00
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Clique nos horários livres que deseja travar.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllFreeBlockSlots}
                    disabled={blocksLoading}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300"
                  >
                    Bloquear todos livres
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBlockSlots([])}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Limpar seleção
                  </button>
                </div>
              </div>

              {blocksLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando agenda do dia...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
                  {MEETING_HOURS.map((hour) => {
                    const slot = blockAvailability.find(
                      (item) => item.hora === hour
                    );
                    const existingBlock = agendaBlocks.find(
                      (block) => safe(block.hora_inicio).slice(0, 5) === hour
                    );
                    const selected = selectedBlockSlots.includes(hour);
                    const free = Boolean(slot?.disponivel);

                    return (
                      <button
                        key={hour}
                        type="button"
                        disabled={!free}
                        onClick={() => toggleBlockSlot(hour)}
                        title={
                          existingBlock
                            ? existingBlock.motivo || "Horário já bloqueado"
                            : free
                            ? `Selecionar ${hour} para bloquear`
                            : slot?.motivo || "Horário ocupado"
                        }
                        className={`min-h-[58px] rounded-xl border px-2 py-2 text-center transition ${
                          selected
                            ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                            : existingBlock
                            ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
                            : free
                            ? "border-emerald-200 bg-white text-emerald-700 hover:border-amber-400 hover:bg-amber-50 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-emerald-300"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-600"
                        }`}
                      >
                        <span className="block text-xs font-extrabold">
                          {hour}
                        </span>
                        <span className="mt-0.5 block truncate text-[8px] font-bold uppercase tracking-wide">
                          {selected
                            ? "Selecionado"
                            : existingBlock
                            ? "Bloqueado"
                            : free
                            ? "Livre"
                            : slot?.tipo === "CLIENTE"
                            ? "Cliente"
                            : slot?.tipo === "LEAD"
                            ? "Lead"
                            : "Ocupado"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {agendaBlocks.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Bloqueios deste dia
                  </h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {agendaBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {safe(block.hora_inicio).slice(0, 5)} às{" "}
                          {safe(block.hora_fim).slice(0, 5)}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {safe(block.motivo) || "Sem motivo informado"}
                          {block.autor_nome
                            ? ` · por ${safe(block.autor_nome)}`
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteBlock(block)}
                        className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Liberar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBlockOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={saveBlocks}
                disabled={savingBlocks || selectedBlockSlots.length === 0}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {savingBlocks && <Loader2 className="h-4 w-4 animate-spin" />}
                Bloquear selecionados
              </button>
            </div>
          </div>
        </Modal>
      )}

      {meetingOpen && (
        <Modal
          title={`${meetingForm.id ? "Editar reunião" : "Agendar reunião"}${
            selectedLead?.empresa ? ` — ${safe(selectedLead.empresa)}` : ""
          }`}
          onClose={() => setMeetingOpen(false)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField label="Lead *">
                <select
                  value={meetingForm.lead_id}
                  onChange={(event) => {
                    const nextLead = leads.find(
                      (lead) => String(lead.id) === event.target.value
                    );
                    setSelectedLead(nextLead || null);
                    setMeetingForm((previous) => ({
                      ...previous,
                      lead_id: event.target.value,
                      titulo:
                        previous.titulo && previous.lead_id
                          ? previous.titulo
                          : nextLead?.empresa
                          ? `Reunião comercial — ${nextLead.empresa}`
                          : "Reunião comercial",
                      participantes:
                        previous.participantes ||
                        safe(nextLead?.contato_nome),
                    }));
                  }}
                  className="field-input"
                >
                  <option value="">Selecione o lead...</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {safe(lead.empresa) || `Lead #${lead.id}`}
                      {lead.contato_nome ? ` — ${lead.contato_nome}` : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Título">
                <input
                  value={meetingForm.titulo}
                  onChange={(event) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      titulo: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Apresentação comercial"
                  className="field-input"
                />
              </FormField>
            </div>

            <FormField label="Data *">
              <input
                type="date"
                value={meetingForm.data_reuniao}
                onChange={(event) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    data_reuniao: event.target.value,
                    hora_reuniao: "",
                  }))
                }
                className="field-input"
              />
            </FormField>

            <FormField label="Duração">
              <select
                value={meetingForm.duracao_minutos}
                onChange={(event) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    duracao_minutos: event.target.value,
                    hora_reuniao: "",
                  }))
                }
                className="field-input"
              >
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hora</option>
                <option value="90">1h30</option>
                <option value="120">2 horas</option>
              </select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Horários disponíveis *">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  {availabilityLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs font-semibold text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando agenda de leads, clientes e bloqueios...
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
                        {MEETING_HOURS.map((hour) => {
                          const slot = meetingSlots.find(
                            (item) => item.hora === hour
                          );
                          const available = Boolean(slot?.disponivel);
                          const selected =
                            meetingForm.hora_reuniao === hour;

                          return (
                            <button
                              key={hour}
                              type="button"
                              disabled={!available}
                              onClick={() =>
                                setMeetingForm((previous) => ({
                                  ...previous,
                                  hora_reuniao: hour,
                                }))
                              }
                              title={
                                available
                                  ? `Selecionar ${hour}`
                                  : slot?.motivo || "Horário indisponível"
                              }
                              className={`min-h-[58px] rounded-xl border px-2 py-2 text-center transition ${
                                selected
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                                  : available
                                  ? "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-emerald-300"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-600"
                              }`}
                            >
                              <span className="block text-xs font-extrabold">
                                {hour}
                              </span>
                              <span className="mt-0.5 block truncate text-[8px] font-bold uppercase tracking-wide">
                                {available
                                  ? "Livre"
                                  : slot?.tipo === "CLIENTE"
                                  ? "Cliente"
                                  : slot?.tipo === "LEAD"
                                  ? "Lead"
                                  : slot?.tipo === "BLOQUEIO"
                                  ? "Bloqueado"
                                  : "Indisponível"}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>
                          <strong className="text-emerald-600">Livre</strong> = pode agendar
                        </span>
                        <span>
                          <strong className="text-slate-600 dark:text-slate-300">Cliente</strong> = reunião do Atas
                        </span>
                        <span>
                          <strong className="text-slate-600 dark:text-slate-300">Lead</strong> = reunião já agendada
                        </span>
                        <span>
                          <strong className="text-amber-600">Bloqueado</strong> = trava manual
                        </span>
                      </div>

                      {!meetingForm.hora_reuniao && (
                        <p className="mt-2 text-[10px] font-semibold text-rose-500">
                          Selecione um dos horários livres acima.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </FormField>
            </div>

            <FormField label="Tipo de reunião">
              <select
                value={meetingForm.tipo_reuniao}
                onChange={(event) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    tipo_reuniao: event.target.value,
                  }))
                }
                className="field-input"
              >
                {MEETING_TYPE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Status">
              <select
                value={meetingForm.status}
                onChange={(event) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    status: event.target.value,
                  }))
                }
                className="field-input"
              >
                {MEETING_STATUS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Local / Link">
                <input
                  value={meetingForm.local_reuniao}
                  onChange={(event) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      local_reuniao: event.target.value,
                    }))
                  }
                  placeholder="Google Meet, endereço, telefone..."
                  className="field-input"
                />
              </FormField>
            </div>

            <FormField label="Responsável">
              <select
                value={meetingForm.responsavel_id}
                onChange={(event) => {
                  const user = meetingUsers.find(
                    (item) => String(item.id) === event.target.value
                  );
                  setMeetingForm((previous) => ({
                    ...previous,
                    responsavel_id: event.target.value,
                    responsavel_nome: user?.nome || "",
                  }));
                }}
                className="field-input"
              >
                <option value="">Selecione...</option>
                {meetingUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Participantes">
              <input
                value={meetingForm.participantes}
                onChange={(event) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    participantes: event.target.value,
                  }))
                }
                placeholder="Ex.: João, Maria, Comercial"
                className="field-input"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Objetivo">
                <textarea
                  rows={3}
                  value={meetingForm.objetivo}
                  onChange={(event) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      objetivo: event.target.value,
                    }))
                  }
                  placeholder="Objetivo principal da reunião..."
                  className="field-input resize-none"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Observações">
                <textarea
                  rows={3}
                  value={meetingForm.observacoes}
                  onChange={(event) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      observacoes: event.target.value,
                    }))
                  }
                  placeholder="Informações extras, pauta, orientações..."
                  className="field-input resize-none"
                />
              </FormField>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div>
              {meetingForm.id && (
                <button
                  type="button"
                  onClick={() => {
                    const meeting = agendamentos.find(
                      (item) => Number(item.id) === Number(meetingForm.id)
                    );
                    if (meeting) {
                      deleteMeeting(meeting);
                      setMeetingOpen(false);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMeetingOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={saveMeeting}
                disabled={savingMeeting}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingMeeting && <Loader2 className="h-4 w-4 animate-spin" />}
                {meetingForm.id ? "Salvar alterações" : "Agendar reunião"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {followupOpen && selectedLead && (
        <Modal
          title={`Follow-up — ${safe(selectedLead.empresa) || `Lead #${selectedLead.id}`}`}
          onClose={() => !savingFollowup && setFollowupOpen(false)}
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Tarefa de follow-up
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Escolha a tarefa e defina quando ela precisa ser executada.
                  </p>
                </div>
              </div>

              {selectedLead.proxima_acao && (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2 ${
                    getFollowupVisual(selectedLead, followupClock).containerClass
                  }`}
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 text-[10px] font-black ${
                      getFollowupVisual(selectedLead, followupClock).textClass
                    }`}
                  >
                    <span>
                      Atual: {safe(selectedLead.followup_tarefa) || "Follow-up"}
                    </span>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 uppercase tracking-wide dark:bg-slate-950/50">
                      {getFollowupVisual(selectedLead, followupClock).label}
                    </span>
                  </div>
                  <div
                    className={`mt-1 text-xs font-bold ${
                      getFollowupVisual(selectedLead, followupClock).textClass
                    }`}
                  >
                    {formatDateTime(selectedLead.proxima_acao)}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                Selecione a tarefa
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FOLLOWUP_TASK_OPTIONS.map((task) => {
                  const selected = followupForm.tarefa === task;
                  return (
                    <button
                      type="button"
                      key={task}
                      onClick={() =>
                        setFollowupForm((previous) => ({
                          ...previous,
                          tarefa: task,
                        }))
                      }
                      className={`rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                      }`}
                    >
                      {task}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data">
                <input
                  type="date"
                  value={followupForm.data}
                  onChange={(event) =>
                    setFollowupForm((previous) => ({
                      ...previous,
                      data: event.target.value,
                    }))
                  }
                  className="field-input"
                />
              </FormField>

              <FormField label="Horário">
                <input
                  type="time"
                  value={followupForm.hora}
                  onChange={(event) =>
                    setFollowupForm((previous) => ({
                      ...previous,
                      hora: event.target.value,
                    }))
                  }
                  className="field-input"
                />
              </FormField>
            </div>

            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-bold dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
                Verde: tarefa para hoje
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
                Amarelo: faltam até 2 horas
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
                Vermelho: horário atrasado
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              {selectedLead.proxima_acao &&
                safe(selectedLead.followup_status).toUpperCase() !== "CONCLUIDO" && (
                  <button
                    type="button"
                    onClick={completeFollowup}
                    disabled={savingFollowup}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir tarefa
                  </button>
                )}

              <button
                type="button"
                onClick={saveFollowup}
                disabled={
                  savingFollowup ||
                  !followupForm.tarefa ||
                  !followupForm.data ||
                  !followupForm.hora
                }
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingFollowup ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Salvar follow-up
              </button>
            </div>
          </div>
        </Modal>
      )}

      {interactionOpen && selectedLead && (
        <Modal title={`Registrar contato — ${safe(selectedLead.empresa) || `Lead #${selectedLead.id}`}`} onClose={() => setInteractionOpen(false)}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Data e hora">
              <input
                type="datetime-local"
                value={interaction.data_contato}
                onChange={(event) =>
                  setInteraction((previous) => ({ ...previous, data_contato: event.target.value }))
                }
                className="field-input"
              />
            </FormField>

            <FormField label="Meio de contato">
              <select
                value={interaction.meio_contato}
                onChange={(event) =>
                  setInteraction((previous) => ({ ...previous, meio_contato: event.target.value }))
                }
                className="field-input"
              >
                {MEIO_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Houve retorno?">
              <select
                value={interaction.resultado}
                onChange={(event) =>
                  setInteraction((previous) => ({ ...previous, resultado: event.target.value }))
                }
                className="field-input"
              >
                {RETORNO_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Interesse">
              <select
                value={interaction.interesse}
                onChange={(event) =>
                  setInteraction((previous) => ({ ...previous, interesse: event.target.value }))
                }
                className="field-input"
              >
                {INTERESSE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Status após contato">
              <select
                value={interaction.status_apos}
                onChange={(event) =>
                  setInteraction((previous) => ({ ...previous, status_apos: event.target.value }))
                }
                className="field-input"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Próximo follow-up">
              <input
                type="datetime-local"
                value={interaction.proxima_acao}
                onChange={(event) =>
                  setInteraction((previous) => ({ ...previous, proxima_acao: event.target.value }))
                }
                className="field-input"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Observação deste contato">
                <textarea
                  rows={4}
                  value={interaction.observacao}
                  onChange={(event) =>
                    setInteraction((previous) => ({ ...previous, observacao: event.target.value }))
                  }
                  placeholder="Ex.: falei com o comercial, pediu apresentação por e-mail e retorno na sexta..."
                  className="field-input resize-none"
                />
              </FormField>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setInteractionOpen(false)}
              className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={saveInteraction}
              disabled={savingInteraction}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingInteraction && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar contato
            </button>
          </div>
        </Modal>
      )}

      {observationsOpen && selectedLead && (
        <Modal
          title={`Observações — ${safe(selectedLead.empresa) || `Lead #${selectedLead.id}`}`}
          onClose={() => !savingObservation && setObservationsOpen(false)}
        >
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-300">
                <MessageSquarePlus className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Nova observação
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Registre responsável pelo marketing, pessoa contatada, comentários, pendências,
                  retornos combinados e qualquer informação importante. As observações anteriores
                  nunca são substituídas.
                </p>
              </div>
            </div>

            <textarea
              rows={5}
              value={observationText}
              onChange={(event) => setObservationText(event.target.value)}
              placeholder="Ex.: Conversado com Maria, responsável pelo marketing. Pediu retorno na próxima semana..."
              className="field-input mt-3 resize-none"
              autoFocus
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Próxima ação atual: <strong>{formatDateTime(selectedLead.proxima_acao)}</strong>
              </div>
              <button
                type="button"
                onClick={saveObservation}
                disabled={savingObservation || !observationText.trim()}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingObservation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Adicionar ao histórico
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Histórico de observações
                </h4>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {observations.length} registro(s) deste lead
                </p>
              </div>
            </div>

            {observationsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : observations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
                Ainda não há observações registradas para este lead.
              </div>
            ) : (
              <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
                {observations.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                        <Clock3 className="h-4 w-4 text-amber-500" />
                        {formatDateTime(item.data_observacao)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {safe(item.autor_nome) || "Equipe"}
                      </div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.observacao}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {historyOpen && selectedLead && (
        <Modal title={`Histórico de contatos — ${safe(selectedLead.empresa) || `Lead #${selectedLead.id}`}`} onClose={() => setHistoryOpen(false)}>
          {historyLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
              Ainda não há contatos registrados para este lead.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <Clock3 className="h-4 w-4 text-indigo-500" />
                      {formatDateTime(item.data_contato)}
                      {item.meio_contato && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] dark:bg-slate-800">
                          {item.meio_contato}
                        </span>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${interestClass(item.interesse || "")}`}>
                      {item.interesse || "NÃO AVALIADO"}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-slate-600 dark:text-slate-300">
                    <div><strong>Retorno:</strong> {item.resultado || "—"}</div>
                    <div><strong>Status:</strong> {item.status_apos || "—"}</div>
                    <div><strong>Próxima ação:</strong> {formatDateTime(item.proxima_acao)}</div>
                    {item.observacao && <div className="mt-1 whitespace-normal"><strong>Observação:</strong> {item.observacao}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      <style>{`
        .field-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.6rem 0.75rem;
          font-size: 0.75rem;
          color: rgb(30 41 59);
          outline: none;
        }
        .field-input:focus {
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.28);
          border-color: rgb(99 102 241);
        }
        .dark .field-input {
          border-color: rgb(51 65 85);
          background: rgb(2 6 23);
          color: rgb(226 232 240);
        }
      `}</style>
    </div>
  );
};

interface EditableCellProps {
  lead: LeadProspeccao;
  field: "cidade" | "segmento" | "site" | "contato_nome" | "whatsapp" | "email";
  onLocal: (id: number, field: keyof LeadProspeccao, value: string) => void;
  onSave: (id: number, field: keyof LeadProspeccao, value: string) => Promise<void>;
}

const EditableCell: React.FC<EditableCellProps> = ({ lead, field, onLocal, onSave }) => (
  <td className="p-1">
    <input
      value={safe(lead[field])}
      onChange={(event) => onLocal(lead.id, field, event.target.value)}
      onBlur={(event) => onSave(lead.id, field, event.target.value)}
      className="w-full rounded bg-transparent px-2 py-1.5 outline-none transition hover:bg-white/70 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:hover:bg-slate-950 dark:focus:bg-slate-950"
    />
  </td>
);

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
      {icon}
      {label}
    </div>
    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{value}</div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
    {children}
  </label>
);

const WideModal: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm md:p-5">
    <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto p-4 md:p-5">{children}</div>
    </div>
  </div>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto p-5">{children}</div>
    </div>
  </div>
);

// Compatibilidade: no seu sistema atual a tela também pode estar importada como "Leads".
export const Leads = ControleLeadsView;

export default ControleLeadsView;
