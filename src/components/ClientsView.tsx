import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  UserCheck,
  FileText,
  Kanban,
  Folder,
  History,
  Settings,
  X,
  CheckCircle2,
  Loader2,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  MapPin,
  Lock,
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

export const ClientsView: React.FC<ClientsViewProps> = ({
  atas,
  jobs,
  onSaveCliente,
  onDeleteCliente,
  onSelectJob,
  onOpenNewAtaForClient,
  onOpenNewJobForClient,
  showToast,
}) => {
  console.log("Teste de Atas:", atas);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<EmpresaCliente | null>(null);
  const [clientDetailTab, setClientDetailTab] = useState<
    "info" | "atas" | "jobs" | "arquivos" | "historico" | "config"
  >("info");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<EmpresaCliente> | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<EmpresaCliente>>({
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

  const [responsaveis, setResponsaveis] = useState<ResponsavelCliente[]>([]);
  const [clientes, setClientes] = useState<EmpresaCliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setLoadingClientes(true);
        const response = await fetch("https://sothink.com.br/app/api/listar?tabela=clientes");
        const data = await response.json();
        setClientes(data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      } finally {
        setLoadingClientes(false);
      }
    };
    carregarClientes();
  }, []);

  const filteredClients = clientes.filter(
    (c) =>
      c.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormData({
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
      senha_cliente: "sothink2026",
      responsaveis: [],
    });
    setResponsaveis([
      {
        id: `r-${Date.now()}`,
        nome: "",
        cargo: "Gerente / Contato Principal",
        email: "",
        telefone: "",
        whatsapp: "",
        data_aniversario: "",
      },
    ]);
    setModalOpen(true);
  };

  const openEditClientModal = (c: EmpresaCliente) => {
    setEditingClient(c);
    setFormData({ ...c });
    setResponsaveis(c.contatos || c.responsaveis || []);
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
          logradouro: d.logradouro || prev.logradouro,
          numero: d.numero || prev.numero,
          bairro: d.bairro || prev.bairro,
          cidade: d.cidade || prev.cidade,
          estado: d.estado || prev.estado,
          cep: d.cep || prev.cep,
          telefone: d.telefone || prev.telefone,
          email: d.email || prev.email,
        }));
        showToast("success", "CNPJ Consultado com Sucesso!", "Dados preenchidos automaticamente.");
      } else {
        showToast("error", "Falha na Consulta CNPJ", res.message || "CNPJ não encontrado.");
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
        id: `r-${Date.now()}`,
        nome: "",
        cargo: "",
        email: "",
        telefone: "",
        whatsapp: "",
        data_aniversario: "",
      },
    ]);
  };

  const handleUpdateResponsavel = (index: number, field: keyof ResponsavelCliente, value: string) => {
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
    if (!formData.razao_social) {
      showToast("error", "Razão Social é obrigatória");
      return;
    }

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
      form.append("username", formData.login_cliente || "");
      form.append("password", formData.senha_cliente || "");
      form.append("permitir_acesso", formData.permitir_acesso ? "1" : "0");
      form.append("contatos", JSON.stringify(responsaveis));

      const url = editingClient
        ? "https://sothink.com.br/app/api/editar"
        : "https://sothink.com.br/app/api/inserir";

      if (editingClient) {
        form.append("id", String(editingClient.id));
      }

      const response = await fetch(url, { method: "POST", body: form });
      const texto = await response.text();

      try {
        JSON.parse(texto);
      } catch {
        throw new Error("Resposta da API:\n" + texto);
      }
      setModalOpen(false);

      showToast("success", editingClient ? "Cliente Atualizado!" : "Cliente Cadastrado!", "Os dados foram salvos no sistema.");
      window.location.reload();
    } catch (err: any) {
      showToast("error", "Erro ao salvar cliente", err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient?.id) return;
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        const response = await fetch(`https://sothink.com.br/app/api/deletar?id=${selectedClient.id}&tabela=clientes`);
        const data = await response.json();
        if (data.sucesso) {
          if (onDeleteCliente) await onDeleteCliente(selectedClient.id);
          setSelectedClient(null);
          showToast("info", "Cliente Excluído");
          window.location.reload();
        } else {
          showToast("error", data.erro || "Erro ao excluir cliente");
        }
      } catch (error) {
        showToast("error", "Erro de conexão com a API");
      }
    }
  };

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

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por Razão Social, Nome Fantasia, CNPJ ou Cidade..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all"
        />
      </div>

      {!selectedClient ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientAtasCount = atas.filter((a) =>
              String(a.cliente_id || a.id_cliente || a.cliente) === String(client.id)
            ).length;
            const clientJobsCount = jobs.filter((j) => String(j.cliente_id) === String(client.id)).length;

            return (
              <div
                key={client.id}
                onClick={() => {
                  setSelectedClient(client);
                  setClientDetailTab("info");
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                      {client.nome_fantasia?.charAt(0) || client.razao_social?.charAt(0) || "C"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                        {client.cidade || "SP"} - {client.estado || "SP"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {client.nome_fantasia || client.razao_social}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {client.razao_social}
                    </p>
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
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
            {["info", "atas", "jobs", "arquivos", "historico", "config"].map((tab) => (
              <button
                key={tab}
                onClick={() => setClientDetailTab(tab as any)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${clientDetailTab === tab
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                {tab === "info" && <Building2 className="w-4 h-4" />}
                {tab === "atas" && (
                  <>
                    <FileText className="w-4 h-4" /> Atas ({atas.filter((a) => String(a.cliente_id || a.id_cliente || a.cliente) === String(selectedClient.id)).length})
                  </>
                )}
                {tab === "jobs" && (
                  <>
                    <Kanban className="w-4 h-4" /> Jobs ({jobs.filter((j) => String(j.cliente_id) === String(selectedClient.id)).length})
                  </>
                )}
                {tab === "arquivos" && <Folder className="w-4 h-4" />}
                {tab === "historico" && <History className="w-4 h-4" />}
                {tab === "config" && <Settings className="w-4 h-4" />}
                {(tab === "info" || tab === "arquivos" || tab === "historico" || tab === "config") && (
                  <span className="capitalize">{tab}</span>
                )}
              </button>
            ))}
          </div>

          {/* TAB: INFO */}
          {clientDetailTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    Dados Cadastrais da Empresa
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div><span className="text-slate-400 block font-medium">Razão Social:</span><span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.razao_social}</span></div>
                    <div><span className="text-slate-400 block font-medium">CNPJ:</span><span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.cnpj}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ATAS */}
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

              {atas.filter((a) => String(a.cliente_id || a.id_cliente || a.cliente) === String(selectedClient.id)).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Nenhuma ata registrada para este cliente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {atas
                    .filter((a) => String(a.cliente_id || a.id_cliente || a.cliente) === String(selectedClient.id))
                    .map((ata) => (
                      <div key={ata.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">
                            {ata.titulo || ata.assunto || "Ata sem título"}
                          </h5>
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 shrink-0">
                            {ata.data}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {ata.resumo || "Sem resumo disponível."}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: JOBS */}
          {clientDetailTab === "jobs" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Jobs Ativos de {selectedClient.nome_fantasia}
                </h4>
                <button
                  onClick={() => onOpenNewJobForClient(selectedClient)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Job
                </button>
              </div>
              {jobs.filter((j) => String(j.cliente_id) === String(selectedClient.id)).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Kanban className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Nenhum job aberto para este cliente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs
                    .filter((j) => String(j.cliente_id) === String(selectedClient.id))
                    .map((job) => (
                      <div key={job.id} onClick={() => onSelectJob(job)} className="cursor-pointer p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                            {job.titulo}
                          </h5>
                          <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                            {job.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{job.descricao}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* OTHERS TABS */}
          {(clientDetailTab === "arquivos" || clientDetailTab === "historico" || clientDetailTab === "config") && (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Área em desenvolvimento.</p>
            </div>
          )}

        </div>
      )}

      {/* Modal Novo/Editar Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingClient ? "Editar Empresa" : "Cadastrar Nova Empresa"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Formulário resumido para caber aqui: apliquei os campos vitais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Razão Social *</label>
                  <input required type="text" value={formData.razao_social} onChange={e => setFormData({ ...formData, razao_social: e.target.value })} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Fantasia</label>
                  <input type="text" value={formData.nome_fantasia} onChange={e => setFormData({ ...formData, nome_fantasia: e.target.value })} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">CNPJ</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                    <button type="button" onClick={handleConsultarCNPJ} className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold whitespace-nowrap">
                      {cnpjLoading ? "Buscando..." : "Buscar CNPJ"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
                >
                  {editingClient ? "Salvar Alterações" : "Cadastrar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};