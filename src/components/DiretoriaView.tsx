import React, { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { User } from "../types";
import { OperacionalView } from "./OperacionalView";

const API_URL = "https://sothink.com.br/app/api/operacional";
const CLIENTS_API_URL = "https://sothink.com.br/app/api/listar?tabela=clientes";

type SubQuadroDiretoria = "operacional" | "agenda";
type StatusAgenda = "AGENDADO" | "REALIZADO" | "CANCELADO";

interface DiretoriaViewProps {
  users: User[];
  currentUser: User | null;
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    desc?: string,
  ) => void;
}

interface ClienteAgenda {
  id: string;
  nome_fantasia?: string;
  razao_social?: string;
}

interface AgendaDiretoriaItem {
  id: string | number;
  titulo: string;
  tipo_atendimento?: string;
  data_atendimento: string;
  hora_inicio: string;
  hora_fim?: string;
  duracao_minutos?: string | number;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  contato_nome?: string | null;
  local_atendimento?: string | null;
  observacoes?: string | null;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  status?: StatusAgenda | string;
  bloqueio_id?: string | number | null;
  criador_id?: string | null;
  criador_nome?: string | null;
  data_criacao?: string | null;
  data_atualizacao?: string | null;
}

interface AgendaForm {
  titulo: string;
  tipo_atendimento: string;
  data_atendimento: string;
  hora_inicio: string;
  duracao_minutos: string;
  cliente_id: string;
  cliente_nome: string;
  contato_nome: string;
  local_atendimento: string;
  observacoes: string;
  responsavel_id: string;
  responsavel_nome: string;
  status: StatusAgenda;
}

const TIPOS_ATENDIMENTO = [
  "REUNIÃO",
  "LIGAÇÃO",
  "VISITA",
  "ATENDIMENTO",
  "COMERCIAL",
  "INTERNO",
  "PESSOAL",
  "OUTRO",
] as const;

const DURACOES = [
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h30" },
  { value: "120", label: "2 horas" },
  { value: "180", label: "3 horas" },
  { value: "240", label: "4 horas" },
] as const;

const todayKey = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const currentMonthKey = () => todayKey().slice(0, 7);

const safeDate = (value?: string | null) =>
  String(value || "")
    .split("T")[0]
    .split(" ")[0];

const safeTime = (value?: string | null) => String(value || "").slice(0, 5);

const formatDateBR = (value?: string | null) => {
  const key = safeDate(value);
  if (!key) return "-";
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return Number.isNaN(date.getTime()) ? key : date.toLocaleDateString("pt-BR");
};

async function parseJson(response: Response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(raw || `Erro HTTP ${response.status}`);
  }
}

const statusClass = (status?: string) => {
  if (status === "REALIZADO")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (status === "CANCELADO")
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
  return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300";
};

export const DiretoriaView: React.FC<DiretoriaViewProps> = ({
  users,
  currentUser,
  showToast,
}) => {
  const [subQuadro, setSubQuadro] = useState<SubQuadroDiretoria>("operacional");

  const [agenda, setAgenda] = useState<AgendaDiretoriaItem[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaSaving, setAgendaSaving] = useState(false);
  const [agendaMonth, setAgendaMonth] = useState(currentMonthKey());
  const [clientes, setClientes] = useState<ClienteAgenda[]>([]);
  const [agendaModalOpen, setAgendaModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] =
    useState<AgendaDiretoriaItem | null>(null);

  const juniorUser = useMemo(() => {
    const todos = Array.isArray(users) ? users : [];
    return (
      todos.find((user: any) =>
        String(user?.nome || user?.name || "")
          .toLocaleLowerCase("pt-BR")
          .includes("junior"),
      ) || currentUser
    );
  }, [users, currentUser]);

  const emptyAgendaForm = (): AgendaForm => ({
    titulo: "",
    tipo_atendimento: "ATENDIMENTO",
    data_atendimento: todayKey(),
    hora_inicio: "09:00",
    duracao_minutos: "60",
    cliente_id: "",
    cliente_nome: "",
    contato_nome: "",
    local_atendimento: "",
    observacoes: "",
    responsavel_id: String((juniorUser as any)?.id || ""),
    responsavel_nome: String(
      (juniorUser as any)?.nome || (juniorUser as any)?.name || "Junior",
    ),
    status: "AGENDADO",
  });

  const [agendaForm, setAgendaForm] = useState<AgendaForm>(emptyAgendaForm());

  useEffect(() => {
    setAgendaForm((prev) => ({
      ...prev,
      responsavel_id:
        prev.responsavel_id || String((juniorUser as any)?.id || ""),
      responsavel_nome:
        prev.responsavel_nome ||
        String(
          (juniorUser as any)?.nome || (juniorUser as any)?.name || "Junior",
        ),
    }));
  }, [juniorUser]);

  const loadClientes = async () => {
    try {
      const response = await fetch(CLIENTS_API_URL, { cache: "no-store" });
      const data = await parseJson(response);
      if (!response.ok || data?.erro) {
        throw new Error(data?.erro || "Não foi possível carregar clientes.");
      }

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.dados)
          ? data.dados
          : [];

      setClientes(
        lista
          .filter((item: any) => item?.id)
          .map((item: any) => ({
            id: String(item.id),
            nome_fantasia: item.nome_fantasia,
            razao_social: item.razao_social,
          }))
          .sort((a: ClienteAgenda, b: ClienteAgenda) =>
            String(a.nome_fantasia || a.razao_social || "").localeCompare(
              String(b.nome_fantasia || b.razao_social || ""),
              "pt-BR",
            ),
          ),
      );
    } catch (error) {
      console.error("Erro ao carregar clientes da Agenda Diretoria:", error);
    }
  };

  const loadAgenda = async () => {
    try {
      setAgendaLoading(true);
      const response = await fetch(
        `${API_URL}?action=agenda_read&mes=${encodeURIComponent(agendaMonth)}`,
        { cache: "no-store" },
      );
      const data = await parseJson(response);
      if (!response.ok || data?.erro) {
        throw new Error(data?.erro || "Não foi possível carregar a agenda.");
      }

      setAgenda(Array.isArray(data) ? data : data?.dados || []);
    } catch (error: any) {
      showToast(
        "error",
        "Erro ao carregar Agenda Diretoria",
        error?.message || "Não foi possível carregar os atendimentos.",
      );
      setAgenda([]);
    } finally {
      setAgendaLoading(false);
    }
  };

  useEffect(() => {
    if (subQuadro !== "agenda") return;
    void loadAgenda();
    void loadClientes();
  }, [subQuadro, agendaMonth]);

  const openNewAgenda = (date?: string) => {
    setEditingAgenda(null);
    setAgendaForm({
      ...emptyAgendaForm(),
      data_atendimento: date || todayKey(),
    });
    setAgendaModalOpen(true);
  };

  const openAgenda = (item: AgendaDiretoriaItem) => {
    setEditingAgenda(item);
    setAgendaForm({
      titulo: item.titulo || "",
      tipo_atendimento: item.tipo_atendimento || "ATENDIMENTO",
      data_atendimento: safeDate(item.data_atendimento),
      hora_inicio: safeTime(item.hora_inicio) || "09:00",
      duracao_minutos: String(item.duracao_minutos || "60"),
      cliente_id: String(item.cliente_id || ""),
      cliente_nome: String(item.cliente_nome || ""),
      contato_nome: String(item.contato_nome || ""),
      local_atendimento: String(item.local_atendimento || ""),
      observacoes: String(item.observacoes || ""),
      responsavel_id: String(item.responsavel_id || ""),
      responsavel_nome: String(item.responsavel_nome || "Junior"),
      status:
        item.status === "REALIZADO" || item.status === "CANCELADO"
          ? item.status
          : "AGENDADO",
    });
    setAgendaModalOpen(true);
  };

  const onSelectCliente = (clienteId: string) => {
    const cliente = clientes.find(
      (item) => String(item.id) === String(clienteId),
    );
    setAgendaForm((prev) => ({
      ...prev,
      cliente_id: clienteId,
      cliente_nome: cliente
        ? String(cliente.nome_fantasia || cliente.razao_social || "")
        : "",
    }));
  };

  const saveAgenda = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!agendaForm.titulo.trim()) {
      showToast("error", "Informe o título do atendimento.");
      return;
    }
    if (!agendaForm.data_atendimento || !agendaForm.hora_inicio) {
      showToast("error", "Informe a data e o horário do atendimento.");
      return;
    }

    try {
      setAgendaSaving(true);
      const body = new FormData();
      body.append(
        "action",
        editingAgenda?.id ? "agenda_update" : "agenda_create",
      );
      if (editingAgenda?.id) body.append("id", String(editingAgenda.id));

      Object.entries(agendaForm).forEach(([key, value]) =>
        body.append(key, String(value ?? "")),
      );

      body.append("criador_id", String((currentUser as any)?.id || ""));
      body.append(
        "criador_nome",
        String(
          (currentUser as any)?.nome ||
            (currentUser as any)?.name ||
            "Equipe Sothink",
        ),
      );

      const response = await fetch(API_URL, { method: "POST", body });
      const data = await parseJson(response);

      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível salvar o atendimento.");
      }

      setAgendaModalOpen(false);
      setEditingAgenda(null);

      const month = agendaForm.data_atendimento.slice(0, 7);
      if (month && month !== agendaMonth) {
        setAgendaMonth(month);
      } else {
        await loadAgenda();
      }

      showToast(
        "success",
        editingAgenda ? "Atendimento atualizado!" : "Atendimento agendado!",
        agendaForm.status === "CANCELADO"
          ? "O horário foi liberado no Quadro Comercial."
          : "O dia e horário já estão bloqueados no Quadro Comercial.",
      );
    } catch (error: any) {
      showToast(
        "error",
        "Horário não disponível",
        error?.message || "Não foi possível salvar o atendimento.",
      );
    } finally {
      setAgendaSaving(false);
    }
  };

  const deleteAgenda = async () => {
    if (!editingAgenda?.id) return;

    if (
      !window.confirm(
        `Excluir o atendimento "${editingAgenda.titulo}"? O horário será liberado no Comercial.`,
      )
    ) {
      return;
    }

    try {
      setAgendaSaving(true);
      const body = new FormData();
      body.append("action", "agenda_delete");
      body.append("id", String(editingAgenda.id));

      const response = await fetch(API_URL, { method: "POST", body });
      const data = await parseJson(response);

      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(
          data?.erro || "Não foi possível excluir o atendimento.",
        );
      }

      setAgendaModalOpen(false);
      setEditingAgenda(null);
      await loadAgenda();
      showToast(
        "info",
        "Atendimento excluído",
        "O horário foi liberado no Quadro Comercial.",
      );
    } catch (error: any) {
      showToast(
        "error",
        "Erro ao excluir atendimento",
        error?.message || "Não foi possível excluir o atendimento.",
      );
    } finally {
      setAgendaSaving(false);
    }
  };

  const agendaPorData = useMemo(() => {
    const map = new Map<string, AgendaDiretoriaItem[]>();

    agenda.forEach((item) => {
      const date = safeDate(item.data_atendimento);
      if (!date) return;
      const list = map.get(date) || [];
      list.push(item);
      map.set(date, list);
    });

    map.forEach((list) =>
      list.sort((a, b) =>
        safeTime(a.hora_inicio).localeCompare(safeTime(b.hora_inicio)),
      ),
    );

    return map;
  }, [agenda]);

  const calendarData = useMemo(() => {
    const [year, month] = agendaMonth.split("-").map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    return { year, month, firstDayIndex, daysInMonth };
  }, [agendaMonth]);

  const moveMonth = (offset: number) => {
    const [year, month] = agendaMonth.split("-").map(Number);
    const target = new Date(year, month - 1 + offset, 1, 12, 0, 0);
    setAgendaMonth(
      `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const monthLabel = useMemo(() => {
    const [year, month] = agendaMonth.split("-").map(Number);
    return new Date(year, month - 1, 1, 12, 0, 0).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [agendaMonth]);

  const agendaContent = (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            Agenda Diretoria
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-500 dark:text-slate-400">
            Atendimentos do JR. Todo horário AGENDADO ou REALIZADO aqui cria
            automaticamente um bloqueio na agenda do Comercial, impedindo
            agendamento duplicado no mesmo período.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewAgenda()}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          NOVO ATENDIMENTO
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300">
        <strong>Integração ativa:</strong> a Agenda Diretoria usa a mesma trava
        de horários do Quadro Comercial. Cancelar ou excluir um atendimento
        libera o horário novamente.
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <strong className="min-w-[180px] text-center text-sm capitalize text-slate-800 dark:text-slate-100">
              {monthLabel}
            </strong>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={agendaMonth}
              onChange={(event) => setAgendaMonth(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={() => setAgendaMonth(currentMonthKey())}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hoje
            </button>
          </div>
        </div>

        {agendaLoading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-400"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: calendarData.firstDayIndex }).map(
                  (_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[150px] border-b border-r border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/20"
                    />
                  ),
                )}

                {Array.from({ length: calendarData.daysInMonth }).map(
                  (_, index) => {
                    const day = index + 1;
                    const dateKey = `${calendarData.year}-${String(
                      calendarData.month,
                    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const items = agendaPorData.get(dateKey) || [];
                    const isToday = dateKey === todayKey();

                    return (
                      <div
                        key={dateKey}
                        onDoubleClick={() => openNewAgenda(dateKey)}
                        className={`min-h-[150px] border-b border-r border-slate-100 p-2 align-top transition hover:bg-indigo-50/20 dark:border-slate-800 dark:hover:bg-indigo-950/10 ${
                          isToday ? "bg-indigo-50/60 dark:bg-indigo-950/20" : ""
                        }`}
                        title="Duplo clique para criar atendimento neste dia"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${
                              isToday
                                ? "bg-indigo-600 text-white"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {day}
                          </span>

                          <button
                            type="button"
                            onClick={() => openNewAgenda(dateKey)}
                            className="rounded-md p-1 text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-600 dark:hover:bg-indigo-950/40"
                            title="Novo atendimento neste dia"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {items.map((item) => (
                            <button
                              key={String(item.id)}
                              type="button"
                              onClick={() => openAgenda(item)}
                              className={`w-full rounded-lg border px-2 py-1.5 text-left text-[10px] transition hover:shadow-sm ${
                                item.status === "CANCELADO"
                                  ? "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
                                  : "border-indigo-200 bg-indigo-50/80 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200"
                              }`}
                              title={`${safeTime(item.hora_inicio)} - ${safeTime(
                                item.hora_fim,
                              )} · ${item.titulo}`}
                            >
                              <div className="flex items-center gap-1 font-black">
                                <Clock3 className="h-3 w-3 shrink-0" />
                                {safeTime(item.hora_inicio)}
                                <span className="truncate">
                                  · {item.titulo}
                                </span>
                              </div>
                              {item.cliente_nome && (
                                <div className="mt-0.5 truncate opacity-75">
                                  {item.cliente_nome}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
          Atendimentos do mês
        </h3>

        <div className="space-y-2">
          {agenda.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400 dark:border-slate-700">
              Nenhum atendimento neste mês.
            </div>
          ) : (
            [...agenda]
              .sort((a, b) =>
                `${safeDate(a.data_atendimento)} ${safeTime(
                  a.hora_inicio,
                )}`.localeCompare(
                  `${safeDate(b.data_atendimento)} ${safeTime(b.hora_inicio)}`,
                ),
              )
              .map((item) => (
                <button
                  key={`list-${String(item.id)}`}
                  type="button"
                  onClick={() => openAgenda(item)}
                  className="grid w-full grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 text-left text-xs transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/10 md:grid-cols-[130px_90px_1fr_180px_110px]"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {formatDateBR(item.data_atendimento)}
                  </span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    {safeTime(item.hora_inicio)}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-slate-900 dark:text-white">
                      {item.titulo}
                    </strong>
                    <span className="block truncate text-[10px] text-slate-400">
                      {item.cliente_nome ||
                        item.contato_nome ||
                        item.tipo_atendimento ||
                        "Atendimento Diretoria"}
                    </span>
                  </span>
                  <span className="truncate text-slate-500 dark:text-slate-400">
                    {item.local_atendimento || "Local não informado"}
                  </span>
                  <span
                    className={`justify-self-start rounded-md px-2 py-1 text-[9px] font-extrabold ${statusClass(
                      item.status,
                    )}`}
                  >
                    {item.status || "AGENDADO"}
                  </span>
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              <BriefcaseBusiness className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Diretoria
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Gestão operacional interna e agenda de atendimentos da Diretoria.
            </p>
          </div>

          <div className="flex w-full max-w-md rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSubQuadro("operacional")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                subQuadro === "operacional"
                  ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Operacional
            </button>
            <button
              type="button"
              onClick={() => setSubQuadro("agenda")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                subQuadro === "agenda"
                  ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Agenda Diretoria
            </button>
          </div>
        </div>
      </div>

      {subQuadro === "operacional" ? (
        <OperacionalView
          users={users}
          currentUser={currentUser}
          showToast={showToast}
        />
      ) : (
        agendaContent
      )}

      {agendaModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 pt-8 backdrop-blur-sm"
          onClick={() => !agendaSaving && setAgendaModalOpen(false)}
        >
          <form
            onSubmit={saveAgenda}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                  <CalendarDays className="h-5 w-5 text-indigo-500" />
                  {editingAgenda
                    ? "Editar atendimento — Diretoria"
                    : "Novo atendimento — Diretoria"}
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  Ao salvar como AGENDADO ou REALIZADO, o mesmo intervalo fica
                  automaticamente indisponível no Quadro Comercial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAgendaModalOpen(false)}
                disabled={agendaSaving}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Título / atendimento *
                </label>
                <input
                  required
                  value={agendaForm.titulo}
                  onChange={(event) =>
                    setAgendaForm((prev) => ({
                      ...prev,
                      titulo: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Ex.: Reunião com cliente, visita, compromisso..."
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Tipo de atendimento
                </label>
                <select
                  value={agendaForm.tipo_atendimento}
                  onChange={(event) =>
                    setAgendaForm((prev) => ({
                      ...prev,
                      tipo_atendimento: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  {TIPOS_ATENDIMENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={agendaForm.status}
                  onChange={(event) =>
                    setAgendaForm((prev) => ({
                      ...prev,
                      status: event.target.value as StatusAgenda,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="AGENDADO">AGENDADO</option>
                  <option value="REALIZADO">REALIZADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Data *
                </label>
                <input
                  required
                  type="date"
                  value={agendaForm.data_atendimento}
                  onChange={(event) =>
                    setAgendaForm((prev) => ({
                      ...prev,
                      data_atendimento: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                    Início *
                  </label>
                  <input
                    required
                    type="time"
                    value={agendaForm.hora_inicio}
                    onChange={(event) =>
                      setAgendaForm((prev) => ({
                        ...prev,
                        hora_inicio: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                    Duração
                  </label>
                  <select
                    value={agendaForm.duracao_minutos}
                    onChange={(event) =>
                      setAgendaForm((prev) => ({
                        ...prev,
                        duracao_minutos: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800"
                  >
                    {DURACOES.map((duracao) => (
                      <option key={duracao.value} value={duracao.value}>
                        {duracao.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Cliente cadastrado
                </label>
                <select
                  value={agendaForm.cliente_id}
                  onChange={(event) => onSelectCliente(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Sem cliente cadastrado</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome_fantasia ||
                        cliente.razao_social ||
                        cliente.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Empresa / pessoa
                </label>
                <input
                  value={agendaForm.cliente_nome}
                  onChange={(event) =>
                    setAgendaForm((prev) => ({
                      ...prev,
                      cliente_nome: event.target.value,
                      cliente_id:
                        prev.cliente_id &&
                        event.target.value !== prev.cliente_nome
                          ? ""
                          : prev.cliente_id,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Opcional para contatos externos/pessoais"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Contato
                </label>
                <input
                  value={agendaForm.contato_nome}
                  onChange={(event) =>
                    setAgendaForm((prev) => ({
                      ...prev,
                      contato_nome: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Nome da pessoa"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Local / link
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={agendaForm.local_atendimento}
                    onChange={(event) =>
                      setAgendaForm((prev) => ({
                        ...prev,
                        local_atendimento: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Google Meet, endereço, telefone..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Responsável
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold dark:border-slate-700 dark:bg-slate-800">
                  <UserRound className="h-4 w-4 text-indigo-500" />
                  {agendaForm.responsavel_nome || "Junior"}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-300">
                  Observações
                </label>
                <textarea
                  rows={4}
                  value={agendaForm.observacoes}
                  onChange={(event) =>
                    setAgendaForm((prev) => ({
                      ...prev,
                      observacoes: event.target.value,
                    }))
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Detalhes do atendimento..."
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {editingAgenda && (
                  <button
                    type="button"
                    onClick={deleteAgenda}
                    disabled={agendaSaving}
                    className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir atendimento
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAgendaModalOpen(false)}
                  disabled={agendaSaving}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={agendaSaving}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  {agendaSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar atendimento
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
