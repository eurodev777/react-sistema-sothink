import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Eye, FileText, Loader2, MapPin, Printer, X } from 'lucide-react';
import { EmpresaCliente } from '../types';

interface ClientAtasViewProps {
  client: EmpresaCliente;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

interface ClientAta {
  id: string;
  cliente_id: string;
  data_reuniao?: string;
  hora_reuniao?: string;
  local_reuniao?: string;
  tipo_reuniao?: string;
  responsavel?: string;
  participantes_externos?: string | string[];
  objetivo?: string;
  assuntos?: string;
  decisoes?: string;
  pendencias?: string;
  proximos_passos?: string;
  observacoes?: string;
}

const API_BASE = 'https://sothink.com.br/app/api';

const formatDateSafe = (date?: string) => {
  if (!date || date === '0000-00-00') return '-';
  const safe = date.includes('T') ? date : `${date}T12:00:00`;
  const parsed = new Date(safe);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('pt-BR');
};

const parseParticipants = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.trim() ? [value] : [];
  }
};

export const ClientAtasView: React.FC<ClientAtasViewProps> = ({ client, showToast }) => {
  const [atas, setAtas] = useState<ClientAta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAta, setActiveAta] = useState<ClientAta | null>(null);

  const fetchAtas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/listar?tabela=atas_reuniao`);
      const data = await res.json();
      setAtas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao carregar atas', 'Não foi possível carregar as atas de reunião.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtas();
  }, [client.id]);

  const clientAtas = useMemo(
    () => atas.filter((ata) => String(ata.cliente_id) === String(client.id)),
    [atas, client.id]
  );

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-400" /> Atas de Reunião ({clientAtas.length})
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">Consulta das atas registradas pela agência para sua empresa.</p>
      </div>

      {clientAtas.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs space-y-3">
          <FileText className="w-9 h-9 mx-auto text-slate-600" />
          <p className="font-bold text-slate-300 text-sm">Nenhuma ata disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clientAtas.map((ata) => (
            <button
              type="button"
              key={ata.id}
              onClick={() => setActiveAta(ata)}
              className="text-left bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg hover:border-blue-500 transition-all space-y-4 group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800">
                  {ata.tipo_reuniao || 'Reunião'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{formatDateSafe(ata.data_reuniao)}</span>
              </div>

              <div>
                <h4 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-2">
                  {ata.objetivo || 'Ata de reunião'}
                </h4>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{ata.assuntos || 'Sem assuntos registrados.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ata.hora_reuniao || '-'}</span>
                <span className="font-bold text-blue-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Visualizar</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeAta && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 no-print">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-blue-600">Agência Sothink</p>
                <h3 className="text-xl font-black mt-1">Ata de Reunião</h3>
                <p className="text-xs text-slate-500 mt-1">{client.nome_fantasia || client.razao_social}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Imprimir / PDF
                </button>
                <button onClick={() => setActiveAta(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Info label="Data" value={formatDateSafe(activeAta.data_reuniao)} />
              <Info label="Hora" value={activeAta.hora_reuniao || '-'} />
              <Info label="Tipo" value={activeAta.tipo_reuniao || '-'} />
              <Info label="Responsável" value={activeAta.responsavel || '-'} />
            </div>

            {activeAta.local_reuniao && (
              <div className="flex items-center gap-2 text-xs text-slate-600"><MapPin className="w-4 h-4 text-blue-600" /> {activeAta.local_reuniao}</div>
            )}

            <Section number="1" title="Objetivo" text={activeAta.objetivo} />
            <Section number="2" title="Assuntos Discutidos" text={activeAta.assuntos} />
            <Section number="3" title="Decisões" text={activeAta.decisoes} />
            <Section number="4" title="Pendências" text={activeAta.pendencias} />
            <Section number="5" title="Próximos Passos" text={activeAta.proximos_passos} />
            {activeAta.observacoes && <Section number="6" title="Observações" text={activeAta.observacoes} />}

            {parseParticipants(activeAta.participantes_externos).length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 mb-2">Participantes</h4>
                <div className="flex flex-wrap gap-2">
                  {parseParticipants(activeAta.participantes_externos).map((participant, index) => (
                    <span key={`${participant}-${index}`} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold">{participant}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
    <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</span>
    <span className="font-bold text-slate-800">{value}</span>
  </div>
);

const Section: React.FC<{ number: string; title: string; text?: string }> = ({ number, title, text }) => (
  <div className="space-y-2">
    <h4 className="font-black text-sm flex items-center gap-2">
      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px]">{number}</span>
      {title}
    </h4>
    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line pl-8">{text || 'Não informado.'}</p>
  </div>
);
