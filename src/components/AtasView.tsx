import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  X,
  Printer,
  ChevronRight,
  ChevronLeft,
  Edit,
  Loader2,
} from "lucide-react";
import { AtaReuniao, EmpresaCliente, User } from "../types";
import { formatarData } from "../utils/formatarData";

interface AtasViewProps {
  atas?: AtaReuniao[];
  clientes: EmpresaCliente[];
  onSaveAta?: (ataData: Partial<AtaReuniao>) => Promise<void>;
  onDeleteAta?: (id: string) => Promise<void>;
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    desc?: string,
  ) => void;
  preSelectedClient?: EmpresaCliente | null;
}

export const AtasView: React.FC<AtasViewProps> = ({
  clientes,
  showToast,
  preSelectedClient,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClientId, setFilterClientId] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewAtaModal, setViewAtaModal] = useState<AtaReuniao | null>(null);
  // Estados Locais API
  const [localAtas, setLocalAtas] = useState<AtaReuniao[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  // Form State
  const [formData, setFormData] = useState<Partial<AtaReuniao>>({});
  const [externalParticipantInput, setExternalParticipantInput] = useState("");

  // ==========================================
  // BUSCAR DADOS (API)
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Busca os Usuários para o Select de Responsável
      const resUsers = await fetch(
        "https://sothink.com.br/app/api/listar?tabela=usuarios",
      );
      const dataUsers = await resUsers.json();
      setUsuarios(Array.isArray(dataUsers) ? dataUsers : []);

      // 2. Busca as Atas (Apenas a tabela atas_reuniao)
      const resAtas = await fetch(
        "https://sothink.com.br/app/api/listar?tabela=atas_reuniao",
      );
      const dataAtas = await resAtas.json();

      const formatadas = Array.isArray(dataAtas)
        ? dataAtas.map((ata: any) => {
            const cli = clientes.find(
              (c) => String(c.id) === String(ata.cliente_id),
            );
            return {
              ...ata,
              cliente_nome: cli
                ? cli.nome_fantasia || cli.razao_social
                : "Cliente Removido",
              assuntos_discutidos: ata.assuntos || "",
              participantes: ata.participantes_externos
                ? JSON.parse(ata.participantes_externos)
                : [],
              // Como você não tem a tabela atas_acoes no banco, vamos inicializar vazia para não quebrar o layout
              acoes: [],
            };
          })
        : [];

      setLocalAtas(formatadas);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      showToast("error", "Erro ao carregar atas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientes]);

  const filteredAtas = localAtas.filter((a) => {
    const matchesSearch =
      a.objetivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.responsavel?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient =
      filterClientId === "all" || a.cliente_id === filterClientId;
    return matchesSearch && matchesClient;
  });

  const monthNames = [
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

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const formatCalendarDate = (
    year: number,
    monthIndex: number,
    day: number,
  ) => {
    const month = String(monthIndex + 1).padStart(2, "0");
    const dayFormatted = String(day).padStart(2, "0");

    return `${year}-${month}-${dayFormatted}`;
  };

  const getTodayISO = () => {
    const today = new Date();

    return formatCalendarDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";

    const parts = name.trim().split(" ");

    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  };

  const getAtasForDay = (day: number) => {
    return filteredAtas.filter((ata) => {
      if (!ata.data_reuniao || String(ata.data_reuniao).startsWith("0000")) {
        return false;
      }

      const onlyDate = String(ata.data_reuniao).split("T")[0].split(" ")[0];
      const [ataYear, ataMonth, ataDay] = onlyDate.split("-").map(Number);

      return (
        ataYear === currentYear &&
        ataMonth - 1 === currentMonth &&
        ataDay === day
      );
    });
  };

  // ==========================================
  // FUNÇÕES DO MODAL
  // ==========================================
  const openNewAtaModal = (selectedDate?: string) => {
    const defaultClient = preSelectedClient || clientes[0];
    setFormData({
      cliente_id: defaultClient?.id || "",
      cliente_nome:
        defaultClient?.nome_fantasia || defaultClient?.razao_social || "",
      data_reuniao: selectedDate || getTodayISO(),
      hora_reuniao: "10:00",
      local_reuniao: "Google Meet",
      tipo_reuniao: "Online",
      responsavel: "", // Vazio para selecionar no Select
      participantes: defaultClient?.responsaveis?.[0]?.nome
        ? [
            `${defaultClient.responsaveis[0].nome} (${defaultClient.nome_fantasia})`,
          ]
        : [],
      objetivo: "",
      assuntos_discutidos: "",
      decisoes: "",
      pendencias: "",
      proximos_passos: "",
      observacoes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (ata: AtaReuniao) => {
    setFormData({ ...ata });
    setModalOpen(true);
  };

  const selectedCompany = clientes.find((c) => c.id === formData.cliente_id);

  // PARTICIPANTES
  const handleToggleParticipant = (name: string) => {
    setFormData((prev) => {
      const current = prev.participantes || [];
      if (current.includes(name)) {
        return { ...prev, participantes: current.filter((p) => p !== name) };
      }
      return { ...prev, participantes: [...current, name] };
    });
  };

  const handleAddExternalParticipant = () => {
    if (!externalParticipantInput.trim()) return;
    handleToggleParticipant(`${externalParticipantInput.trim()}`);
    setExternalParticipantInput("");
  };

  // ==========================================
  // SALVAR / DELETAR NA API
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.objetivo) {
      showToast(
        "error",
        "Objetivo é obrigatório",
        "Preencha o objetivo da reunião.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("tabela", "atas_reuniao");
      if (formData.id) form.append("id", formData.id);

      form.append("cliente_id", formData.cliente_id || "");
      form.append("data_reuniao", formData.data_reuniao || "");
      form.append("hora_reuniao", formData.hora_reuniao || "");
      form.append("local_reuniao", formData.local_reuniao || "");
      form.append("tipo_reuniao", formData.tipo_reuniao || "");
      form.append("responsavel", formData.responsavel || "");
      form.append("objetivo", formData.objetivo || "");

      // Mapeamento correto para o seu banco
      form.append("assuntos", formData.assuntos_discutidos || "");
      form.append("decisoes", formData.decisoes || "");
      form.append("pendencias", formData.pendencias || "");
      form.append("proximos_passos", formData.proximos_passos || "");
      form.append("observacoes", formData.observacoes || "");

      // Transformando a array de participantes em String JSON para o banco
      form.append(
        "participantes_externos",
        JSON.stringify(formData.participantes || []),
      );

      const url = formData.id
        ? "https://sothink.com.br/app/api/editar"
        : "https://sothink.com.br/app/api/inserir";

      const res = await fetch(url, { method: "POST", body: form });
      const data = await res.json();

      if (data.sucesso) {
        showToast(
          "success",
          formData.id ? "Ata Atualizada!" : "Ata Criada!",
          "Documento salvo com sucesso.",
        );
        setModalOpen(false);
        fetchData();
      } else {
        throw new Error(data.erro || "Falha na comunicação com o banco.");
      }
    } catch (err: any) {
      showToast("error", "Erro ao salvar ata", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAta = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta Ata de Reunião?")) {
      try {
        const res = await fetch(
          `https://sothink.com.br/app/api/deletar?id=${id}&tabela=atas_reuniao`,
        );
        const data = await res.json();

        if (data.sucesso) {
          showToast("info", "Ata Removida com sucesso.");
          fetchData();
        } else {
          throw new Error(data.erro);
        }
      } catch (err: any) {
        showToast("error", "Erro ao excluir ata", err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === "cards"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Cards
          </button>

          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === "calendar"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendário
          </button>
        </div>

        <button
          onClick={() => openNewAtaModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Ata de Reunião
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por objetivo, cliente ou responsável..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all"
          />
        </div>

        <select
          value={filterClientId}
          onChange={(e) => setFilterClientId(e.target.value)}
          className="px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/40 shadow-sm"
        >
          <option value="all">Todos os Clientes ({clientes.length})</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome_fantasia || c.razao_social}
            </option>
          ))}
        </select>
      </div>

      {/* Atas Cards List */}
      {/* Atas Cards / Calendar View */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : viewMode === "calendar" ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Calendário de Atas
              </h3>

              <span className="text-xs text-slate-400">
                Clique em um dia para criar uma nova ata de reunião nesta data.
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-sm min-w-[140px] text-center text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                {monthNames[currentMonth]} {currentYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold text-slate-500 uppercase"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="bg-white dark:bg-slate-900 min-h-[130px]"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const today = new Date();

              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

              const atasForDay = getAtasForDay(day);
              const selectedDate = formatCalendarDate(
                currentYear,
                currentMonth,
                day,
              );

              return (
                <div
                  key={day}
                  onClick={() => openNewAtaModal(selectedDate)}
                  className={`bg-white dark:bg-slate-900 p-1.5 min-h-[130px] transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col cursor-pointer group ${
                    isToday ? "ring-2 ring-inset ring-indigo-500" : ""
                  }`}
                  title="Clique para criar uma ata nesta data"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-block text-xs font-bold w-6 h-6 text-center leading-6 rounded-full ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      }`}
                    >
                      {day}
                    </span>

                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      + Ata
                    </span>
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[105px] pr-1">
                    {atasForDay.map((ata) => (
                      <div
                        key={ata.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewAtaModal(ata);
                        }}
                        className="text-[10px] p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 cursor-pointer hover:border-indigo-300 overflow-hidden shadow-sm transition-colors flex justify-between items-start gap-1"
                        title={`${ata.cliente_nome} - ${ata.objetivo}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold truncate">
                            {ata.cliente_nome}
                          </div>

                          <div className="truncate opacity-80">
                            {ata.objetivo}
                          </div>

                          {ata.hora_reuniao && (
                            <div className="mt-0.5 flex items-center gap-1 opacity-70">
                              <Clock className="w-3 h-3" />
                              {ata.hora_reuniao.substring(0, 5)}
                            </div>
                          )}
                        </div>

                        {ata.responsavel && (
                          <div
                            className="w-5 h-5 shrink-0 rounded-full bg-indigo-200 dark:bg-indigo-800/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-[9px] font-extrabold shadow-sm"
                            title={`Responsável: ${ata.responsavel}`}
                          >
                            {getInitials(ata.responsavel)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAtas.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Nenhuma ata encontrada.
              </p>
            </div>
          ) : (
            filteredAtas.map((ata) => (
              <div
                key={ata.id}
                onClick={() => setViewAtaModal(ata)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200/50">
                      {ata.cliente_nome}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {formatarData(ata.data_reuniao)} •{" "}
                      {ata.hora_reuniao.substring(0, 5)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {ata.objetivo}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {ata.decisoes || ata.assuntos_discutidos}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      📍 {ata.tipo_reuniao}
                    </span>

                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      👥 {ata.participantes?.length || 0} Participantes
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Visualizar <ChevronRight className="w-4 h-4" />
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(ata);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteAta(ata.id!, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Nova/Editar Ata */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 py-20 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {formData.id ? "Editar Ata de Reunião" : "Nova Ata de Reunião"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa Cliente *
                  </label>
                  <select
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={(e) => {
                      const comp = clientes.find(
                        (c) => c.id === e.target.value,
                      );
                      setFormData({
                        ...formData,
                        cliente_id: e.target.value,
                        cliente_nome:
                          comp?.nome_fantasia || comp?.razao_social || "",
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome_fantasia || c.razao_social}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Reunião
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.data_reuniao}
                    onChange={(e) =>
                      setFormData({ ...formData, data_reuniao: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.hora_reuniao}
                    onChange={(e) =>
                      setFormData({ ...formData, hora_reuniao: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Reunião
                  </label>
                  <select
                    value={formData.tipo_reuniao}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_reuniao: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="Online">Online (Meet/Teams)</option>
                    <option value="Presencial">
                      Presencial (Sede/Cliente)
                    </option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Local / Link
                  </label>
                  <input
                    type="text"
                    value={formData.local_reuniao}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        local_reuniao: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                {/* SELECT DE USUÁRIOS SOTHINK */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável Sothink
                  </label>
                  <select
                    value={formData.responsavel}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavel: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="">Selecione...</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.nome}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PARTICIPANTES - BUGS RESOLVIDOS */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Participantes Selecionados
                </label>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Participantes da Empresa Selecionada */}
                  {selectedCompany?.responsaveis?.map((resp) => {
                    const tag = `${resp.nome} (${selectedCompany.nome_fantasia})`;
                    const selected = (formData.participantes || []).includes(
                      tag,
                    );

                    return (
                      <button
                        key={resp.id}
                        type="button"
                        onClick={() => handleToggleParticipant(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          selected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {selected ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        {resp.nome} ({resp.cargo})
                      </button>
                    );
                  })}

                  {/* Exibir participantes extras digitados na tela */}
                  {(formData.participantes || [])
                    .filter(
                      (p) =>
                        !selectedCompany?.responsaveis?.some(
                          (r) =>
                            `${r.nome} (${selectedCompany.nome_fantasia})` ===
                            p,
                        ),
                    )
                    .map((p, idx) => (
                      <button
                        key={`ext-${idx}`}
                        type="button"
                        onClick={() => handleToggleParticipant(p)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        title="Clique para remover"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {p}
                      </button>
                    ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={externalParticipantInput}
                    onChange={(e) =>
                      setExternalParticipantInput(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddExternalParticipant();
                      }
                    }}
                    placeholder="Adicionar participante externo (Escreva e aperte Enter)"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalParticipant}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Objetivo Principal da Reunião *
                  </label>
                  <input
                    type="text"
                    name="objetivo"
                    required
                    value={formData.objetivo}
                    onChange={(e) =>
                      setFormData({ ...formData, objetivo: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assuntos Discutidos
                  </label>
                  <textarea
                    rows={3}
                    value={formData.assuntos_discutidos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assuntos_discutidos: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Decisões Tomadas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.decisoes}
                    onChange={(e) =>
                      setFormData({ ...formData, decisoes: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pendências
                  </label>
                  <textarea
                    rows={2}
                    value={formData.pendencias}
                    onChange={(e) =>
                      setFormData({ ...formData, pendencias: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Próximos Passos
                  </label>
                  <textarea
                    rows={2}
                    value={formData.proximos_passos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proximos_passos: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Printable Ata Modal (Com todos os campos aparecendo) */}
      {viewAtaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 py-20 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 print:p-0 print:border-none">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Ata de Reunião Oficial
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setViewAtaModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 text-slate-800 dark:text-slate-200 text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white">
                    ATA DE REUNIÃO DE ALINHAMENTO
                  </h1>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {viewAtaModal.cliente_nome}
                  </div>
                  <div className="text-slate-500">
                    {formatarData(viewAtaModal.data_reuniao)} às{" "}
                    {viewAtaModal.hora_reuniao.substring(0, 5)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold block text-slate-500">
                    Local / Canal:
                  </span>
                  <span>
                    {viewAtaModal.local_reuniao} ({viewAtaModal.tipo_reuniao})
                  </span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">
                    Responsável:
                  </span>
                  <span>{viewAtaModal.responsavel}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold block text-slate-500">
                    Participantes:
                  </span>
                  <span>
                    {viewAtaModal.participantes?.join(", ") || "Equipe"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  1. Objetivo da Reunião
                </h4>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl leading-relaxed">
                  {viewAtaModal.objetivo}
                </p>
              </div>

              {viewAtaModal.assuntos_discutidos && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    2. Assuntos Discutidos
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl whitespace-pre-line leading-relaxed">
                    {viewAtaModal.assuntos_discutidos}
                  </p>
                </div>
              )}

              {viewAtaModal.decisoes && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    3. Decisões Tomadas
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl whitespace-pre-line leading-relaxed">
                    {viewAtaModal.decisoes}
                  </p>
                </div>
              )}

              {/* Pendências Adicionadas */}
              {viewAtaModal.pendencias && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    4. Pendências
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl whitespace-pre-line leading-relaxed">
                    {viewAtaModal.pendencias}
                  </p>
                </div>
              )}

              {/* Próximos Passos Adicionados */}
              {viewAtaModal.proximos_passos && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    5. Próximos Passos
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl whitespace-pre-line leading-relaxed">
                    {viewAtaModal.proximos_passos}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
