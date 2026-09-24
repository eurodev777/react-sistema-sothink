import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  X,
  Save,
  Loader2,
  Trash2,
  Pencil,
  ShieldCheck,
  UserCheck,
  UserX,
  BriefcaseBusiness,
  UsersRound,
  Phone,
  MapPin,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

const API_BASE = "https://sothink.com.br/app/api";

type AbaRH = "colaboradores" | "squads";

interface Usuario {
  id: string;
  nome?: string;
  cpf_cnpj?: string;
  cargo?: string;
  whatsapp?: string;

  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;

  emergencia_1_nome?: string;
  emergencia_1_whatsapp?: string;
  emergencia_2_nome?: string;
  emergencia_2_whatsapp?: string;

  usuario?: string;
  email?: string;

  // Algumas bases podem usar senha e outras password.
  senha?: string;

  tipo?: string;
  perfil?: string;
  ativo?: string | number | boolean;
}

interface Permissao {
  id?: string;
  usuario_id: string;
  quadro: string;
  permitido?: string | number | boolean;
}

interface FormUsuario {
  nome: string;
  cpf_cnpj: string;
  cargo: string;
  whatsapp: string;

  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;

  emergencia_1_nome: string;
  emergencia_1_whatsapp: string;

  emergencia_2_nome: string;
  emergencia_2_whatsapp: string;

  usuario: string;
  email: string;
  senha: string;

  tipo: string;
  perfil: string;
  ativo: boolean;
}

const QUADROS = [
  {
    id: "jobs",
    nome: "Jobs",
    descricao: "Acesso ao quadro principal de jobs",
  },
  {
    id: "clientes",
    nome: "Clientes",
    descricao: "Cadastro e gestão de clientes",
  },
  {
    id: "atas_reuniao",
    nome: "Atas de Reunião",
    descricao: "Reuniões, decisões e pendências",
  },
  {
    id: "relatorios_performance",
    nome: "Relatórios",
    descricao: "Relatórios de performance",
  },
  {
    id: "usuarios",
    nome: "RH / Colaboradores",
    descricao: "Gestão dos colaboradores",
  },
];

const EMPTY_FORM: FormUsuario = {
  nome: "",
  cpf_cnpj: "",
  cargo: "",
  whatsapp: "",

  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",

  emergencia_1_nome: "",
  emergencia_1_whatsapp: "",

  emergencia_2_nome: "",
  emergencia_2_whatsapp: "",

  usuario: "",
  email: "",
  senha: "",

  tipo: "colaborador",
  perfil: "colaborador",
  ativo: true,
};

const isTrue = (value: any) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true";

const getInitials = (name?: string) => {
  if (!name) return "??";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
};

const formatWhatsapp = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 11) {
    return numbers;
  }

  return numbers.substring(0, 11);
};

const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, "").substring(0, 8);

  if (numbers.length <= 5) return numbers;

  return `${numbers.substring(0, 5)}-${numbers.substring(5)}`;
};

const formatCpfCnpj = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 11) {
    return numbers.substring(0, 11);
  }

  return numbers.substring(0, 14);
};

export const RHView: React.FC = () => {
  const [aba, setAba] = useState<AbaRH>("colaboradores");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  const [form, setForm] = useState<FormUsuario>(EMPTY_FORM);

  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, boolean>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    setError("");

    try {
      const [usuariosResponse, permissoesResponse] = await Promise.all([
        fetch(`${API_BASE}/listar?tabela=usuarios`),
        fetch(`${API_BASE}/listar?tabela=usuarios_permissoes`),
      ]);

      const usuariosData = await usuariosResponse.json();
      const permissoesData = await permissoesResponse.json();

      setUsuarios(
        Array.isArray(usuariosData)
          ? usuariosData
          : usuariosData?.dados || []
      );

      setPermissoes(
        Array.isArray(permissoesData)
          ? permissoesData
          : permissoesData?.dados || []
      );
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados do RH.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = search.trim().toLowerCase();

    if (!termo) return usuarios;

    return usuarios.filter((usuario) => {
      return (
        usuario.nome?.toLowerCase().includes(termo) ||
        usuario.cargo?.toLowerCase().includes(termo) ||
        usuario.email?.toLowerCase().includes(termo) ||
        usuario.usuario?.toLowerCase().includes(termo) ||
        usuario.cpf_cnpj?.toLowerCase().includes(termo)
      );
    });
  }, [usuarios, search]);

  const abrirNovo = () => {
    setEditingUsuario(null);
    setForm(EMPTY_FORM);

    const permissoesIniciais: Record<string, boolean> = {};

    QUADROS.forEach((quadro) => {
      permissoesIniciais[quadro.id] = false;
    });

    setSelectedPermissions(permissoesIniciais);

    setShowModal(true);
  };

  const abrirEdicao = (usuario: Usuario) => {
    setEditingUsuario(usuario);

    setForm({
      nome: usuario.nome || "",
      cpf_cnpj: usuario.cpf_cnpj || "",
      cargo: usuario.cargo || "",
      whatsapp: usuario.whatsapp || "",

      endereco: usuario.endereco || "",
      numero: usuario.numero || "",
      bairro: usuario.bairro || "",
      cidade: usuario.cidade || "",
      estado: usuario.estado || "",
      cep: usuario.cep || "",

      emergencia_1_nome: usuario.emergencia_1_nome || "",
      emergencia_1_whatsapp: usuario.emergencia_1_whatsapp || "",

      emergencia_2_nome: usuario.emergencia_2_nome || "",
      emergencia_2_whatsapp: usuario.emergencia_2_whatsapp || "",

      usuario: usuario.usuario || "",
      email: usuario.email || "",

      // Não exibimos senha existente.
      senha: "",

      tipo: usuario.tipo || "colaborador",
      perfil: usuario.perfil || "colaborador",
      ativo: isTrue(usuario.ativo),
    });

    const permissoesDoUsuario: Record<string, boolean> = {};

    QUADROS.forEach((quadro) => {
      const permissao = permissoes.find(
        (item) =>
          String(item.usuario_id) === String(usuario.id) &&
          item.quadro === quadro.id
      );

      permissoesDoUsuario[quadro.id] = permissao
        ? isTrue(permissao.permitido)
        : false;
    });

    setSelectedPermissions(permissoesDoUsuario);
    setShowModal(true);
  };

  const fecharModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUsuario(null);
    setForm(EMPTY_FORM);
    setSelectedPermissions({});
  };

  const updateForm = (field: keyof FormUsuario, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePermission = (quadro: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [quadro]: !prev[quadro],
    }));
  };

  const salvarUsuario = async () => {
    if (!form.nome.trim()) {
      alert("Informe o nome do colaborador.");
      return;
    }

    if (!form.cargo.trim()) {
      alert("Informe o cargo do colaborador.");
      return;
    }

    if (!editingUsuario && !form.senha.trim()) {
      alert("Informe uma senha para o colaborador.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("tabela", "usuarios");

      if (editingUsuario?.id) {
        formData.append("id", String(editingUsuario.id));
      }

      formData.append("nome", form.nome.trim());
      formData.append("cpf_cnpj", form.cpf_cnpj.trim());
      formData.append("cargo", form.cargo.trim());
      formData.append("whatsapp", form.whatsapp.trim());

      formData.append("endereco", form.endereco.trim());
      formData.append("numero", form.numero.trim());
      formData.append("bairro", form.bairro.trim());
      formData.append("cidade", form.cidade.trim());
      formData.append("estado", form.estado.trim());
      formData.append("cep", form.cep.trim());

      formData.append(
        "emergencia_1_nome",
        form.emergencia_1_nome.trim()
      );
      formData.append(
        "emergencia_1_whatsapp",
        form.emergencia_1_whatsapp.trim()
      );

      formData.append(
        "emergencia_2_nome",
        form.emergencia_2_nome.trim()
      );
      formData.append(
        "emergencia_2_whatsapp",
        form.emergencia_2_whatsapp.trim()
      );

      formData.append("usuario", form.usuario.trim());
      formData.append("email", form.email.trim());

      if (form.senha.trim()) {
        formData.append("senha", form.senha.trim());
      }

      formData.append("tipo", form.tipo);
      formData.append("perfil", form.perfil);
      formData.append("ativo", form.ativo ? "1" : "0");

      const endpoint = editingUsuario
        ? `${API_BASE}/editar`
        : `${API_BASE}/inserir`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(
          data?.erro || "Não foi possível salvar o colaborador."
        );
      }

      const usuarioId = editingUsuario?.id || data.id;

      if (!usuarioId) {
        throw new Error(
          "O colaborador foi salvo, mas a API não retornou o ID."
        );
      }

      /*
       * Salva as permissões.
       *
       * A tabela usuarios_permissoes funciona como:
       * usuario_id | quadro | permitido
       */
      for (const quadro of QUADROS) {
        const permitido = selectedPermissions[quadro.id] ? "1" : "0";

        const permissaoExistente = permissoes.find(
          (item) =>
            String(item.usuario_id) === String(usuarioId) &&
            item.quadro === quadro.id
        );

        const permissaoForm = new FormData();

        if (permissaoExistente?.id) {
          permissaoForm.append("tabela", "usuarios_permissoes");
          permissaoForm.append("id", String(permissaoExistente.id));
          permissaoForm.append("usuario_id", String(usuarioId));
          permissaoForm.append("quadro", quadro.id);
          permissaoForm.append("permitido", permitido);

          await fetch(`${API_BASE}/editar`, {
            method: "POST",
            body: permissaoForm,
          });
        } else {
          permissaoForm.append("tabela", "usuarios_permissoes");
          permissaoForm.append("usuario_id", String(usuarioId));
          permissaoForm.append("quadro", quadro.id);
          permissaoForm.append("permitido", permitido);

          await fetch(`${API_BASE}/inserir`, {
            method: "POST",
            body: permissaoForm,
          });
        }
      }

      await carregarDados();

      fecharModal();

      alert(
        editingUsuario
          ? "Colaborador atualizado com sucesso."
          : "Colaborador cadastrado com sucesso."
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao salvar colaborador.");
    } finally {
      setSaving(false);
    }
  };

  const excluirUsuario = async (usuario: Usuario) => {
    if (!usuario.id) return;

    const confirmou = window.confirm(
      `Deseja realmente excluir o colaborador "${usuario.nome}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmou) return;

    try {
      const response = await fetch(
        `${API_BASE}/deletar?id=${encodeURIComponent(
          usuario.id
        )}&tabela=usuarios`
      );

      const data = await response.json();

      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Erro ao excluir colaborador.");
      }

      await carregarDados();

      alert("Colaborador excluído com sucesso.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao excluir colaborador.");
    }
  };

  const toggleAtivoRapido = async (usuario: Usuario) => {
    if (!usuario.id) return;

    try {
      const formData = new FormData();

      formData.append("tabela", "usuarios");
      formData.append("id", String(usuario.id));
      formData.append("ativo", isTrue(usuario.ativo) ? "0" : "1");

      const response = await fetch(`${API_BASE}/editar`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data?.erro || data?.sucesso === false) {
        throw new Error(data?.erro || "Erro ao alterar status.");
      }

      await carregarDados();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao alterar status.");
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UsersRound className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Recursos Humanos
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gerencie colaboradores, cargos, contatos e permissões.
              </p>
            </div>
          </div>
        </div>

        {aba === "colaboradores" && (
          <button
            type="button"
            onClick={abrirNovo}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Novo Colaborador
          </button>
        )}
      </div>

      {/* ABAS */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setAba("colaboradores")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
            aba === "colaboradores"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Colaboradores
        </button>

        <button
          type="button"
          onClick={() => setAba("squads")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
            aba === "squads"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <UsersRound className="w-4 h-4" />
          Squads
        </button>
      </div>

      {/* SQUADS - ESTRUTURA FUTURA */}
      {aba === "squads" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <UsersRound className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Squads
          </h2>

          <p className="max-w-lg mx-auto mt-2 text-sm text-slate-500 dark:text-slate-400">
            Área preparada para administrar squads separados, seus
            colaboradores e a organização das equipes.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
            Em desenvolvimento
          </div>
        </div>
      )}

      {/* COLABORADORES */}
      {aba === "colaboradores" && (
        <>
          {/* FILTRO */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                placeholder="Buscar por nome, cargo, CPF/CNPJ, usuário ou e-mail..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {/* RESUMO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Colaboradores
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {usuarios.length}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Ativos
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {
                      usuarios.filter((usuario) =>
                        isTrue(usuario.ativo)
                      ).length
                    }
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Inativos
                  </p>
                  <p className="text-2xl font-extrabold text-slate-500 mt-1">
                    {
                      usuarios.filter(
                        (usuario) => !isTrue(usuario.ativo)
                      ).length
                    }
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* TABELA */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-3" />
                <span className="text-xs font-semibold">
                  Carregando colaboradores...
                </span>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-rose-500 text-sm font-semibold">
                {error}
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />

                <h3 className="font-bold text-slate-700 dark:text-slate-300">
                  Nenhum colaborador encontrado
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Cadastre o primeiro colaborador para começar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                      <th className="px-5 py-4">Colaborador</th>
                      <th className="px-5 py-4">Cargo</th>
                      <th className="px-5 py-4">WhatsApp</th>
                      <th className="px-5 py-4">Usuário</th>
                      <th className="px-5 py-4">Permissões</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usuariosFiltrados.map((usuario) => {
                      const permissoesUsuario = permissoes.filter(
                        (item) =>
                          String(item.usuario_id) ===
                          String(usuario.id)
                      );

                      const quantidadePermissoes =
                        permissoesUsuario.filter((item) =>
                          isTrue(item.permitido)
                        ).length;

                      const ativo = isTrue(usuario.ativo);

                      return (
                        <tr
                          key={usuario.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-extrabold shrink-0">
                                {getInitials(usuario.nome)}
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                  {usuario.nome || "Sem nome"}
                                </div>

                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {usuario.email ||
                                    usuario.cpf_cnpj ||
                                    "Sem informação"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <BriefcaseBusiness className="w-3.5 h-3.5 text-slate-400" />
                              {usuario.cargo || "Não informado"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {usuario.whatsapp || "-"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {usuario.usuario || "-"}
                              </span>

                              {usuario.perfil && (
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  {usuario.perfil}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold">
                              <ShieldCheck className="w-3 h-3" />
                              {quantidadePermissoes} quadro
                              {quantidadePermissoes !== 1 ? "s" : ""}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                toggleAtivoRapido(usuario)
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                                ativo
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                              }`}
                            >
                              {ativo ? (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3" />
                                  Inativo
                                </>
                              )}
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  abrirEdicao(usuario)
                                }
                                title="Editar colaborador"
                                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  excluirUsuario(usuario)
                                }
                                title="Excluir colaborador"
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 pt-8 overflow-y-auto"
          onClick={fecharModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                    {editingUsuario ? (
                      <Pencil className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {editingUsuario
                        ? "Editar Colaborador"
                        : "Novo Colaborador"}
                    </h2>

                    <p className="text-[11px] text-slate-400">
                      Cadastro e permissões de acesso
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={saving}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* DADOS PRINCIPAIS */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Dados do colaborador
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Informações principais, cargo e documento.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="field-label">
                      Nome completo *
                    </label>
                    <input
                      value={form.nome}
                      onChange={(e) =>
                        updateForm("nome", e.target.value)
                      }
                      placeholder="Nome do colaborador"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      CPF / CNPJ
                    </label>
                    <input
                      value={form.cpf_cnpj}
                      onChange={(e) =>
                        updateForm(
                          "cpf_cnpj",
                          formatCpfCnpj(e.target.value)
                        )
                      }
                      placeholder="CPF ou CNPJ"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Cargo *
                    </label>
                    <input
                      value={form.cargo}
                      onChange={(e) =>
                        updateForm("cargo", e.target.value)
                      }
                      placeholder="Ex.: Designer"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      WhatsApp
                    </label>
                    <input
                      value={form.whatsapp}
                      onChange={(e) =>
                        updateForm(
                          "whatsapp",
                          formatWhatsapp(e.target.value)
                        )
                      }
                      placeholder="(11) 99999-9999"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        updateForm("email", e.target.value)
                      }
                      placeholder="email@empresa.com"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Usuário / Login
                    </label>
                    <input
                      value={form.usuario}
                      onChange={(e) =>
                        updateForm("usuario", e.target.value)
                      }
                      placeholder="usuario.login"
                      className="field-input"
                    />
                  </div>
                </div>
              </section>

              {/* ENDEREÇO */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />

                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Endereço
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-4">
                    <label className="field-label">
                      Endereço
                    </label>
                    <input
                      value={form.endereco}
                      onChange={(e) =>
                        updateForm("endereco", e.target.value)
                      }
                      placeholder="Rua, avenida..."
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Número
                    </label>
                    <input
                      value={form.numero}
                      onChange={(e) =>
                        updateForm("numero", e.target.value)
                      }
                      placeholder="123"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      CEP
                    </label>
                    <input
                      value={form.cep}
                      onChange={(e) =>
                        updateForm(
                          "cep",
                          formatCEP(e.target.value)
                        )
                      }
                      placeholder="00000-000"
                      className="field-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="field-label">
                      Bairro
                    </label>
                    <input
                      value={form.bairro}
                      onChange={(e) =>
                        updateForm("bairro", e.target.value)
                      }
                      className="field-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="field-label">
                      Cidade
                    </label>
                    <input
                      value={form.cidade}
                      onChange={(e) =>
                        updateForm("cidade", e.target.value)
                      }
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Estado
                    </label>
                    <input
                      value={form.estado}
                      onChange={(e) =>
                        updateForm(
                          "estado",
                          e.target.value.toUpperCase().substring(0, 2)
                        )
                      }
                      placeholder="SP"
                      className="field-input"
                    />
                  </div>
                </div>
              </section>

              {/* EMERGÊNCIA */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />

                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Contatos de emergência
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Cadastre até dois contatos para situações de emergência.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      Contato 01
                    </div>

                    <input
                      value={form.emergencia_1_nome}
                      onChange={(e) =>
                        updateForm(
                          "emergencia_1_nome",
                          e.target.value
                        )
                      }
                      placeholder="Nome do contato"
                      className="field-input"
                    />

                    <input
                      value={form.emergencia_1_whatsapp}
                      onChange={(e) =>
                        updateForm(
                          "emergencia_1_whatsapp",
                          formatWhatsapp(e.target.value)
                        )
                      }
                      placeholder="WhatsApp"
                      className="field-input"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      Contato 02
                    </div>

                    <input
                      value={form.emergencia_2_nome}
                      onChange={(e) =>
                        updateForm(
                          "emergencia_2_nome",
                          e.target.value
                        )
                      }
                      placeholder="Nome do contato"
                      className="field-input"
                    />

                    <input
                      value={form.emergencia_2_whatsapp}
                      onChange={(e) =>
                        updateForm(
                          "emergencia_2_whatsapp",
                          formatWhatsapp(e.target.value)
                        )
                      }
                      placeholder="WhatsApp"
                      className="field-input"
                    />
                  </div>
                </div>
              </section>

              {/* ACESSO */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-500" />

                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Acesso ao sistema
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Dados utilizados para autenticação do colaborador.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="field-label">
                      Senha {editingUsuario ? "(deixe vazio para manter)" : "*"}
                    </label>

                    <input
                      type="password"
                      value={form.senha}
                      onChange={(e) =>
                        updateForm("senha", e.target.value)
                      }
                      placeholder={
                        editingUsuario
                          ? "Manter senha atual"
                          : "Senha de acesso"
                      }
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Perfil
                    </label>

                    <select
                      value={form.perfil}
                      onChange={(e) =>
                        updateForm("perfil", e.target.value)
                      }
                      className="field-input"
                    >
                      <option value="colaborador">
                        Colaborador
                      </option>
                      <option value="gestor">Gestor</option>
                      <option value="administrador">
                        Administrador
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">
                      Tipo
                    </label>

                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        updateForm("tipo", e.target.value)
                      }
                      className="field-input"
                    >
                      <option value="colaborador">
                        Colaborador
                      </option>
                      <option value="gestor">Gestor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) =>
                      updateForm("ativo", e.target.checked)
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />

                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Colaborador ativo
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Permite que o colaborador continue utilizando o sistema.
                    </div>
                  </div>
                </label>
              </section>

              {/* PERMISSÕES */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />

                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Permissões de quadros
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Defina quais áreas do sistema este colaborador poderá acessar.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUADROS.map((quadro) => {
                    const permitido =
                      selectedPermissions[quadro.id] === true;

                    return (
                      <button
                        type="button"
                        key={quadro.id}
                        onClick={() =>
                          togglePermission(quadro.id)
                        }
                        className={`text-left p-4 rounded-2xl border transition-all ${
                          permitido
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div
                              className={`text-xs font-extrabold ${
                                permitido
                                  ? "text-indigo-700 dark:text-indigo-300"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {quadro.nome}
                            </div>

                            <p className="text-[10px] text-slate-400 mt-1">
                              {quadro.descricao}
                            </p>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              permitido
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {permitido && (
                              <span className="text-[11px] font-black">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* FOOTER */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={fecharModal}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarUsuario}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingUsuario
                      ? "Salvar Alterações"
                      : "Cadastrar Colaborador"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS LOCAIS */}
      <style>{`
        .field-label {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 700;
          color: rgb(71 85 105);
        }

        .dark .field-label {
          color: rgb(203 213 225);
        }

        .field-input {
          width: 100%;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(15 23 42);
          font-size: 12px;
          outline: none;
          transition: all .15s ease;
        }

        .field-input:focus {
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, .10);
        }

        .dark .field-input {
          background: rgb(15 23 42);
          border-color: rgb(51 65 85);
          color: rgb(241 245 249);
        }

        .dark .field-input:focus {
          border-color: rgb(99 102 241);
        }
      `}</style>
    </div>
  );
};

export default RHView;