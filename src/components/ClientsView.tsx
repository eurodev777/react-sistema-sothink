import React, { useState } from 'react';
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
} from 'lucide-react';
import { EmpresaCliente, ResponsavelCliente, AtaReuniao, Job } from '../types';
import { apiService } from '../services/apiService';

interface ClientsViewProps {
  clientes: EmpresaCliente[];
  atas: AtaReuniao[];
  jobs: Job[];
  onSaveCliente: (cliente: Partial<EmpresaCliente>) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
  onSelectJob: (job: Job) => void;
  onOpenNewAtaForClient: (cliente: EmpresaCliente) => void;
  onOpenNewJobForClient: (cliente: EmpresaCliente) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clientes,
  atas,
  jobs,
  onSaveCliente,
  onDeleteCliente,
  onSelectJob,
  onOpenNewAtaForClient,
  onOpenNewJobForClient,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<EmpresaCliente | null>(null);
  const [clientDetailTab, setClientDetailTab] = useState<
    'info' | 'atas' | 'jobs' | 'arquivos' | 'historico' | 'config'
  >('info');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<EmpresaCliente> | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  // Form state for new/edit client
  const [formData, setFormData] = useState<Partial<EmpresaCliente>>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: 'ISENTA',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    instagram: '',
    facebook: '',
    permitir_acesso: true,
    login_cliente: '',
    senha_cliente: '',
    responsaveis: [],
  });

  const [responsaveis, setResponsaveis] = useState<ResponsavelCliente[]>([]);

  const filteredClients = clientes.filter(
    (c) =>
      c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm) ||
      c.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormData({
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      inscricao_estadual: 'ISENTA',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      instagram: '',
      facebook: '',
      permitir_acesso: true,
      login_cliente: '',
      senha_cliente: 'sothink2026',
      responsaveis: [],
    });
    setResponsaveis([
      {
        id: `r-${Date.now()}`,
        nome: '',
        cargo: 'Gerente / Contato Principal',
        email: '',
        telefone: '',
        whatsapp: '',
        data_aniversario: '',
      },
    ]);
    setModalOpen(true);
  };

  const openEditClientModal = (c: EmpresaCliente) => {
    setEditingClient(c);
    setFormData({ ...c });
    setResponsaveis(c.responsaveis || []);
    setModalOpen(true);
  };

  // CNPJ Consulta Automática
  const handleConsultarCNPJ = async () => {
    if (!formData.cnpj) {
      showToast('error', 'CNPJ Obrigatório', 'Informe o CNPJ antes de consultar.');
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
          situacao: d.situacao,
          data_abertura: d.data_abertura,
          cnae: d.cnae,
          telefone: d.telefone || prev.telefone,
          email: d.email || prev.email,
        }));
        showToast('success', 'CNPJ Consultado com Sucesso!', 'Dados preenchidos automaticamente.');
      } else {
        showToast('error', 'Falha na Consulta CNPJ', res.message || 'CNPJ não encontrado.');
      }
    } catch (e: any) {
      showToast('error', 'Erro na Consulta', e.message);
    } finally {
      setCnpjLoading(false);
    }
  };

  // Add / Remove responsaveis
  const handleAddResponsavel = () => {
    setResponsaveis((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        nome: '',
        cargo: '',
        email: '',
        telefone: '',
        whatsapp: '',
        data_aniversario: '',
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

  // Submit Client Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razao_social) {
      showToast('error', 'Razão Social é obrigatória');
      return;
    }

    try {
      const payload: Partial<EmpresaCliente> = {
        ...formData,
        id: editingClient?.id,
        responsaveis,
      };

      await onSaveCliente(payload);
      setModalOpen(false);
      showToast(
        'success',
        editingClient ? 'Cliente Atualizado!' : 'Cliente Cadastrado!',
        'Os dados foram salvos no sistema.'
      );
    } catch (err: any) {
      showToast('error', 'Erro ao salvar cliente', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
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

      {/* Search Input Bar */}
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

      {/* Clients Cards Grid / Detail Split View */}
      {!selectedClient ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientAtasCount = atas.filter((a) => a.cliente_id === client.id).length;
            const clientJobsCount = jobs.filter((j) => j.cliente_id === client.id).length;

            return (
              <div
                key={client.id}
                onClick={() => {
                  setSelectedClient(client);
                  setClientDetailTab('info');
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                      {client.nome_fantasia?.charAt(0) || client.razao_social?.charAt(0) || 'C'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                        {client.cidade || 'SP'} - {client.estado || 'SP'}
                      </span>
                      {client.permitir_acesso && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/50">
                          Portal Ativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company Titles */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {client.nome_fantasia || client.razao_social}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {client.razao_social}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      CNPJ: {client.cnpj || 'Não informado'}
                    </p>
                  </div>

                  {/* Contacts Summary */}
                  {client.responsaveis && client.responsaveis.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        {client.responsaveis[0].nome} ({client.responsaveis[0].cargo})
                      </p>
                      {client.responsaveis[0].whatsapp && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          {client.responsaveis[0].whatsapp}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Counters & Actions */}
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
        /* Detailed View of Selected Client */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          {/* Header of Detailed Client */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Voltar para lista"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                {selectedClient.nome_fantasia?.charAt(0) || 'C'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedClient.nome_fantasia || selectedClient.razao_social}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200/50">
                    CNPJ: {selectedClient.cnpj}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedClient.razao_social} • {selectedClient.cidade}/{selectedClient.estado}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenNewAtaForClient(selectedClient)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                Criar Ata
              </button>
              <button
                onClick={() => onOpenNewJobForClient(selectedClient)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar Job
              </button>
              <button
                onClick={() => openEditClientModal(selectedClient)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Editar Cliente"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  if (confirm('Tem certeza que deseja excluir este cliente?')) {
                    await onDeleteCliente(selectedClient.id);
                    setSelectedClient(null);
                    showToast('info', 'Cliente Excluído');
                  }
                }}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Excluir Cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-menu Tabs for Selected Client */}
          <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
            <button
              onClick={() => setClientDetailTab('info')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                clientDetailTab === 'info'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Informações da Empresa
            </button>
            <button
              onClick={() => setClientDetailTab('atas')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                clientDetailTab === 'atas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Ata de Reuniões ({atas.filter((a) => a.cliente_id === selectedClient.id).length})
            </button>
            <button
              onClick={() => setClientDetailTab('jobs')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                clientDetailTab === 'jobs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-4 h-4" />
              Jobs ({jobs.filter((j) => j.cliente_id === selectedClient.id).length})
            </button>
            <button
              onClick={() => setClientDetailTab('arquivos')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                clientDetailTab === 'arquivos'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Folder className="w-4 h-4" />
              Arquivos & Mídia
            </button>
            <button
              onClick={() => setClientDetailTab('historico')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                clientDetailTab === 'historico'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
            <button
              onClick={() => setClientDetailTab('config')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                clientDetailTab === 'config'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configurações / Portal
            </button>
          </div>

          {/* Sub-menu Tab Content */}
          {clientDetailTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Main Company Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    Dados Cadastrais da Empresa
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Razão Social:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedClient.razao_social}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Nome Fantasia:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedClient.nome_fantasia}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">CNPJ:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedClient.cnpj}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Inscrição Estadual:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedClient.inscricao_estadual || 'ISENTA'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block font-medium">Endereço Completo:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        {selectedClient.logradouro}, {selectedClient.numero} - {selectedClient.bairro},{' '}
                        {selectedClient.cidade}/{selectedClient.estado} - CEP: {selectedClient.cep}
                      </span>
                    </div>
                    {selectedClient.cnae && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block font-medium">CNAE Principal:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {selectedClient.cnae}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social & Digital Presence */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Canais e Redes Sociais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedClient.site && (
                      <a
                        href={
                          selectedClient.site.startsWith('http')
                            ? selectedClient.site
                            : `https://${selectedClient.site}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        {selectedClient.site}
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    )}
                    {selectedClient.instagram && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        {selectedClient.instagram}
                      </div>
                    )}
                    {selectedClient.facebook && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                        <Facebook className="w-4 h-4 text-blue-600" />
                        {selectedClient.facebook}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Responsáveis Sidebar */}
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      Contatos Responsáveis
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                      {selectedClient.responsaveis?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedClient.responsaveis?.map((resp) => (
                      <div
                        key={resp.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                      >
                        <div className="font-bold text-slate-900 dark:text-slate-100">{resp.nome}</div>
                        <div className="text-slate-500 dark:text-slate-400 font-medium">{resp.cargo}</div>
                        {resp.email && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-1">
                            <Mail className="w-3 h-3 text-indigo-500" />
                            {resp.email}
                          </div>
                        )}
                        {resp.whatsapp && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            WhatsApp: {resp.whatsapp}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {clientDetailTab === 'atas' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Atas de Reunião com {selectedClient.nome_fantasia}
                </h4>
                <button
                  onClick={() => onOpenNewAtaForClient(selectedClient)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Ata
                </button>
              </div>

              {atas.filter((a) => a.cliente_id === selectedClient.id).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs">
                  Nenhuma ata de reunião cadastrada para este cliente ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {atas
                    .filter((a) => a.cliente_id === selectedClient.id)
                    .map((ata) => (
                      <div
                        key={ata.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            Reunião {ata.tipo_reuniao} • {new Date(ata.data_reuniao).toLocaleDateString('pt-BR')} às {ata.hora_reuniao}
                          </span>
                          <span className="text-slate-400 font-mono">Resp: {ata.responsavel}</span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{ata.objetivo}</p>
                        <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{ata.decisoes}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {clientDetailTab === 'jobs' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Jobs Vinculados a {selectedClient.nome_fantasia}
                </h4>
                <button
                  onClick={() => onOpenNewJobForClient(selectedClient)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Abrir Novo Job
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs
                  .filter((j) => j.cliente_id === selectedClient.id)
                  .map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                          {job.status}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          Entrega: {job.data_entrega || '-'}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                        {job.titulo_job}
                      </h5>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2">
                        {job.briefing || job.descricao}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {clientDetailTab === 'config' && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                Configurações de Acesso do Cliente ao Portal
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Permita que este cliente acesse exclusivamente os seus próprios Jobs para acompanhar o andamento, aprovar entregas, baixar arquivos e comentar.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Login de Acesso do Cliente
                  </label>
                  <input
                    type="text"
                    value={selectedClient.login_cliente || ''}
                    disabled
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-700 dark:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type="text"
                    value={selectedClient.senha_cliente || ''}
                    disabled
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastrar/Editar Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {editingClient ? 'Editar Empresa Cliente' : 'Cadastrar Nova Empresa Cliente'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* CNPJ Section with Auto Consult Button */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                    CNPJ para Consulta Automática
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    Preenche dados e endereço via API pública
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj || ''}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleConsultarCNPJ}
                    disabled={cnpjLoading}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 shrink-0"
                  >
                    {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                    Consultar CNPJ
                  </button>
                </div>
              </div>

              {/* Main Company Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    name="razao_social"
                    required
                    value={formData.razao_social || ''}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    name="nome_fantasia"
                    value={formData.nome_fantasia || ''}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    name="inscricao_estadual"
                    value={formData.inscricao_estadual || ''}
                    onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep || ''}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Endereço / Logradouro
                    </label>
                    <input
                      type="text"
                      name="logradouro"
                      value={formData.logradouro || ''}
                      onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero || ''}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro || ''}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade || ''}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      name="estado"
                      value={formData.estado || ''}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone || ''}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Site
                  </label>
                  <input
                    type="text"
                    name="site"
                    value={formData.site || ''}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              {/* Credenciais de Acesso do Cliente ao Portal */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    Credenciais de Acesso do Cliente ao Portal
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permitir_acesso ?? true}
                      onChange={(e) => setFormData({ ...formData, permitir_acesso: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Permitir acesso ao portal
                  </label>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Login do Cliente *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: bellavista ou email@cliente.com"
                      value={formData.login_cliente || ''}
                      onChange={(e) => setFormData({ ...formData, login_cliente: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Senha de Acesso *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: sothink2026"
                      value={formData.senha_cliente || ''}
                      onChange={(e) => setFormData({ ...formData, senha_cliente: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <p className="sm:col-span-2 text-[10px] text-slate-500 dark:text-slate-400">
                    Com este login e senha, o cliente terá acesso restrito exclusivamente para <strong>criar novos jobs e visualizar relatórios de desempenho criados para a empresa dele</strong>.
                  </p>
                </div>
              </div>

              {/* Responsáveis Section */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    Responsáveis da Empresa (Sem Limite)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddResponsavel}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 transition-colors"
                  >
                    + Adicionar Contato
                  </button>
                </div>

                {responsaveis.map((resp, idx) => (
                  <div
                    key={resp.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                        Contato #{idx + 1}
                      </span>
                      {responsaveis.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsavel(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={resp.nome}
                          onChange={(e) => handleUpdateResponsavel(idx, 'nome', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={resp.cargo}
                          onChange={(e) => handleUpdateResponsavel(idx, 'cargo', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          E-mail
                        </label>
                        <input
                          type="email"
                          value={resp.email}
                          onChange={(e) => handleUpdateResponsavel(idx, 'email', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          value={resp.whatsapp}
                          onChange={(e) => handleUpdateResponsavel(idx, 'whatsapp', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          Aniversário
                        </label>
                        <input
                          type="date"
                          value={resp.data_aniversario}
                          onChange={(e) => handleUpdateResponsavel(idx, 'data_aniversario', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
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
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
