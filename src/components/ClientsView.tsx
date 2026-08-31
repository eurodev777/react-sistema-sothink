import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Globe,
  UserCheck,
  FileText,
  Kanban,
  Folder,
  History,
  Settings,
  X,
  Loader2,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { EmpresaCliente, ResponsavelCliente, AtaReuniao, Job } from "../types";
import { apiService } from "../services/apiService";

interface ClientsViewProps {
  clientes: EmpresaCliente[];
  atas: AtaReuniao[];
  jobs: Job[];
  onSaveCliente: (cliente: Partial<EmpresaCliente>) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
  onSelectJob: (job: Job) => void;
  onOpenNewAtaForClient: (cliente: EmpresaCliente) => void;
  onOpenNewJobForClient: (cliente: EmpresaCliente) => void;
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    desc?: string
  ) => void;
}

type ClientWithDbFields = EmpresaCliente & {
  endereco?: string;
  username?: string;
  password?: string;
  logradouro?: string;
  login_cliente?: string;
  senha_cliente?: string;
  contatos?: ResponsavelCliente[];
  responsaveis?: ResponsavelCliente[];
  permitir_acesso?: boolean | number | string;
};

const isEnabled = (value: any) =>
  value === true || value === 1 || value === "1" || value === "true";

const safe = (value: any) => {
  if (value === null || value === undefined || value === "null") return "";
  return String(value);
};

const normalizeClient = (
  raw: any,
  contacts: ResponsavelCliente[] = []
): ClientWithDbFields => ({
  ...raw,
  razao_social: safe(raw.razao_social),
  nome_fantasia: safe(raw.nome_fantasia),
  cnpj: safe(raw.cnpj),
  inscricao_estadual: safe(raw.inscricao_estadual),
  logradouro: safe(raw.endereco ?? raw.logradouro),
  endereco: safe(raw.endereco ?? raw.logradouro),
  numero: safe(raw.numero),
  bairro: safe(raw.bairro),
  cidade: safe(raw.cidade),
  estado: safe(raw.estado),
  cep: safe(raw.cep),
  telefone: safe(raw.telefone),
  whatsapp: safe(raw.whatsapp),
  email: safe(raw.email),
  site: safe(raw.site),
  instagram: safe(raw.instagram),
  facebook: safe(raw.facebook),
  username: safe(raw.username ?? raw.login_cliente),
  password: safe(raw.password ?? raw.senha_cliente),
  login_cliente: safe(raw.username ?? raw.login_cliente),
  senha_cliente: safe(raw.password ?? raw.senha_cliente),
  permitir_acesso: isEnabled(raw.permitir_acesso),
  contatos: contacts.length ? contacts : raw.contatos || raw.responsaveis || [],
  responsaveis: contacts.length ? contacts : raw.contatos || raw.responsaveis || [],
});

const emptyForm = (): Partial<EmpresaCliente> => ({
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao_estadual: "ISENTA",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  telefone: "",
  whatsapp: "",
  email: "",
  site: "",
  instagram: "",
  facebook: "",
  permitir_acesso: true,
  login_cliente: "",
  senha_cliente: "",
  responsaveis: [],
});

export const ClientsView: React.FC<ClientsViewProps> = ({
  atas,
  jobs,
  onDeleteCliente,
  onSelectJob,
  onOpenNewAtaForClient,
  onOpenNewJobForClient,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithDbFields | null>(null);
  const [clientDetailTab, setClientDetailTab] = useState<
    "info" | "atas" | "jobs" | "arquivos" | "historico" | "config"
  >("info");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithDbFields | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showDetailPassword, setShowDetailPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<EmpresaCliente>>(emptyForm());
  const [responsaveis, setResponsaveis] = useState<ResponsavelCliente[]>([]);
  const [clientes, setClientes] = useState<ClientWithDbFields[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  const carregarClientes = async (keepSelectedId?: string) => {
    try {
      setLoadingClientes(true);

      const [clientesResult, contatosResult] = await Promise.allSettled([
        fetch("https://sothink.com.br/app/api/listar?tabela=clientes", {
          cache: "no-store",
        }).then((r) => r.json()),
        fetch("https://sothink.com.br/app/api/listar?tabela=clientes_contatos", {
          cache: "no-store",
        }).then((r) => r.json()),
      ]);

      if (clientesResult.status !== "fulfilled" || !Array.isArray(clientesResult.value)) {
        throw new Error("Não foi possível carregar a tabela de clientes.");
      }

      const contatosRaw =
        contatosResult.status === "fulfilled" && Array.isArray(contatosResult.value)
          ? contatosResult.value
          : [];

      const contatosPorCliente = new Map<string, ResponsavelCliente[]>();
      contatosRaw.forEach((contato: any) => {
        const key = String(contato.cliente_id || "");
        if (!key) return;
        const atual = contatosPorCliente.get(key) || [];
        atual.push({
          ...contato,
          id: contato.id,
          nome: safe(contato.nome),
          cargo: safe(contato.cargo),
          email: safe(contato.email),
          telefone: safe(contato.telefone),
          whatsapp: safe(contato.whatsapp),
          data_aniversario:
            contato.data_aniversario === "0000-00-00"
              ? ""
              : safe(contato.data_aniversario),
        });
        contatosPorCliente.set(key, atual);
      });

      const normalizados = clientesResult.value.map((cliente: any) =>
        normalizeClient(
          cliente,
          contatosPorCliente.get(String(cliente.id)) || []
        )
      );

      setClientes(normalizados);

      const idToKeep = keepSelectedId || selectedClient?.id;
      if (idToKeep) {
        const refreshed = normalizados.find(
          (cliente: ClientWithDbFields) => String(cliente.id) === String(idToKeep)
        );
        if (refreshed) setSelectedClient(refreshed);
      }
    } catch (error: any) {
      console.error("Erro ao carregar clientes:", error);
      showToast(
        "error",
        "Erro ao carregar clientes",
        error?.message || "Não foi possível consultar os clientes."
      );
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClients = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return clientes;

    return clientes.filter((c) =>
      [
        c.razao_social,
        c.nome_fantasia,
        c.cnpj,
        c.cidade,
        c.estado,
        c.email,
        c.telefone,
        c.whatsapp,
        c.login_cliente,
      ].some((value) => safe(value).toLowerCase().includes(termo))
    );
  }, [clientes, searchTerm]);

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormData({
      ...emptyForm(),
      senha_cliente: "sothink2026",
    });
    setResponsaveis([
      {
        id: `new-${Date.now()}`,
        nome: "",
        cargo: "Gerente / Contato Principal",
        email: "",
        telefone: "",
        whatsapp: "",
        data_aniversario: "",
      } as ResponsavelCliente,
    ]);
    setShowFormPassword(false);
    setModalOpen(true);
  };

  const openEditClientModal = (client: EmpresaCliente) => {
    const c = normalizeClient(client as any, (client as any).contatos || []);

    setEditingClient(c);
    setFormData({
      ...c,
      logradouro: safe(c.endereco ?? c.logradouro),
      login_cliente: safe(c.username ?? c.login_cliente),
      senha_cliente: safe(c.password ?? c.senha_cliente),
      permitir_acesso: isEnabled(c.permitir_acesso),
    });
    setResponsaveis(c.contatos || c.responsaveis || []);
    setShowFormPassword(false);
    setModalOpen(true);
  };

  const handleConsultarCNPJ = async () => {
    if (!formData.cnpj) {
      showToast("error", "CNPJ Obrigatório", "Informe o CNPJ antes de consultar.");
      return;
    }

    setCnpjLoading(true);
    try {
      const res = await apiService.consultarCNPJ(formData.cnpj);
      if (res.success && res.data) {
        const d = res.data;
        setFormData((prev) => ({
          ...prev,
          razao_social: d.razao_social || prev.razao_social,
          nome_fantasia: d.nome_fantasia || d.razao_social || prev.nome_fantasia,
          logradouro: d.logradouro || d.endereco || prev.logradouro,
          numero: d.numero || prev.numero,
          bairro: d.bairro || prev.bairro,
          cidade: d.cidade || prev.cidade,
          estado: d.estado || prev.estado,
          cep: d.cep || prev.cep,
          telefone: d.telefone || prev.telefone,
          email: d.email || prev.email,
        }));
        showToast(
          "success",
          "CNPJ Consultado com Sucesso!",
          "Dados preenchidos automaticamente."
        );
      } else {
        showToast(
          "error",
          "Falha na Consulta CNPJ",
          res.message || "CNPJ não encontrado."
        );
      }
    } catch (e: any) {
      showToast("error", "Erro na Consulta", e.message);
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleAddResponsavel = () => {
    setResponsaveis((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome: "",
        cargo: "",
        email: "",
        telefone: "",
        whatsapp: "",
        data_aniversario: "",
      } as ResponsavelCliente,
    ]);
  };

  const handleUpdateResponsavel = (
    index: number,
    field: keyof ResponsavelCliente,
    value: string
  ) => {
    setResponsaveis((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveResponsavel = (index: number) => {
    setResponsaveis((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.razao_social?.trim()) {
      showToast("error", "Razão Social é obrigatória");
      return;
    }

    if (!formData.nome_fantasia?.trim()) {
      showToast("error", "Nome Fantasia é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("tabela", "clientes");
      form.append("razao_social", formData.razao_social || "");
      form.append("nome_fantasia", formData.nome_fantasia || "");
      form.append("cnpj", formData.cnpj || "");
      form.append("inscricao_estadual", formData.inscricao_estadual || "");
      form.append("endereco", formData.logradouro || "");
      form.append("numero", formData.numero || "");
      form.append("bairro", formData.bairro || "");
      form.append("cidade", formData.cidade || "");
      form.append("estado", formData.estado || "");
      form.append("cep", formData.cep || "");
      form.append("telefone", formData.telefone || "");
      form.append("whatsapp", formData.whatsapp || "");
      form.append("email", formData.email || "");
      form.append("site", formData.site || "");
      form.append("instagram", formData.instagram || "");
      form.append("facebook", formData.facebook || "");

      // NOMES REAIS DA TABELA clientes
      form.append("username", (formData as any).login_cliente || "");
      form.append("password", (formData as any).senha_cliente || "");
      form.append("permitir_acesso", formData.permitir_acesso ? "1" : "0");

      // Mantém a estrutura que sua API já recebe para responsáveis/contatos.
      form.append("contatos", JSON.stringify(responsaveis));

      const isEditing = Boolean(editingClient?.id);
      const url = isEditing
        ? "https://sothink.com.br/app/api/editar"
        : "https://sothink.com.br/app/api/inserir";

      if (isEditing) {
        form.append("id", String(editingClient!.id));
      }

      const response = await fetch(url, {
        method: "POST",
        body: form,
      });

      const texto = await response.text();
      let result: any;

      try {
        result = texto ? JSON.parse(texto) : {};
      } catch {
        throw new Error("Resposta inválida da API:\n" + texto);
      }

      if (!response.ok || result?.erro || result?.sucesso === false) {
        throw new Error(result?.erro || `Erro HTTP ${response.status}`);
      }

      const idSalvo = editingClient?.id || result?.id || result?.data?.id;

      setModalOpen(false);
      setEditingClient(null);

      await carregarClientes(idSalvo ? String(idSalvo) : undefined);

      showToast(
        "success",
        isEditing ? "Cliente Atualizado!" : "Cliente Cadastrado!",
        "Todos os dados, inclusive acesso do cliente, foram salvos."
      );
    } catch (err: any) {
      console.error("Erro ao salvar cliente:", err);
      showToast(
        "error",
        "Erro ao salvar cliente",
        err?.message || "Não foi possível salvar os dados."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient?.id) return;

    if (!confirm(`Excluir o cliente ${selectedClient.nome_fantasia || selectedClient.razao_social}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://sothink.com.br/app/api/deletar?id=${selectedClient.id}&tabela=clientes`
      );
      const data = await response.json();

      if (data.sucesso) {
        if (onDeleteCliente) await onDeleteCliente(selectedClient.id);
        setSelectedClient(null);
        await carregarClientes();
        showToast("info", "Cliente Excluído");
      } else {
        showToast("error", "Erro ao excluir cliente", data.erro || "Erro desconhecido");
      }
    } catch (error) {
      showToast("error", "Erro de conexão com a API");
    }
  };

  const copyText = async (label: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      showToast("error", "Não foi possível copiar");
    }
  };

  const selectedAtas = selectedClient
    ? atas.filter(
        (a: any) =>
          String(a.cliente_id || a.id_cliente || a.cliente) ===
          String(selectedClient.id)
      )
    : [];

  const selectedJobs = selectedClient
    ? jobs.filter((j) => String(j.cliente_id) === String(selectedClient.id))
    : [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            CRM de Clientes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastro de empresas, contatos responsáveis, histórico e acessos.
          </p>
        </div>
        <button
          onClick={openNewClientModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Empresa
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative max-w-xl w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar empresa, CNPJ, cidade, e-mail ou login..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all"
          />
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          {clientes.length} cliente{clientes.length === 1 ? "" : "s"}
        </span>
      </div>

      {loadingClientes && clientes.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <span className="text-xs font-bold">Carregando clientes...</span>
        </div>
      ) : !selectedClient ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientAtasCount = atas.filter(
              (a: any) =>
                String(a.cliente_id || a.id_cliente || a.cliente) ===
                String(client.id)
            ).length;
            const clientJobsCount = jobs.filter(
              (j) => String(j.cliente_id) === String(client.id)
            ).length;

            return (
              <div
                key={client.id}
                onClick={() => {
                  setSelectedClient(client);
                  setClientDetailTab("info");
                  setShowDetailPassword(false);
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                      {client.nome_fantasia?.charAt(0) ||
                        client.razao_social?.charAt(0) ||
                        "C"}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isEnabled(client.permitir_acesso)
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isEnabled(client.permitir_acesso)
                        ? "Portal liberado"
                        : "Portal bloqueado"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {client.nome_fantasia || client.razao_social}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {client.razao_social}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-2.5 py-2">
                      <span className="text-slate-400 block">Cidade</span>
                      <strong className="text-slate-700 dark:text-slate-300">
                        {client.cidade || "-"}
                        {client.estado ? `/${client.estado}` : ""}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-2.5 py-2 min-w-0">
                      <span className="text-slate-400 block">Login</span>
                      <strong className="text-slate-700 dark:text-slate-300 block truncate">
                        {client.login_cliente || "Não definido"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      {clientAtasCount} Atas
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Kanban className="w-3.5 h-3.5 text-blue-500" />
                      {clientJobsCount} Jobs
                    </span>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Abrir <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                {selectedClient.nome_fantasia?.charAt(0) || "C"}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedClient.nome_fantasia || selectedClient.razao_social}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedClient.razao_social}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditClientModal(selectedClient)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Editar Cliente
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Excluir cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
            {[
              "info",
              "atas",
              "jobs",
              "arquivos",
              "historico",
              "config",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setClientDetailTab(tab as any)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  clientDetailTab === tab
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab === "info" && <Building2 className="w-4 h-4" />}
                {tab === "atas" && (
                  <>
                    <FileText className="w-4 h-4" /> Atas ({selectedAtas.length})
                  </>
                )}
                {tab === "jobs" && (
                  <>
                    <Kanban className="w-4 h-4" /> Jobs ({selectedJobs.length})
                  </>
                )}
                {tab === "arquivos" && <Folder className="w-4 h-4" />}
                {tab === "historico" && <History className="w-4 h-4" />}
                {tab === "config" && <Settings className="w-4 h-4" />}
                {(tab === "info" ||
                  tab === "arquivos" ||
                  tab === "historico" ||
                  tab === "config") && (
                  <span className="capitalize">{tab}</span>
                )}
              </button>
            ))}
          </div>

          {clientDetailTab === "info" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 pt-2">
              <div className="xl:col-span-2 space-y-5">
                <InfoSection
                  title="Dados Cadastrais da Empresa"
                  icon={<Building2 className="w-4 h-4 text-indigo-500" />}
                >
                  <InfoGrid>
                    <InfoItem label="Razão Social" value={selectedClient.razao_social} />
                    <InfoItem label="Nome Fantasia" value={selectedClient.nome_fantasia} />
                    <InfoItem label="CNPJ" value={selectedClient.cnpj} />
                    <InfoItem
                      label="Inscrição Estadual"
                      value={selectedClient.inscricao_estadual || "-"}
                    />
                  </InfoGrid>
                </InfoSection>

                <InfoSection
                  title="Endereço"
                  icon={<MapPin className="w-4 h-4 text-indigo-500" />}
                >
                  <InfoGrid>
                    <InfoItem
                      label="Endereço"
                      value={`${selectedClient.logradouro || selectedClient.endereco || ""}${
                        selectedClient.numero ? `, ${selectedClient.numero}` : ""
                      }` || "-"}
                    />
                    <InfoItem label="Bairro" value={selectedClient.bairro || "-"} />
                    <InfoItem
                      label="Cidade / UF"
                      value={`${selectedClient.cidade || "-"}${
                        selectedClient.estado ? ` / ${selectedClient.estado}` : ""
                      }`}
                    />
                    <InfoItem label="CEP" value={selectedClient.cep || "-"} />
                  </InfoGrid>
                </InfoSection>

                <InfoSection
                  title="Contato e Canais Digitais"
                  icon={<Phone className="w-4 h-4 text-indigo-500" />}
                >
                  <InfoGrid>
                    <InfoItem label="Telefone" value={selectedClient.telefone || "-"} />
                    <InfoItem label="WhatsApp" value={selectedClient.whatsapp || "-"} />
                    <InfoItem label="E-mail" value={selectedClient.email || "-"} />
                    <InfoItem label="Site" value={selectedClient.site || "-"} />
                    <InfoItem label="Instagram" value={selectedClient.instagram || "-"} />
                    <InfoItem label="Facebook" value={selectedClient.facebook || "-"} />
                  </InfoGrid>
                </InfoSection>

                <InfoSection
                  title={`Responsáveis / Contatos (${selectedClient.contatos?.length || 0})`}
                  icon={<UserCheck className="w-4 h-4 text-indigo-500" />}
                >
                  {!selectedClient.contatos?.length ? (
                    <p className="text-xs text-slate-500">Nenhum contato cadastrado.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedClient.contatos.map((contato: any, index: number) => (
                        <div
                          key={contato.id || index}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {contato.nome || "Contato sem nome"}
                          </h5>
                          <p className="text-[10px] text-indigo-500 font-bold mb-2">
                            {contato.cargo || "Sem cargo"}
                          </p>
                          <div className="space-y-1 text-[10px] text-slate-500">
                            {contato.email && <p>E-mail: {contato.email}</p>}
                            {contato.telefone && <p>Telefone: {contato.telefone}</p>}
                            {contato.whatsapp && <p>WhatsApp: {contato.whatsapp}</p>}
                            {contato.data_aniversario && (
                              <p>Aniversário: {contato.data_aniversario}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </InfoSection>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/20 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      Acesso do Cliente
                    </h4>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isEnabled(selectedClient.permitir_acesso)
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {isEnabled(selectedClient.permitir_acesso)
                        ? "LIBERADO"
                        : "BLOQUEADO"}
                    </span>
                  </div>

                  <CredentialRow
                    label="Login"
                    value={selectedClient.login_cliente || selectedClient.username || ""}
                    onCopy={() =>
                      copyText(
                        "login",
                        selectedClient.login_cliente || selectedClient.username || ""
                      )
                    }
                    copied={copiedField === "login"}
                  />

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Senha
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 truncate">
                        {showDetailPassword
                          ? selectedClient.senha_cliente || selectedClient.password || "Não definida"
                          : selectedClient.senha_cliente || selectedClient.password
                          ? "••••••••••••"
                          : "Não definida"}
                      </code>
                      <button
                        type="button"
                        onClick={() => setShowDetailPassword((v) => !v)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500"
                        title={showDetailPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showDetailPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            "senha",
                            selectedClient.senha_cliente || selectedClient.password || ""
                          )
                        }
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500"
                        title="Copiar senha"
                      >
                        {copiedField === "senha" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditClientModal(selectedClient)}
                    className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Editar dados e acesso
                  </button>
                </div>
              </div>
            </div>
          )}

          {clientDetailTab === "atas" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Atas de Reunião com {selectedClient.nome_fantasia}
                </h4>
                <button
                  onClick={() => onOpenNewAtaForClient(selectedClient)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Ata
                </button>
              </div>

              {selectedAtas.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Nenhuma ata registrada para este cliente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedAtas.map((ata: any) => (
                    <div
                      key={ata.id}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {ata.objetivo || ata.titulo || ata.assunto || "Ata de reunião"}
                        </h5>
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 shrink-0">
                          {ata.data_reuniao || ata.data || "-"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {ata.assuntos || ata.resumo || "Sem resumo disponível."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {clientDetailTab === "jobs" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Jobs de {selectedClient.nome_fantasia}
                </h4>
                <button
                  onClick={() => onOpenNewJobForClient(selectedClient)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Job
                </button>
              </div>

              {selectedJobs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Kanban className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Nenhum job cadastrado para este cliente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="cursor-pointer p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 transition-colors shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                          {job.titulo}
                        </h5>
                        <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-1 rounded shrink-0">
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {job.briefing || job.descricao || "Sem descrição."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {clientDetailTab === "config" && (
            <div className="max-w-2xl pt-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-500" /> Acesso ao Portal do Cliente
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dados utilizados pelo cliente para entrar na Área do Cliente.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isEnabled(selectedClient.permitir_acesso)
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                    }`}
                  >
                    {isEnabled(selectedClient.permitir_acesso) ? "LIBERADO" : "BLOQUEADO"}
                  </span>
                </div>

                <CredentialRow
                  label="Login"
                  value={selectedClient.login_cliente || selectedClient.username || ""}
                  onCopy={() =>
                    copyText(
                      "login-config",
                      selectedClient.login_cliente || selectedClient.username || ""
                    )
                  }
                  copied={copiedField === "login-config"}
                />

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Senha
                  </span>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
                      {showDetailPassword
                        ? selectedClient.senha_cliente || selectedClient.password || "Não definida"
                        : selectedClient.senha_cliente || selectedClient.password
                        ? "••••••••••••"
                        : "Não definida"}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowDetailPassword((v) => !v)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500"
                    >
                      {showDetailPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEditClientModal(selectedClient)}
                  className="w-fit px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Editar login, senha e dados
                </button>
              </div>
            </div>
          )}

          {(clientDetailTab === "arquivos" || clientDetailTab === "historico") && (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Área em desenvolvimento.
              </p>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingClient ? "Editar Cliente" : "Cadastrar Nova Empresa"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {editingClient
                    ? "Altere todos os dados cadastrais e o acesso do cliente."
                    : "Preencha os dados da empresa e configure o acesso ao portal."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <FormSection
                title="Dados da Empresa"
                icon={<Building2 className="w-4 h-4 text-indigo-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Razão Social *">
                    <input
                      required
                      type="text"
                      value={formData.razao_social || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, razao_social: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Nome Fantasia *">
                    <input
                      required
                      type="text"
                      value={formData.nome_fantasia || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nome_fantasia: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="CNPJ">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.cnpj || ""}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handleConsultarCNPJ}
                        disabled={cnpjLoading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
                      >
                        {cnpjLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {cnpjLoading ? "Buscando" : "Buscar CNPJ"}
                      </button>
                    </div>
                  </Field>

                  <Field label="Inscrição Estadual">
                    <input
                      type="text"
                      value={formData.inscricao_estadual || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inscricao_estadual: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection
                title="Endereço"
                icon={<MapPin className="w-4 h-4 text-indigo-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-4">
                    <Field label="Endereço / Logradouro">
                      <input
                        type="text"
                        value={(formData as any).logradouro || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, logradouro: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Número">
                      <input
                        type="text"
                        value={formData.numero || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, numero: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Bairro">
                      <input
                        type="text"
                        value={formData.bairro || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, bairro: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Cidade">
                      <input
                        type="text"
                        value={formData.cidade || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, cidade: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-1">
                    <Field label="UF">
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.estado || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estado: e.target.value.toUpperCase(),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-1">
                    <Field label="CEP">
                      <input
                        type="text"
                        value={formData.cep || ""}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Contato da Empresa"
                icon={<Phone className="w-4 h-4 text-indigo-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Telefone">
                    <input
                      type="text"
                      value={formData.telefone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, telefone: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="WhatsApp">
                    <input
                      type="text"
                      value={formData.whatsapp || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="E-mail">
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection
                title="Site e Redes Sociais"
                icon={<Globe className="w-4 h-4 text-indigo-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Site">
                    <input
                      type="text"
                      value={formData.site || ""}
                      onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Instagram">
                    <input
                      type="text"
                      value={formData.instagram || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram: e.target.value })
                      }
                      placeholder="@empresa ou URL"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Facebook">
                    <input
                      type="text"
                      value={formData.facebook || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, facebook: e.target.value })
                      }
                      placeholder="URL da página"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection
                title="Acesso à Área do Cliente"
                icon={<Lock className="w-4 h-4 text-indigo-500" />}
              >
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-4">
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white block">
                        Permitir acesso ao portal
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Quando desativado, o cliente não deve conseguir acessar a Área do Cliente.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.permitir_acesso)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permitir_acesso: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-indigo-600"
                    />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Login / Usuário">
                      <input
                        type="text"
                        autoComplete="off"
                        value={(formData as any).login_cliente || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            login_cliente: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="Login do cliente"
                      />
                    </Field>

                    <Field label="Senha">
                      <div className="relative">
                        <input
                          type={showFormPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={(formData as any).senha_cliente || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              senha_cliente: e.target.value,
                            })
                          }
                          className={`${inputClass} pr-11`}
                          placeholder="Senha de acesso"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFormPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
                          title={showFormPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showFormPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Responsáveis / Contatos"
                icon={<UserCheck className="w-4 h-4 text-indigo-500" />}
                action={
                  <button
                    type="button"
                    onClick={handleAddResponsavel}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar contato
                  </button>
                }
              >
                {responsaveis.length === 0 ? (
                  <div className="text-center py-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                    Nenhum contato cadastrado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responsaveis.map((resp, index) => (
                      <div
                        key={(resp as any).id || index}
                        className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsavel(index)}
                          className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Remover contato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-8">
                          <Field label="Nome *">
                            <input
                              type="text"
                              value={resp.nome || ""}
                              onChange={(e) =>
                                handleUpdateResponsavel(index, "nome", e.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Cargo">
                            <input
                              type="text"
                              value={resp.cargo || ""}
                              onChange={(e) =>
                                handleUpdateResponsavel(index, "cargo", e.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>
                          <Field label="E-mail">
                            <input
                              type="email"
                              value={resp.email || ""}
                              onChange={(e) =>
                                handleUpdateResponsavel(index, "email", e.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Telefone">
                            <input
                              type="text"
                              value={resp.telefone || ""}
                              onChange={(e) =>
                                handleUpdateResponsavel(index, "telefone", e.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>
                          <Field label="WhatsApp">
                            <input
                              type="text"
                              value={resp.whatsapp || ""}
                              onChange={(e) =>
                                handleUpdateResponsavel(index, "whatsapp", e.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Data de Aniversário">
                            <input
                              type="date"
                              value={resp.data_aniversario || ""}
                              onChange={(e) =>
                                handleUpdateResponsavel(
                                  index,
                                  "data_aniversario",
                                  e.target.value
                                )
                              }
                              className={inputClass}
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FormSection>

              <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving
                    ? "Salvando..."
                    : editingClient
                    ? "Salvar Alterações"
                    : "Cadastrar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputClass =
  "w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
      {label}
    </label>
    {children}
  </div>
);

const FormSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, icon, children, action }) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
        {icon} {title}
      </h4>
      {action}
    </div>
    {children}
  </section>
);

const InfoSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
      {icon} {title}
    </h4>
    {children}
  </div>
);

const InfoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 text-xs">
    {children}
  </div>
);

const InfoItem: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <div className="min-w-0">
    <span className="text-slate-400 block font-medium mb-0.5">{label}:</span>
    <span className="font-bold text-slate-800 dark:text-slate-200 break-words">
      {value || "-"}
    </span>
  </div>
);

const CredentialRow: React.FC<{
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}> = ({ label, value, onCopy, copied }) => (
  <div className="space-y-1">
    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <code className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 truncate">
        {value || "Não definido"}
      </code>
      <button
        type="button"
        onClick={onCopy}
        disabled={!value}
        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 disabled:opacity-40"
        title={`Copiar ${label.toLowerCase()}`}
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  </div>
);
