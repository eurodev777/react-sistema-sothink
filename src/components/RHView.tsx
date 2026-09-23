import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  UserRound,
  Phone,
  MapPin,
  BriefcaseBusiness,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Loader2,
  Check,
  ChevronRight,
  UsersRound,
  LayoutDashboard,
  Kanban,
  FileText,
  Folder,
  DollarSign,
  Settings,
  Eye,
  Power,
} from "lucide-react";

interface RHViewProps {
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    desc?: string,
  ) => void;
}

interface Emergencia {
  nome: string;
  whatsapp: string;
}

interface Colaborador {
  id?: string | number;
  cliente_id?: string | number;

  nome: string;
  cpf_cnpj: string;
  cargo: string;
  whatsapp: string;
  endereco: string;

  emergencia_1_nome: string;
  emergencia_1_whatsapp: string;

  emergencia_2_nome: string;
  emergencia_2_whatsapp: string;

  ativo?: boolean | number | string;

  permissoes?: string[];
}

type AbaRH = "colaboradores" | "squads";

const API = "https://sothink.com.br/app/api";

const PERMISSOES = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: Kanban,
  },
  {
    id: "atas",
    label: "Atas",
    icon: FileText,
  },
  {
    id: "arquivos",
    label: "Arquivos",
    icon: Folder,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
  },
  {
    id: "rh",
    label: "RH",
    icon: UsersRound,
  },
  {
    id: "config",
    label: "Configurações",
    icon: Settings,
  },
];

const isEnabled = (value: any) =>
  value === true || value === 1 || value === "1" || value === "true";

const safe = (value: any) => {
  if (value === null || value === undefined || value === "null") {
    return "";
  }

  return String(value);
};

const emptyColaborador = (): Colaborador => ({
  nome: "",
  cpf_cnpj: "",
  cargo: "",
  whatsapp: "",
  endereco: "",

  emergencia_1_nome: "",
  emergencia_1_whatsapp: "",

  emergencia_2_nome: "",
  emergencia_2_whatsapp: "",

  ativo: true,
  permissoes: [],
});

export const RHView: React.FC<RHViewProps> = ({ showToast }) => {
  const [aba, setAba] = useState<AbaRH>("colaboradores");

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [visualizando, setVisualizando] = useState<Colaborador | null>(null);

  const [editando, setEditando] = useState<Colaborador | null>(null);

  const [formData, setFormData] = useState<Colaborador>(emptyColaborador());

  const [salvando, setSalvando] = useState(false);

  const [permissoes, setPermissoes] = useState<string[]>([]);

  /*
   * ==========================================================
   * CARREGAR COLABORADORES
   * ==========================================================
   */

  const carregarColaboradores = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/listar?tabela=colaboradores`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar os colaboradores.");
      }

      const data = await response.json();

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      /*
       * Busca permissões separadamente.
       * Mantém o mesmo padrão usado no CRM atual,
       * onde dados relacionados são carregados pela API.
       */

      let permissoesRaw: any[] = [];

      try {
        const permissoesResponse = await fetch(
          `${API}/listar?tabela=colaboradores_permissoes`,
          {
            cache: "no-store",
          },
        );

        if (permissoesResponse.ok) {
          const permissoesData = await permissoesResponse.json();

          permissoesRaw = Array.isArray(permissoesData)
            ? permissoesData
            : Array.isArray(permissoesData?.data)
              ? permissoesData.data
              : [];
        }
      } catch {
        // Permissões podem ainda não existir no banco.
      }

      const normalizados: Colaborador[] = lista.map((item: any) => {
        const permissoesDoColaborador = permissoesRaw
          .filter((p: any) => String(p.colaborador_id) === String(item.id))
          .map((p: any) => safe(p.quadro || p.permissao))
          .filter(Boolean);

        return {
          id: item.id,
          cliente_id: item.cliente_id,

          nome: safe(item.nome),
          cpf_cnpj: safe(item.cpf_cnpj ?? item.cpf ?? item.cnpj),
          cargo: safe(item.cargo),
          whatsapp: safe(item.whatsapp),
          endereco: safe(item.endereco),

          emergencia_1_nome: safe(item.emergencia_1_nome),
          emergencia_1_whatsapp: safe(item.emergencia_1_whatsapp),

          emergencia_2_nome: safe(item.emergencia_2_nome),
          emergencia_2_whatsapp: safe(item.emergencia_2_whatsapp),

          ativo: item.ativo === undefined ? true : isEnabled(item.ativo),

          permissoes: permissoesDoColaborador,
        };
      });

      setColaboradores(normalizados);
    } catch (error: any) {
      console.error("Erro ao carregar colaboradores:", error);

      showToast(
        "error",
        "Erro ao carregar RH",
        error?.message || "Não foi possível carregar os colaboradores.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarColaboradores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ==========================================================
   * BUSCA
   * ==========================================================
   */

  const colaboradoresFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();

    if (!termo) {
      return colaboradores;
    }

    return colaboradores.filter((colaborador) =>
      [
        colaborador.nome,
        colaborador.cpf_cnpj,
        colaborador.cargo,
        colaborador.whatsapp,
        colaborador.endereco,
      ].some((value) => safe(value).toLowerCase().includes(termo)),
    );
  }, [colaboradores, searchTerm]);

  /*
   * ==========================================================
   * NOVO COLABORADOR
   * ==========================================================
   */

  const abrirNovo = () => {
    setEditando(null);
    setVisualizando(null);

    setFormData(emptyColaborador());
    setPermissoes([]);

    setModalOpen(true);
  };

  /*
   * ==========================================================
   * EDITAR
   * ==========================================================
   */

  const abrirEdicao = (colaborador: Colaborador) => {
    setEditando(colaborador);
    setVisualizando(null);

    setFormData({
      ...emptyColaborador(),
      ...colaborador,
    });

    setPermissoes(colaborador.permissoes || []);

    setModalOpen(true);
  };

  /*
   * ==========================================================
   * VISUALIZAR
   * ==========================================================
   */

  const abrirVisualizacao = (colaborador: Colaborador) => {
    setVisualizando(colaborador);
  };

  /*
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const updateField = (field: keyof Colaborador, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /*
   * ==========================================================
   * PERMISSÕES
   * ==========================================================
   */

  const togglePermissao = (id: string) => {
    setPermissoes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  /*
   * ==========================================================
   * SALVAR
   * ==========================================================
   */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      showToast("error", "Nome obrigatório", "Informe o nome do colaborador.");
      return;
    }

    if (!formData.cpf_cnpj.trim()) {
      showToast("error", "CPF/CNPJ obrigatório", "Informe o CPF ou CNPJ.");
      return;
    }

    if (!formData.cargo.trim()) {
      showToast(
        "error",
        "Cargo obrigatório",
        "Informe o cargo do colaborador.",
      );
      return;
    }

    if (!formData.whatsapp.trim()) {
      showToast(
        "error",
        "WhatsApp obrigatório",
        "Informe o WhatsApp do colaborador.",
      );
      return;
    }

    try {
      setSalvando(true);

      const form = new FormData();

      form.append("tabela", "colaboradores");

      form.append("nome", formData.nome.trim());

      form.append("cpf_cnpj", formData.cpf_cnpj.trim());

      form.append("cargo", formData.cargo.trim());

      form.append("whatsapp", formData.whatsapp.trim());

      form.append("endereco", formData.endereco.trim());

      form.append("emergencia_1_nome", formData.emergencia_1_nome.trim());

      form.append(
        "emergencia_1_whatsapp",
        formData.emergencia_1_whatsapp.trim(),
      );

      form.append("emergencia_2_nome", formData.emergencia_2_nome.trim());

      form.append(
        "emergencia_2_whatsapp",
        formData.emergencia_2_whatsapp.trim(),
      );

      form.append("ativo", formData.ativo ? "1" : "0");

      if (formData.cliente_id) {
        form.append("cliente_id", String(formData.cliente_id));
      }

      const editandoRegistro = Boolean(editando?.id);

      if (editandoRegistro) {
        form.append("id", String(editando!.id));
      }

      const url = editandoRegistro ? `${API}/editar` : `${API}/inserir`;

      const response = await fetch(url, {
        method: "POST",
        body: form,
      });

      const texto = await response.text();

      let result: any = {};

      try {
        result = texto ? JSON.parse(texto) : {};
      } catch {
        throw new Error("Resposta inválida da API:\n" + texto);
      }

      if (!response.ok || result?.erro || result?.sucesso === false) {
        throw new Error(result?.erro || `Erro HTTP ${response.status}`);
      }

      const colaboradorId = editando?.id || result?.id || result?.data?.id;

      /*
       * ======================================================
       * SALVAR PERMISSÕES
       * ======================================================
       */

      if (colaboradorId) {
        /*
         * Remove permissões antigas.
         *
         * Se sua API ainda não possuir esse recurso,
         * essa parte pode ser retirada até criarmos o
         * endpoint específico.
         */

        try {
          const antigasResponse = await fetch(
            `${API}/listar?tabela=colaboradores_permissoes`,
            {
              cache: "no-store",
            },
          );

          if (antigasResponse.ok) {
            const antigasData = await antigasResponse.json();

            const antigas = Array.isArray(antigasData)
              ? antigasData
              : Array.isArray(antigasData?.data)
                ? antigasData.data
                : [];

            const antigasDoColaborador = antigas.filter(
              (item: any) =>
                String(item.colaborador_id) === String(colaboradorId),
            );

            await Promise.all(
              antigasDoColaborador.map(async (item: any) => {
                if (!item.id) return;

                await fetch(
                  `${API}/deletar?id=${item.id}&tabela=colaboradores_permissoes`,
                );
              }),
            );
          }
        } catch (error) {
          console.warn("Não foi possível limpar permissões antigas:", error);
        }

        /*
         * Insere as novas permissões.
         */

        await Promise.all(
          permissoes.map(async (permissao) => {
            const permissaoForm = new FormData();

            permissaoForm.append("tabela", "colaboradores_permissoes");

            permissaoForm.append("colaborador_id", String(colaboradorId));

            permissaoForm.append("quadro", permissao);

            await fetch(`${API}/inserir`, {
              method: "POST",
              body: permissaoForm,
            });
          }),
        );
      }

      setModalOpen(false);
      setEditando(null);

      await carregarColaboradores();

      showToast(
        "success",
        editandoRegistro
          ? "Colaborador atualizado!"
          : "Colaborador cadastrado!",
        "Os dados e permissões foram salvos.",
      );
    } catch (error: any) {
      console.error("Erro ao salvar colaborador:", error);

      showToast(
        "error",
        "Erro ao salvar colaborador",
        error?.message || "Não foi possível salvar os dados.",
      );
    } finally {
      setSalvando(false);
    }
  };

  /*
   * ==========================================================
   * EXCLUIR
   * ==========================================================
   */

  const excluirColaborador = async (colaborador: Colaborador) => {
    if (!colaborador.id) return;

    const confirmou = window.confirm(
      `Excluir o colaborador "${colaborador.nome}"?`,
    );

    if (!confirmou) return;

    try {
      const response = await fetch(
        `${API}/deletar?id=${colaborador.id}&tabela=colaboradores`,
      );

      const data = await response.json();

      if (!data?.sucesso) {
        throw new Error(data?.erro || "Não foi possível excluir.");
      }

      await carregarColaboradores();

      if (visualizando?.id === colaborador.id) {
        setVisualizando(null);
      }

      showToast("success", "Colaborador excluído");
    } catch (error: any) {
      showToast("error", "Erro ao excluir", error?.message);
    }
  };

  /*
   * ==========================================================
   * ATIVAR / DESATIVAR
   * ==========================================================
   */

  const alternarStatus = async (colaborador: Colaborador) => {
    if (!colaborador.id) return;

    try {
      const form = new FormData();

      form.append("tabela", "colaboradores");

      form.append("id", String(colaborador.id));

      form.append("ativo", isEnabled(colaborador.ativo) ? "0" : "1");

      const response = await fetch(`${API}/editar`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível alterar o status.");
      }

      await carregarColaboradores();

      showToast(
        "success",
        isEnabled(colaborador.ativo)
          ? "Colaborador desativado"
          : "Colaborador ativado",
      );
    } catch (error: any) {
      showToast("error", "Erro ao alterar status", error?.message);
    }
  };

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UsersRound className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Recursos Humanos
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Colaboradores, permissões e organização das equipes.
              </p>
            </div>
          </div>
        </div>

        {aba === "colaboradores" && (
          <button
            onClick={abrirNovo}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Colaborador
          </button>
        )}
      </div>

      {/* ABAS */}

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setAba("colaboradores")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            aba === "colaboradores"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Colaboradores
        </button>

        <button
          onClick={() => setAba("squads")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            aba === "squads"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <UsersRound className="w-4 h-4" />
          Squads
        </button>
      </div>

      {/* =====================================================
          COLABORADORES
          ===================================================== */}

      {aba === "colaboradores" && (
        <>
          {/* BUSCA */}

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative max-w-xl w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar colaborador, CPF/CNPJ, cargo ou WhatsApp..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <span className="text-[11px] font-bold text-slate-400">
              {colaboradores.length} colaborador
              {colaboradores.length === 1 ? "" : "es"}
            </span>
          </div>

          {/* LOADING */}

          {loading && colaboradores.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />

              <span className="text-xs font-bold">
                Carregando colaboradores...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {colaboradoresFiltrados.map((colaborador) => {
                const ativo = isEnabled(colaborador.ativo);

                return (
                  <div
                    key={colaborador.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                  >
                    {/* TOP */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg shrink-0">
                          {colaborador.nome?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {colaborador.nome}
                          </h3>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {colaborador.cargo || "Sem cargo"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-full text-[9px] font-black shrink-0 ${
                          ativo
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {ativo ? "ATIVO" : "INATIVO"}
                      </span>
                    </div>

                    {/* INFO */}

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <BriefcaseBusiness className="w-3.5 h-3.5 text-indigo-500" />

                        <span>
                          {colaborador.cargo || "Cargo não informado"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />

                        <span>
                          {colaborador.whatsapp || "WhatsApp não informado"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />

                        <span>
                          {colaborador.permissoes?.length || 0} permissões
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => abrirVisualizacao(colaborador)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center gap-1 hover:translate-x-0.5 transition-transform"
                      >
                        Ver detalhes
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => alternarStatus(colaborador)}
                          title={ativo ? "Desativar" : "Ativar"}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => abrirEdicao(colaborador)}
                          title="Editar"
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => excluirColaborador(colaborador)}
                          title="Excluir"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {colaboradoresFiltrados.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs">
                  <UsersRound className="w-8 h-8 mx-auto mb-3 text-slate-300" />

                  <p className="font-semibold">
                    Nenhum colaborador encontrado.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =====================================================
          SQUADS
          ===================================================== */}

      {aba === "squads" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <UsersRound className="w-7 h-7" />
          </div>

          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Squads
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
            A estrutura de squads ficará nesta área. Será possível criar
            equipes, adicionar colaboradores e definir os clientes e jobs
            vinculados a cada squad.
          </p>
        </div>
      )}

      {/* =====================================================
          MODAL CADASTRO / EDIÇÃO
          ===================================================== */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => !salvando && setModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editando ? "Editar Colaborador" : "Novo Colaborador"}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Cadastre os dados e defina os quadros que poderão ser
                  acessados.
                </p>
              </div>

              <button
                type="button"
                disabled={salvando}
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-7">
              {/* DADOS */}

              <div className="space-y-4">
                <SectionTitle
                  icon={<UserRound className="w-4 h-4" />}
                  title="Dados do colaborador"
                  description="Informações principais do cadastro."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nome completo"
                    required
                    value={formData.nome}
                    onChange={(value) => updateField("nome", value)}
                    placeholder="Nome do colaborador"
                  />

                  <Field
                    label="CPF/CNPJ"
                    required
                    value={formData.cpf_cnpj}
                    onChange={(value) => updateField("cpf_cnpj", value)}
                    placeholder="CPF ou CNPJ"
                  />

                  <Field
                    label="Cargo"
                    required
                    value={formData.cargo}
                    onChange={(value) => updateField("cargo", value)}
                    placeholder="Ex.: Designer, Atendimento..."
                  />

                  <Field
                    label="WhatsApp"
                    required
                    value={formData.whatsapp}
                    onChange={(value) => updateField("whatsapp", value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Field
                  label="Endereço"
                  value={formData.endereco}
                  onChange={(value) => updateField("endereco", value)}
                  placeholder="Rua, número, bairro, cidade..."
                />
              </div>

              {/* EMERGÊNCIA */}

              <div className="space-y-4">
                <SectionTitle
                  icon={<Phone className="w-4 h-4" />}
                  title="Contatos de emergência"
                  description="Cadastre até dois contatos para situações de emergência."
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <EmergencyCard
                    number="01"
                    name={formData.emergencia_1_nome}
                    whatsapp={formData.emergencia_1_whatsapp}
                    onNameChange={(value) =>
                      updateField("emergencia_1_nome", value)
                    }
                    onWhatsappChange={(value) =>
                      updateField("emergencia_1_whatsapp", value)
                    }
                  />

                  <EmergencyCard
                    number="02"
                    name={formData.emergencia_2_nome}
                    whatsapp={formData.emergencia_2_whatsapp}
                    onNameChange={(value) =>
                      updateField("emergencia_2_nome", value)
                    }
                    onWhatsappChange={(value) =>
                      updateField("emergencia_2_whatsapp", value)
                    }
                  />
                </div>
              </div>

              {/* PERMISSÕES */}

              <div className="space-y-4">
                <SectionTitle
                  icon={<ShieldCheck className="w-4 h-4" />}
                  title="Permissões de acesso"
                  description="Defina quais quadros este colaborador poderá acessar."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PERMISSOES.map((permissao) => {
                    const Icon = permissao.icon;

                    const selecionada = permissoes.includes(permissao.id);

                    return (
                      <button
                        key={permissao.id}
                        type="button"
                        onClick={() => togglePermissao(permissao.id)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          selecionada
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              selecionada
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {selecionada && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        <p className="mt-3 text-xs font-extrabold text-slate-900 dark:text-white">
                          {permissao.label}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {selecionada ? "Acesso liberado" : "Sem acesso"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STATUS */}

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Colaborador ativo
                  </p>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Colaboradores inativos não deverão ter acesso ao sistema.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateField("ativo", !isEnabled(formData.ativo))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isEnabled(formData.ativo)
                      ? "bg-indigo-600"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isEnabled(formData.ativo)
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* FOOTER */}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />}

                  {salvando
                    ? "Salvando..."
                    : editando
                      ? "Salvar alterações"
                      : "Cadastrar colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL DETALHES
          ===================================================== */}

      {visualizando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setVisualizando(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl">
                  {visualizando.nome?.charAt(0)?.toUpperCase()}
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {visualizando.nome}
                  </h3>

                  <p className="text-xs text-indigo-500 font-bold mt-1">
                    {visualizando.cargo || "Cargo não informado"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setVisualizando(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
              <InfoBox
                title="Dados pessoais"
                icon={<UserRound className="w-4 h-4" />}
              >
                <InfoRow label="Nome" value={visualizando.nome} />

                <InfoRow label="CPF/CNPJ" value={visualizando.cpf_cnpj} />

                <InfoRow label="Cargo" value={visualizando.cargo} />
              </InfoBox>

              <InfoBox title="Contato" icon={<Phone className="w-4 h-4" />}>
                <InfoRow label="WhatsApp" value={visualizando.whatsapp} />

                <InfoRow label="Endereço" value={visualizando.endereco} />
              </InfoBox>

              <InfoBox title="Emergência" icon={<Phone className="w-4 h-4" />}>
                <InfoRow
                  label="Contato 01"
                  value={visualizando.emergencia_1_nome}
                />

                <InfoRow
                  label="WhatsApp 01"
                  value={visualizando.emergencia_1_whatsapp}
                />

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                <InfoRow
                  label="Contato 02"
                  value={visualizando.emergencia_2_nome}
                />

                <InfoRow
                  label="WhatsApp 02"
                  value={visualizando.emergencia_2_whatsapp}
                />
              </InfoBox>

              <InfoBox
                title="Permissões"
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                <div className="flex flex-wrap gap-2">
                  {(visualizando.permissoes || []).map((permissao) => {
                    const item = PERMISSOES.find((p) => p.id === permissao);

                    return (
                      <span
                        key={permissao}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold"
                      >
                        {item?.label || permissao}
                      </span>
                    );
                  })}

                  {!visualizando.permissoes?.length && (
                    <span className="text-xs text-slate-400">
                      Nenhuma permissão cadastrada.
                    </span>
                  )}
                </div>
              </InfoBox>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  const colaborador = visualizando;

                  setVisualizando(null);

                  abrirEdicao(colaborador);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar colaborador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/*
 * ============================================================
 * COMPONENTES AUXILIARES
 * ============================================================
 */

const SectionTitle = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0">
      {icon}
    </div>

    <div>
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
        {title}
      </h4>

      {description && (
        <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) => (
  <label className="block">
    <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </span>

    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
    />
  </label>
);

const EmergencyCard = ({
  number,
  name,
  whatsapp,
  onNameChange,
  onWhatsappChange,
}: {
  number: string;
  name: string;
  whatsapp: string;
  onNameChange: (value: string) => void;
  onWhatsappChange: (value: string) => void;
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4 space-y-4">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center text-[10px] font-black">
        {number}
      </div>

      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
        Contato de emergência
      </span>
    </div>

    <Field
      label="Nome"
      value={name}
      onChange={onNameChange}
      placeholder="Nome do contato"
    />

    <Field
      label="WhatsApp"
      value={whatsapp}
      onChange={onWhatsappChange}
      placeholder="(00) 00000-0000"
    />
  </div>
);

const InfoBox = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-5">
    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
      <span className="text-indigo-500">{icon}</span>
      {title}
    </h4>

    <div className="space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
      {label}
    </span>

    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 break-words">
      {value || "-"}
    </span>
  </div>
);
