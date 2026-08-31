import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Eye, FileText, Layers, Loader2, Printer, X } from 'lucide-react';
import { EmpresaCliente } from '../types';

interface ClientRelatoriosViewProps {
  client: EmpresaCliente;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

interface ClientRelatorio {
  id: string;
  cliente_id: string;
  titulo?: string;
  periodo?: string;
  campanhas?: string[] | string;
  investimento?: string;
  alcance?: string;
  total_conversas?: string;
  custo_por_conversa?: string;
  observacoes?: string;
  created_at?: string;
}

const API_BASE = 'https://sothink.com.br/app/api';

const parseCampanhas = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const ClientRelatoriosView: React.FC<ClientRelatoriosViewProps> = ({ client, showToast }) => {
  const [relatorios, setRelatorios] = useState<ClientRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ClientRelatorio | null>(null);

  const fetchRelatorios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/listar?tabela=relatorios_performance`);
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map((item: any) => ({ ...item, campanhas: parseCampanhas(item.campanhas) }))
        : [];
      setRelatorios(normalized);
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao carregar relatórios', 'Não foi possível carregar seus relatórios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatorios();
  }, [client.id]);

  const clientRelatorios = useMemo(
    () => relatorios.filter((rel) => String(rel.cliente_id) === String(client.id)),
    [relatorios, client.id]
  );

  if (loading) {
    return <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" /> Relatórios de Performance ({clientRelatorios.length})
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">Relatórios disponibilizados pela agência para sua empresa.</p>
      </div>

      {clientRelatorios.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs space-y-3">
          <FileText className="w-9 h-9 mx-auto text-slate-600" />
          <p className="font-bold text-slate-300 text-sm">Nenhum relatório disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clientRelatorios.map((rel) => {
            const campanhas = parseCampanhas(rel.campanhas);
            return (
              <button
                type="button"
                key={rel.id}
                onClick={() => setActiveReport(rel)}
                className="text-left bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg hover:border-blue-500 transition-all space-y-4 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800">
                    Performance
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {rel.periodo || '-'}</span>
                </div>

                <h4 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">{rel.titulo || 'Relatório'}</h4>

                {campanhas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {campanhas.slice(0, 3).map((camp, index) => (
                      <span key={`${camp}-${index}`} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">{camp}</span>
                    ))}
                    {campanhas.length > 3 && <span className="text-[10px] text-slate-500">+{campanhas.length - 3}</span>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <Metric label="Investimento" value={`R$ ${rel.investimento || '-'}`} />
                  <Metric label="Alcance" value={rel.alcance || '-'} />
                  <Metric label="Conversas" value={rel.total_conversas || '-'} />
                  <Metric label="Custo/Conversa" value={`R$ ${rel.custo_por_conversa || '-'}`} />
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs font-bold text-blue-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Visualizar & Imprimir</div>
              </button>
            );
          })}
        </div>
      )}

      {activeReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div>
                <h3 className="font-extrabold text-sm">Visualização do Relatório</h3>
                <p className="text-[11px] text-slate-400">Sothink Marketing OS — Pronto para Impressão e PDF</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Imprimir / PDF
                </button>
                <button onClick={() => setActiveReport(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="space-y-6 p-4 sm:p-6 rounded-2xl border border-slate-100">
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 gap-4">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight">Agência Sothink</h1>
                  <p className="text-xs font-semibold text-slate-500">Relatório Executivo de Tráfego Pago & Performance</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-blue-600 block">{client.nome_fantasia || client.razao_social}</span>
                  <span className="text-[11px] font-bold text-slate-500">Período: {activeReport.periodo || '-'}</span>
                </div>
              </div>

              <h2 className="text-xl font-extrabold">{activeReport.titulo}</h2>

              {parseCampanhas(activeReport.campanhas).length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> Campanhas Veiculadas</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-semibold">
                    {parseCampanhas(activeReport.campanhas).map((camp, index) => <li key={`${camp}-${index}`} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> {camp}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <PrintMetric label="Investimento" value={`R$ ${activeReport.investimento || '-'}`} />
                <PrintMetric label="Alcance" value={activeReport.alcance || '-'} />
                <PrintMetric label="Total Conversas" value={activeReport.total_conversas || '-'} />
                <PrintMetric label="Custo / Conversa" value={`R$ ${activeReport.custo_por_conversa || '-'}`} />
              </div>

              {activeReport.observacoes && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <h4 className="font-extrabold mb-1.5">Análise Estratégica & Considerações da Agência</h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{activeReport.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
    <span className="text-[9px] text-slate-500 font-bold block">{label}</span>
    <span className="font-extrabold text-slate-100 text-xs">{value}</span>
  </div>
);

const PrintMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">{label}</span>
    <p className="text-base font-black">{value}</p>
  </div>
);
