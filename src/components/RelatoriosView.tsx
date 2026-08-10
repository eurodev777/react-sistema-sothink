import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Edit,
  Trash2,
  Calendar,
  X,
  Eye,
  Layers,
  Loader2
} from 'lucide-react';
import { Relatorio, EmpresaCliente } from '../types';

interface RelatoriosViewProps {
  clientes: EmpresaCliente[];
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  isClientView?: boolean;
}

// Funções auxiliares para lidar com a conversão das datas
const formatDateToBR = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const parseDateFromBR = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return '';
};

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  clientes,
  showToast,
  isClientView = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClienteFilter, setSelectedClienteFilter] = useState('');
  
  // Modais e Estados de UI
  const [activeReport, setActiveReport] = useState<Relatorio | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Estados de API
  const [localRelatorios, setLocalRelatorios] = useState<Relatorio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state geral
  const [formData, setFormData] = useState<Partial<Relatorio>>({});
  
  // Estados separados para Período e Campanhas
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  const [campanhasList, setCampanhasList] = useState<string[]>([]);
  const [campanhaInput, setCampanhaInput] = useState('');

  // ==========================================
  // BUSCAR DADOS (API)
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://sothink.com.br/app/api/listar?tabela=relatorios_performance");
      const data = await res.json();

      const formatados = Array.isArray(data) ? data.map((rel: any) => {
        const cli = clientes.find(c => String(c.id) === String(rel.cliente_id));
        return {
          ...rel,
          cliente_nome: cli ? (cli.nome_fantasia || cli.razao_social) : 'Cliente Removido',
          campanhas: rel.campanhas ? JSON.parse(rel.campanhas) : [],
        };
      }) : [];

      setLocalRelatorios(formatados);
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
      showToast('error', 'Erro de conexão', 'Falha ao carregar os relatórios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientes]);

  // ==========================================
  // FILTRAGEM
  // ==========================================
  const filteredRelatorios = localRelatorios.filter((r) => {
    const matchesSearch =
      r.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.periodo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClienteFilter ? r.cliente_id === selectedClienteFilter : true;
    return matchesSearch && matchesClient;
  });

  // ==========================================
  // FUNÇÕES DO MODAL
  // ==========================================
  const openNewModal = () => {
    setFormData({
      cliente_id: clientes[0]?.id || '',
      cliente_nome: clientes[0]?.nome_fantasia || clientes[0]?.razao_social || 'Cliente Sothink',
      titulo: 'Relatório Mensal de Performance - Tráfego Pago',
      investimento: '7.612,05',
      alcance: '802.296',
      total_conversas: '481',
      custo_por_conversa: '15,80',
      observacoes: 'Campanhas ativas com foco em conversões e engajamento comercial.',
    });
    
    // Zera os campos customizados
    setPeriodoInicio('');
    setPeriodoFim('');
    setCampanhasList([]);
    setCampanhaInput('');
    setEditModalOpen(true);
  };

  const openEditModal = (rel: Relatorio) => {
    setFormData({ ...rel });
    
    // Tenta desmembrar o período para colocar nos inputs de data
    const parts = (rel.periodo || '').split(' a ');
    if (parts.length === 2) {
      setPeriodoInicio(parseDateFromBR(parts[0]));
      setPeriodoFim(parseDateFromBR(parts[1]));
    } else {
      setPeriodoInicio('');
      setPeriodoFim('');
    }

    setCampanhasList(Array.isArray(rel.campanhas) ? rel.campanhas : []);
    setCampanhaInput('');
    setEditModalOpen(true);
  };

  const openViewModal = (rel: Relatorio) => {
    setActiveReport(rel);
    setViewModalOpen(true);
  };

  const handleSelectClientChange = (clienteId: string) => {
    const found = clientes.find((c) => c.id === clienteId);
    setFormData((prev) => ({
      ...prev,
      cliente_id: clienteId,
      cliente_nome: found ? found.nome_fantasia || found.razao_social : prev.cliente_nome,
    }));
  };

  // ==========================================
  // MANIPULAR CAMPANHAS
  // ==========================================
  const handleAddCampanha = () => {
    if (campanhaInput.trim()) {
      setCampanhasList([...campanhasList, campanhaInput.trim()]);
      setCampanhaInput('');
    }
  };

  const handleRemoveCampanha = (index: number) => {
    setCampanhasList(campanhasList.filter((_, i) => i !== index));
  };

  // ==========================================
  // SALVAR NA API
  // ==========================================
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id || !periodoInicio || !periodoFim) {
      showToast('error', 'Campos Obrigatórios', 'Selecione o cliente e as datas inicial e final.');
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("tabela", "relatorios_performance");
      if (formData.id) form.append("id", formData.id);

      form.append("cliente_id", formData.cliente_id || "");
      form.append("titulo", formData.titulo || "");
      
      // Junta as duas datas em uma única string (ex: "01/01/2026 a 31/01/2026")
      const periodoFinal = `${formatDateToBR(periodoInicio)} a ${formatDateToBR(periodoFim)}`;
      form.append("periodo", periodoFinal);
      
      form.append("investimento", formData.investimento || "");
      form.append("alcance", formData.alcance || "");
      form.append("total_conversas", formData.total_conversas || "");
      form.append("custo_por_conversa", formData.custo_por_conversa || "");
      form.append("observacoes", formData.observacoes || "");
      
      // Envia o Array de Campanhas como JSON String
      form.append("campanhas", JSON.stringify(campanhasList));

      const url = formData.id
        ? "https://sothink.com.br/app/api/editar"
        : "https://sothink.com.br/app/api/inserir";

      const res = await fetch(url, { method: "POST", body: form });
      const data = await res.json();

      if (data.sucesso) {
        showToast('success', formData.id ? 'Relatório Atualizado!' : 'Relatório Criado!');
        setEditModalOpen(false);
        fetchData();
      } else {
        throw new Error(data.erro || "Falha na comunicação com o banco.");
      }
    } catch (err: any) {
      showToast('error', 'Erro ao salvar relatório', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // DELETAR NA API
  // ==========================================
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
      try {
        const res = await fetch(`https://sothink.com.br/app/api/deletar?id=${id}&tabela=relatorios_performance`);
        const data = await res.json();
        
        if (data.sucesso) {
          showToast('info', 'Relatório removido com sucesso.');
          fetchData();
        } else {
          throw new Error(data.erro);
        }
      } catch (err: any) {
        showToast('error', 'Erro ao excluir relatório', err.message);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Relatórios de Performance
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/50">
              {filteredRelatorios.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Métricas de tráfego pago, alcance, investimento e custo por conversa
          </p>
        </div>

        {!isClientView && (
          <button onClick={openNewModal} className="btn-primary flex items-center gap-2 shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
            <Plus className="w-4 h-4" />
            + Novo Relatório
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, título ou período..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {!isClientView && clientes.length > 0 && (
          <div className="w-full sm:w-64">
            <select
              value={selectedClienteFilter}
              onChange={(e) => setSelectedClienteFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos os Clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_fantasia || c.razao_social}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 no-print">
          {filteredRelatorios.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Nenhum relatório encontrado.
              </p>
              {!isClientView && (
                <p className="text-xs">
                  Clique em <strong>"+ Novo Relatório"</strong> para gerar um relatório de tráfego.
                </p>
              )}
            </div>
          ) : (
            filteredRelatorios.map((rel) => (
              <div
                key={rel.id}
                onClick={() => openViewModal(rel)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-200/40">
                      {rel.cliente_nome}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {rel.periodo}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {rel.titulo}
                  </h3>

                  {rel.campanhas && rel.campanhas.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Campanhas:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {rel.campanhas.map((camp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {camp.startsWith('-') ? camp : `- ${camp}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] text-slate-400 font-medium block">Investimento</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        R$ {rel.investimento}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] text-slate-400 font-medium block">Alcance</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {rel.alcance}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] text-slate-400 font-medium block">Total Conversas</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {rel.total_conversas}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] text-slate-400 font-medium block">Custo/Conversa</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        R$ {rel.custo_por_conversa}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Visualizar & Imprimir
                  </span>

                  {!isClientView && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(rel);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar Relatório"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(rel.id!, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir Relatório"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit / Create Relatório Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {formData.id ? 'Editar Relatório de Performance' : 'Criar Novo Relatório'}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cliente *
                  </label>
                  {clientes.length > 0 ? (
                    <select
                      value={formData.cliente_id || ''}
                      onChange={(e) => handleSelectClientChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Selecione...</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome_fantasia || c.razao_social}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="Nenhum cliente cadastrado"
                      className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                    />
                  )}
                </div>

                <div className="sm:col-span-2 grid grid-cols-2 gap-3 border border-slate-200 dark:border-slate-700 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">
                      Data Inicial *
                    </label>
                    <input
                      type="date"
                      required
                      value={periodoInicio}
                      onChange={(e) => setPeriodoInicio(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10px]">
                      Data Final *
                    </label>
                    <input
                      type="date"
                      required
                      value={periodoFim}
                      onChange={(e) => setPeriodoFim(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Relatório *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Relatório de Desempenho - Tráfego Pago"
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Seção de Campanhas Dinâmica */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Campanhas (Adicione uma por uma)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={campanhaInput}
                    onChange={(e) => setCampanhaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCampanha();
                      }
                    }}
                    placeholder="Nome da campanha... (Aperte Enter)"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCampanha}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                </div>

                {campanhasList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {campanhasList.map((campanha, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white font-semibold text-[10px] rounded-lg shadow-sm"
                      >
                        {campanha}
                        <button
                          type="button"
                          onClick={() => handleRemoveCampanha(index)}
                          className="p-0.5 hover:bg-blue-700 rounded-md transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Investimento (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 7.612,05"
                    value={formData.investimento || ''}
                    onChange={(e) => setFormData({ ...formData, investimento: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alcance
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 802.296"
                    value={formData.alcance || ''}
                    onChange={(e) => setFormData({ ...formData, alcance: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total de Conversas
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 481"
                    value={formData.total_conversas || ''}
                    onChange={(e) => setFormData({ ...formData, total_conversas: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 text-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custo por Conversa (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 15,80"
                    value={formData.custo_por_conversa || ''}
                    onChange={(e) => setFormData({ ...formData, custo_por_conversa: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 text-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Análise / Observações da Agência
                </label>
                <textarea
                  rows={3}
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Anotações estratégicas sobre os resultados..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Relatório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print Modal */}
      {viewModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 text-slate-900 dark:text-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                  S
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Visualização do Relatório
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sothink Marketing OS — Pronto para Impressão e PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Baixar PDF
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-report" className="space-y-6 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between border-b-2 border-slate-800 dark:border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Agência Sothink
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Relatório Executivo de Tráfego Pago & Performance
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block">
                    {activeReport.cliente_nome}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Período: {activeReport.periodo}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {activeReport.titulo}
                </h2>
              </div>

              {activeReport.campanhas && activeReport.campanhas.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Campanhas Veiculadas
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {activeReport.campanhas.map((camp, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span>{camp.startsWith('-') ? camp.substring(1).trim() : camp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                    Investimento
                  </span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    R$ {activeReport.investimento}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Alcance
                  </span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {activeReport.alcance}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Total Conversas
                  </span>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {activeReport.total_conversas}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                    Média Custo / Conversa
                  </span>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                    R$ {activeReport.custo_por_conversa}
                  </p>
                </div>
              </div>

              {activeReport.observacoes && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-white">
                    Análise Estratégica & Considerações da Agência
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeReport.observacoes}
                  </p>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Relatório Gerado por Agência Sothink OS</span>
                <span>Data de Emissão: {activeReport.created_at ? new Date(activeReport.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};