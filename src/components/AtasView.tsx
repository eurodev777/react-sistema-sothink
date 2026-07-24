import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Trash2,
  X,
  Printer,
  Download,
  Paperclip,
  Building2,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AtaReuniao, EmpresaCliente, AcaoAta, Anexo } from '../types';

interface AtasViewProps {
  atas: AtaReuniao[];
  clientes: EmpresaCliente[];
  onSaveAta: (ataData: Partial<AtaReuniao>) => Promise<void>;
  onDeleteAta: (id: string) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  preSelectedClient?: EmpresaCliente | null;
}

export const AtasView: React.FC<AtasViewProps> = ({
  atas,
  clientes,
  onSaveAta,
  onDeleteAta,
  showToast,
  preSelectedClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewAtaModal, setViewAtaModal] = useState<AtaReuniao | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<AtaReuniao>>({
    cliente_id: preSelectedClient?.id || (clientes[0]?.id || ''),
    cliente_nome: preSelectedClient?.nome_fantasia || (clientes[0]?.nome_fantasia || ''),
    data_reuniao: new Date().toISOString().split('T')[0],
    hora_reuniao: '10:00',
    local_reuniao: 'Google Meet (Online)',
    tipo_reuniao: 'Online',
    responsavel: 'Carlos Eduardo (Sothink)',
    participantes: [],
    objetivo: '',
    assuntos_discutidos: '',
    decisoes: '',
    pendencias: '',
    proximos_passos: '',
    observacoes: '',
    acoes: [],
    anexos: [],
  });

  const [externalParticipantInput, setExternalParticipantInput] = useState('');
  const [acoes, setAcoes] = useState<AcaoAta[]>([]);

  const filteredAtas = atas.filter((a) => {
    const matchesSearch =
      a.objetivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.responsavel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = filterClientId === 'all' || a.cliente_id === filterClientId;

    return matchesSearch && matchesClient;
  });

  const openNewAtaModal = () => {
    const defaultClient = preSelectedClient || clientes[0];
    setFormData({
      cliente_id: defaultClient?.id || '',
      cliente_nome: defaultClient?.nome_fantasia || defaultClient?.razao_social || '',
      data_reuniao: new Date().toISOString().split('T')[0],
      hora_reuniao: '10:00',
      local_reuniao: 'Google Meet (Online)',
      tipo_reuniao: 'Online',
      responsavel: 'Carlos Eduardo (Sothink)',
      participantes: defaultClient?.responsaveis?.[0]?.nome
        ? [`${defaultClient.responsaveis[0].nome} (${defaultClient.nome_fantasia})`]
        : [],
      objetivo: '',
      assuntos_discutidos: '',
      decisoes: '',
      pendencias: '',
      proximos_passos: '',
      observacoes: '',
      acoes: [],
      anexos: [],
    });
    setAcoes([
      {
        id: `a-${Date.now()}`,
        tarefa: '',
        responsavel: 'Mariana Costa',
        prazo: new Date().toISOString().split('T')[0],
        status: 'Pendente',
      },
    ]);
    setModalOpen(true);
  };

  const selectedCompany = clientes.find((c) => c.id === formData.cliente_id);

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
    handleToggleParticipant(`${externalParticipantInput.trim()} (Visitante)`);
    setExternalParticipantInput('');
  };

  const handleAddAcao = () => {
    setAcoes((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        tarefa: '',
        responsavel: 'Colaborador Sothink',
        prazo: new Date().toISOString().split('T')[0],
        status: 'Pendente',
      },
    ]);
  };

  const handleUpdateAcao = (index: number, field: keyof AcaoAta, value: any) => {
    setAcoes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveAcao = (index: number) => {
    setAcoes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.objetivo) {
      showToast('error', 'Objetivo é obrigatório', 'Preencha o objetivo da reunião.');
      return;
    }

    try {
      const comp = clientes.find((c) => c.id === formData.cliente_id);
      const payload: Partial<AtaReuniao> = {
        ...formData,
        cliente_nome: comp?.nome_fantasia || comp?.razao_social || formData.cliente_nome,
        acoes: acoes.filter((a) => a.tarefa.trim().length > 0),
      };

      await onSaveAta(payload);
      setModalOpen(false);
      showToast('success', 'Ata de Reunião Criada!', 'Documento gerado com sucesso.');
    } catch (err: any) {
      showToast('error', 'Erro ao salvar ata', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Atas de Reunião
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro detalhado de alinhamentos estratégicos, participantes e plano de ação.
          </p>
        </div>

        <button
          onClick={openNewAtaModal}
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
            placeholder="Buscar por objetivo, decisões, cliente ou responsável..."
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAtas.map((ata) => (
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
                  {new Date(ata.data_reuniao).toLocaleDateString('pt-BR')} • {ata.hora_reuniao}
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
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {ata.acoes?.length || 0} ações de acompanhamento
              </span>

              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                Visualizar <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Ata de Reunião */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Gerar Nova Ata de Reunião
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Meeting Basic Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa Cliente *
                  </label>
                  <select
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={(e) => {
                      const comp = clientes.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        cliente_id: e.target.value,
                        cliente_nome: comp?.nome_fantasia || comp?.razao_social || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome_fantasia || c.razao_social} ({c.cnpj})
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
                    name="data_reuniao"
                    value={formData.data_reuniao}
                    onChange={(e) => setFormData({ ...formData, data_reuniao: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    name="hora_reuniao"
                    value={formData.hora_reuniao}
                    onChange={(e) => setFormData({ ...formData, hora_reuniao: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Reunião
                  </label>
                  <select
                    name="tipo_reuniao"
                    value={formData.tipo_reuniao}
                    onChange={(e) => setFormData({ ...formData, tipo_reuniao: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Online">Online (Meet/Teams)</option>
                    <option value="Presencial">Presencial (Sede/Cliente)</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Local / Link
                  </label>
                  <input
                    type="text"
                    name="local_reuniao"
                    value={formData.local_reuniao}
                    onChange={(e) => setFormData({ ...formData, local_reuniao: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável Sothink
                  </label>
                  <input
                    type="text"
                    name="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Participantes Picker */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Participantes Selecionados
                </label>

                {selectedCompany?.responsaveis && selectedCompany.responsaveis.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedCompany.responsaveis.map((resp) => {
                      const tag = `${resp.nome} (${selectedCompany.nome_fantasia})`;
                      const selected = (formData.participantes || []).includes(tag);

                      return (
                        <button
                          key={resp.id}
                          type="button"
                          onClick={() => handleToggleParticipant(tag)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {selected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          {resp.nome} ({resp.cargo})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Add External Participant */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={externalParticipantInput}
                    onChange={(e) => setExternalParticipantInput(e.target.value)}
                    placeholder="Adicionar participante externo (ex: Dr. Fernando - Consultor)"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
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

              {/* Meeting Content Fields */}
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
                    onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                    placeholder="Ex: Alinhamento das campanhas de Tráfego Pago para Q3"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assuntos Discutidos
                  </label>
                  <textarea
                    name="assuntos_discutidos"
                    rows={3}
                    value={formData.assuntos_discutidos}
                    onChange={(e) => setFormData({ ...formData, assuntos_discutidos: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Decisões Tomadas
                  </label>
                  <textarea
                    name="decisoes"
                    rows={3}
                    value={formData.decisoes}
                    onChange={(e) => setFormData({ ...formData, decisoes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pendências
                  </label>
                  <textarea
                    name="pendencias"
                    rows={2}
                    value={formData.pendencias}
                    onChange={(e) => setFormData({ ...formData, pendencias: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Próximos Passos & Observações
                  </label>
                  <textarea
                    name="proximos_passos"
                    rows={2}
                    value={formData.proximos_passos}
                    onChange={(e) => setFormData({ ...formData, proximos_passos: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Action Items Table */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                    Tabela de Plano de Ação (Tarefas Derivadas)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddAcao}
                    className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg"
                  >
                    + Adicionar Tarefa
                  </button>
                </div>

                {acoes.map((ac, idx) => (
                  <div
                    key={ac.id || idx}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <input
                      type="text"
                      placeholder="Descrição da Tarefa"
                      value={ac.tarefa}
                      onChange={(e) => handleUpdateAcao(idx, 'tarefa', e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Responsável"
                      value={ac.responsavel}
                      onChange={(e) => handleUpdateAcao(idx, 'responsavel', e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                    <input
                      type="date"
                      value={ac.prazo}
                      onChange={(e) => handleUpdateAcao(idx, 'prazo', e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={ac.status}
                        onChange={(e) => handleUpdateAcao(idx, 'status', e.target.value as any)}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveAcao(idx)}
                        className="text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                  Salvar e Gerar Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Printable Ata Modal */}
      {viewAtaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 print:p-0 print:border-none">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Ata de Reunião Oficial • Agência Sothink
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

            {/* Printable Document Body */}
            <div className="space-y-6 text-slate-800 dark:text-slate-200 text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white">
                    ATA DE REUNIÃO DE ALINHAMENTO
                  </h1>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    SOTHINK AGÊNCIA DE MARKETING
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {viewAtaModal.cliente_nome}
                  </div>
                  <div className="text-slate-500">
                    {new Date(viewAtaModal.data_reuniao).toLocaleDateString('pt-BR')} às {viewAtaModal.hora_reuniao}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold block text-slate-500">Local / Canal:</span>
                  <span>{viewAtaModal.local_reuniao} ({viewAtaModal.tipo_reuniao})</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">Responsável:</span>
                  <span>{viewAtaModal.responsavel}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold block text-slate-500">Participantes:</span>
                  <span>{viewAtaModal.participantes?.join(', ') || 'Equipe'}</span>
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

              {viewAtaModal.acoes && viewAtaModal.acoes.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                    4. Tabela de Plano de Ação
                  </h4>
                  <table className="w-full text-left border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-2.5">Tarefa</th>
                        <th className="p-2.5">Responsável</th>
                        <th className="p-2.5">Prazo</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {viewAtaModal.acoes.map((ac) => (
                        <tr key={ac.id}>
                          <td className="p-2.5 font-semibold">{ac.tarefa}</td>
                          <td className="p-2.5">{ac.responsavel}</td>
                          <td className="p-2.5 font-mono">{ac.prazo}</td>
                          <td className="p-2.5 font-bold text-indigo-600">{ac.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
