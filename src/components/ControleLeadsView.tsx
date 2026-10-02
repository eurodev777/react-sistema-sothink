import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  CalendarClock,
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
  observacoes: string | null;
  fonte: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  data_criacao: string;
  data_atualizacao: string;
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

const safe = (value: unknown) =>
  value === null || value === undefined || value === "null" ? "" : String(value);

const nowForInput = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
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

  const handleAddLead = async () => {
    const form = new FormData();
    form.append("action", "create");
    form.append("fonte", "Manual");

    try {
      const response = await fetch(API_URL, { method: "POST", body: form });
      const data = await parseJsonResponse(response);
      if (!response.ok || !data.sucesso) throw new Error(data.erro || "Erro ao criar lead.");
      await fetchLeads();
      showNotice({ type: "success", text: "Nova linha criada. Preencha os dados do lead." });
    } catch (error) {
      showNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao criar lead.",
      });
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

  const isFollowupLate = (value?: string | null) => {
    if (!value) return false;
    const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
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

      <div className="flex flex-col gap-4 border-b border-slate-300 pb-4 dark:border-slate-700 xl:flex-row xl:items-center xl:justify-between">
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

      <div className="grid gap-2 rounded-2xl border border-slate-300 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[1fr_180px_160px_180px]">
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
                  className={`flex w-[320px] flex-none flex-col overflow-hidden rounded-2xl border border-slate-300 border-t-4 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${column.color}`}
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
                        const late = isFollowupLate(lead.proxima_acao);
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

                                <div
                                  className={`mt-3 rounded-lg border px-2.5 py-2 ${
                                    late
                                      ? "border-rose-200 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/25"
                                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    <CalendarClock
                                      className={`h-3.5 w-3.5 ${
                                        late ? "text-rose-500" : "text-indigo-500"
                                      }`}
                                    />
                                    {lead.proxima_acao
                                      ? `Follow-up: ${formatDateTime(lead.proxima_acao)}`
                                      : "Sem próximo follow-up"}
                                  </div>
                                  {late && (
                                    <div className="mt-1 text-[9px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400">
                                      Ação atrasada
                                    </div>
                                  )}
                                </div>

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
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-300 bg-slate-200/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
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
                <th className="px-3 py-3 w-44">Próxima ação</th>
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
                      <input
                        type="datetime-local"
                        value={toInputDateTime(lead.proxima_acao)}
                        onChange={(event) => patchLocalLead(lead.id, "proxima_acao", event.target.value)}
                        onBlur={(event) => saveField(lead.id, "proxima_acao", event.target.value)}
                        className="w-full rounded bg-transparent px-2 py-1.5 outline-none transition hover:bg-white/70 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:hover:bg-slate-950 dark:focus:bg-slate-950"
                      />
                    </td>

                    <td className="p-1">
                      <input
                        value={safe(lead.observacoes)}
                        onChange={(event) => patchLocalLead(lead.id, "observacoes", event.target.value)}
                        onBlur={(event) => saveField(lead.id, "observacoes", event.target.value)}
                        placeholder="Observação geral..."
                        className="w-full rounded bg-transparent px-2 py-1.5 outline-none transition hover:bg-white/70 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:hover:bg-slate-950 dark:focus:bg-slate-950"
                      />
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

      {historyOpen && selectedLead && (
        <Modal title={`Histórico — ${safe(selectedLead.empresa) || `Lead #${selectedLead.id}`}`} onClose={() => setHistoryOpen(false)}>
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
  <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

// Compatibilidade: no seu sistema atual a tela também pode estar importada como "Leads".
export const Leads = ControleLeadsView;

export default ControleLeadsView;
