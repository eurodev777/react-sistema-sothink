import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  DollarSign,
  Globe,
  LayoutGrid,
  Loader2,
  Users,
} from 'lucide-react';
import { EmpresaCliente } from '../types';

interface ClientDashboardTrafegoProps {
  client: EmpresaCliente;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

type DashboardView = 'menu' | 'geral' | 'sites' | 'custos' | 'leads';

type GenericRow = Record<string, any>;

interface ClientLeadCheck {
  id?: number;
  lead_agencia_id: number;
  cliente_id: string;
  [key: string]: any;
}

interface ClientLeadRow extends GenericRow {
  id: number;
  cliente_check?: ClientLeadCheck;
}

const API_BASE = 'https://sothink.com.br/app/api';

const normalizeCompany = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const companyBelongsToClient = (empresa: string, client: EmpresaCliente) => {
  const row = normalizeCompany(empresa);
  if (!row) return false;

  const candidates = [client.nome_fantasia, client.razao_social]
    .map(normalizeCompany)
    .filter(Boolean);

  if (candidates.some((name) => row === name)) return true;

  // Fallback para nomes abreviados usados nas planilhas (ex.: “D2R Laser”).
  // Evita usar isso quando a linha possui “filial” mas o cliente não possui.
  return candidates.some((name) => {
    if ((row.includes(' filial') || row.endsWith('filial')) && !name.includes('filial')) return false;
    const rowTokens = row.split(' ').filter((token) => token.length >= 2);
    const nameTokens = name.split(' ').filter((token) => token.length >= 2);
    const shorter = rowTokens.length <= nameTokens.length ? rowTokens : nameTokens;
    const longer = rowTokens.length <= nameTokens.length ? nameTokens : rowTokens;
    if (shorter.length < 2) return false;
    const matches = shorter.filter((token) => longer.includes(token)).length;
    return matches / shorter.length >= 0.8;
  });
};

const safeValue = (value: any) => {
  if (value === null || value === undefined || value === 'null') return '';
  return String(value);
};

const numberFromBR = (value: any) => {
  const str = safeValue(value).trim();
  if (!str || str.toUpperCase() === 'X') return 0;
  const normalized = str.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sumDays = (row: GenericRow) => {
  let total = 0;
  for (let day = 1; day <= 31; day++) total += numberFromBR(row[`d${day}`]);
  return total;
};

const formatMoney = (value: any) => {
  const str = safeValue(value);
  return str ? `R$ ${str}` : '-';
};

export const ClientDashboardTrafego: React.FC<ClientDashboardTrafegoProps> = ({
  client,
  showToast,
}) => {
  const [activeView, setActiveView] = useState<DashboardView>('menu');
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [savingLead, setSavingLead] = useState<string | null>(null);

  const [campanhas, setCampanhas] = useState<GenericRow[]>([]);
  const [sites, setSites] = useState<GenericRow[]>([]);
  const [custos, setCustos] = useState<GenericRow[]>([]);
  const [leads, setLeads] = useState<ClientLeadRow[]>([]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [resCampanhas, resSites, resCustos, resLeads] = await Promise.all([
        fetch(`${API_BASE}/trafego?action=read`),
        fetch(`${API_BASE}/api_sites?action=read&mes_ano=${encodeURIComponent(mesAno)}`),
        fetch(`${API_BASE}/api_diario?tipo=custos&action=read&mes_ano=${encodeURIComponent(mesAno)}`),
        fetch(
          `${API_BASE}/api_diario?tipo=leads&action=read_client&mes_ano=${encodeURIComponent(
            mesAno
          )}&cliente_id=${encodeURIComponent(String(client.id))}`
        ),
      ]);

      const [dataCampanhas, dataSites, dataCustos, dataLeads] = await Promise.all([
        resCampanhas.json(),
        resSites.json(),
        resCustos.json(),
        resLeads.json(),
      ]);

      setCampanhas(Array.isArray(dataCampanhas) ? dataCampanhas : []);
      setSites(Array.isArray(dataSites) ? dataSites : []);
      setCustos(Array.isArray(dataCustos) ? dataCustos : []);

      if (Array.isArray(dataLeads)) {
        setLeads(dataLeads);
      } else if (dataLeads?.erro) {
        throw new Error(dataLeads.erro);
      } else {
        setLeads([]);
      }
    } catch (err: any) {
      console.error(err);
      showToast(
        'error',
        'Erro ao carregar dashboard',
        err?.message || 'Não foi possível carregar os dados do cliente.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [mesAno, client.id]);

  const clientCampaigns = useMemo(
    () => campanhas.filter((row) => companyBelongsToClient(row.empresa, client)),
    [campanhas, client]
  );
  const clientSites = useMemo(
    () => sites.filter((row) => companyBelongsToClient(row.empresa, client)),
    [sites, client]
  );
  const clientCosts = useMemo(
    () => custos.filter((row) => companyBelongsToClient(row.empresa, client)),
    [custos, client]
  );
  const clientLeads = useMemo(
    () => leads.filter((row) => !row.empresa || companyBelongsToClient(row.empresa, client)),
    [leads, client]
  );

  const updateClientLeadLocal = (leadId: number, day: number, value: string) => {
    setLeads((prev) =>
      prev.map((row) => {
        if (Number(row.id) !== Number(leadId)) return row;
        const currentCheck = row.cliente_check || {
          lead_agencia_id: leadId,
          cliente_id: String(client.id),
        };
        return {
          ...row,
          cliente_check: {
            ...currentCheck,
            [`d${day}`]: value,
          },
        };
      })
    );
  };

  const saveClientLead = async (leadId: number, day: number, value: string) => {
    const saveKey = `${leadId}-${day}`;
    setSavingLead(saveKey);
    try {
      const form = new FormData();
      form.append('action', 'update_client_lead');
      form.append('tipo', 'leads');
      form.append('cliente_id', String(client.id));
      form.append('lead_agencia_id', String(leadId));
      form.append('dia', String(day));
      form.append('valor', value);

      const response = await fetch(`${API_BASE}/api_diario`, {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!data?.sucesso) throw new Error(data?.erro || 'Falha ao salvar a conferência do cliente.');
    } catch (err: any) {
      showToast('error', 'Erro ao salvar lead', err?.message || 'Não foi possível salvar.');
    } finally {
      setSavingLead(null);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (activeView === 'menu') {
    const cards = [
      {
        id: 'sites' as const,
        title: 'Controle de Sites',
        desc: 'Acompanhe a validação diária dos seus sites.',
        icon: Globe,
        iconClass: 'text-sky-400',
      },
      {
        id: 'geral' as const,
        title: 'Controle Geral de Verbas',
        desc: 'Consulte campanhas, verbas, orçamento e disponibilidade.',
        icon: LayoutGrid,
        iconClass: 'text-indigo-400',
      },
      {
        id: 'custos' as const,
        title: 'Custo por Resultado',
        desc: 'Consulte os custos diários registrados pela agência.',
        icon: DollarSign,
        iconClass: 'text-emerald-400',
      },
      {
        id: 'leads' as const,
        title: 'Controle de Leads',
        desc: 'Compare a checagem da agência com os leads realmente recebidos.',
        icon: Users,
        iconClass: 'text-amber-400',
      },
    ];

    return (
      <div className="space-y-5">
        <div>
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Dashboard de Tráfego
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Somente os dados vinculados à sua empresa são exibidos aqui.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(({ id, title, desc, icon: Icon, iconClass }) => (
            <button
              type="button"
              key={id}
              onClick={() => setActiveView(id)}
              className="text-left bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
                <Icon className={`w-5 h-5 ${iconClass}`} />
              </div>
              <h4 className="font-black text-white group-hover:text-blue-400 transition-colors">{title}</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveView('menu')}
          className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </button>

        {activeView !== 'geral' && (
          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {activeView === 'geral' && <GeneralTrafficTable rows={clientCampaigns} />}
      {activeView === 'sites' && <DailyReadOnlyTable title="Controle de Sites" rows={clientSites} kind="sites" />}
      {activeView === 'custos' && <DailyReadOnlyTable title="Custo por Resultado" rows={clientCosts} kind="custos" />}
      {activeView === 'leads' && (
        <ClientLeadsTable
          rows={clientLeads}
          client={client}
          savingLead={savingLead}
          onChange={updateClientLeadLocal}
          onBlur={saveClientLead}
        />
      )}
    </div>
  );
};

const GeneralTrafficTable: React.FC<{ rows: GenericRow[] }> = ({ rows }) => (
  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-800">
      <h4 className="font-black text-white">Controle Geral de Verbas</h4>
      <p className="text-[10px] text-slate-500 mt-1">Consulta das campanhas da sua empresa.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs whitespace-nowrap">
        <thead className="bg-slate-950 text-slate-500 uppercase text-[9px] tracking-wider">
          <tr>
            <th className="px-3 py-3 text-left">Plataforma</th>
            <th className="px-3 py-3 text-left">Status</th>
            <th className="px-3 py-3 text-left">Campanha</th>
            <th className="px-3 py-3 text-left">Último Pag.</th>
            <th className="px-3 py-3 text-left">Verba</th>
            <th className="px-3 py-3 text-left">Disponível</th>
            <th className="px-3 py-3 text-left">Orçamento</th>
            <th className="px-3 py-3 text-left">Gasto Diário</th>
            <th className="px-3 py-3 text-left">Objetivo</th>
            <th className="px-3 py-3 text-left">Término</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.length === 0 ? (
            <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">Nenhuma campanha encontrada para este cliente.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-800/40">
              <td className="px-3 py-2.5 font-bold text-white">{row.plataforma || '-'}</td>
              <td className="px-3 py-2.5"><StatusBadge value={row.status_obs} /></td>
              <td className="px-3 py-2.5 text-slate-200">{row.campanha || '-'}</td>
              <td className="px-3 py-2.5 text-slate-400">{row.ultimo_pagamento || '-'}</td>
              <td className="px-3 py-2.5 text-emerald-300 font-semibold">{formatMoney(row.verba_total)}</td>
              <td className="px-3 py-2.5 text-emerald-300">{formatMoney(row.verba_disponivel)}</td>
              <td className="px-3 py-2.5 text-emerald-300">{formatMoney(row.orcamento_diario)}</td>
              <td className="px-3 py-2.5 text-slate-300">{row.gasto_diario || '-'}</td>
              <td className="px-3 py-2.5 text-slate-300">{row.objetivo || '-'}</td>
              <td className="px-3 py-2.5 text-slate-400">{row.data_termino || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DailyReadOnlyTable: React.FC<{
  title: string;
  rows: GenericRow[];
  kind: 'sites' | 'custos';
}> = ({ title, rows, kind }) => (
  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-800">
      <h4 className="font-black text-white">{title}</h4>
      <p className="text-[10px] text-slate-500 mt-1">Visualização somente leitura.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="text-[10px] whitespace-nowrap min-w-max w-full">
        <thead className="bg-slate-950 text-slate-500 uppercase tracking-wider">
          <tr>
            {kind === 'custos' && <th className="px-3 py-3 text-left">Plataforma</th>}
            <th className="px-3 py-3 text-left">{kind === 'sites' ? 'Site' : 'Campanha'}</th>
            {Array.from({ length: 31 }, (_, i) => <th key={i + 1} className="px-2 py-3 text-center">{i + 1}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.length === 0 ? (
            <tr><td colSpan={33} className="px-4 py-10 text-center text-slate-500">Nenhum dado encontrado neste mês.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-800/40">
              {kind === 'custos' && <td className="px-3 py-2.5 font-bold text-white">{row.plataforma || '-'}</td>}
              <td className="px-3 py-2.5 text-slate-200 max-w-[260px] truncate" title={kind === 'sites' ? row.link : row.campanha}>
                {kind === 'sites' ? row.link || '-' : row.campanha || '-'}
              </td>
              {Array.from({ length: 31 }, (_, index) => {
                const value = safeValue(row[`d${index + 1}`]);
                return (
                  <td key={index + 1} className={`px-2 py-2 text-center font-semibold ${value === 'X' ? 'text-amber-400' : value === 'OK' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {kind === 'custos' && value && value !== 'X' ? `R$ ${value}` : value || '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ClientLeadsTable: React.FC<{
  rows: ClientLeadRow[];
  client: EmpresaCliente;
  savingLead: string | null;
  onChange: (leadId: number, day: number, value: string) => void;
  onBlur: (leadId: number, day: number, value: string) => void;
}> = ({ rows, client, savingLead, onChange, onBlur }) => (
  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-800">
      <h4 className="font-black text-white">Controle de Leads</h4>
      <p className="text-[10px] text-slate-500 mt-1">
        Linha “Agência” = conferência da Sothink. Linha “Cliente” = quantidade realmente recebida por {client.nome_fantasia || client.razao_social}.
      </p>
    </div>

    <div className="overflow-x-auto">
      <table className="text-[10px] whitespace-nowrap min-w-max w-full">
        <thead className="bg-slate-950 text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="px-3 py-3 text-left">Plataforma</th>
            <th className="px-3 py-3 text-left">Campanha</th>
            <th className="px-3 py-3 text-left">Conferência</th>
            {Array.from({ length: 31 }, (_, i) => <th key={i + 1} className="px-2 py-3 text-center">{i + 1}</th>)}
            <th className="px-3 py-3 text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={35} className="px-4 py-10 text-center text-slate-500">Nenhuma campanha de leads encontrada neste mês.</td></tr>
          ) : rows.flatMap((row) => {
            const clientRow = row.cliente_check || {
              lead_agencia_id: Number(row.id),
              cliente_id: String(client.id),
            };

            return [
              <tr key={`${row.id}-agencia`} className="border-t border-slate-800 bg-slate-900 hover:bg-slate-800/40">
                <td className="px-3 py-2.5 font-bold text-white">{row.plataforma || '-'}</td>
                <td className="px-3 py-2.5 text-slate-200 max-w-[260px] truncate" title={row.campanha}>{row.campanha || '-'}</td>
                <td className="px-3 py-2.5"><span className="px-2 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 font-black">AGÊNCIA</span></td>
                {Array.from({ length: 31 }, (_, index) => {
                  const value = safeValue(row[`d${index + 1}`]);
                  return <td key={index + 1} className={`px-2 py-2 text-center font-bold ${value === 'X' ? 'text-amber-400' : 'text-slate-300'}`}>{value || '-'}</td>;
                })}
                <td className="px-3 py-2 text-center font-black text-blue-300">{sumDays(row)}</td>
              </tr>,
              <tr key={`${row.id}-cliente`} className="border-b border-slate-800 bg-emerald-950/10 hover:bg-emerald-950/20">
                <td className="px-3 py-2.5 text-slate-500">↳</td>
                <td className="px-3 py-2.5 text-emerald-300 font-bold">Leads realmente recebidos</td>
                <td className="px-3 py-2.5"><span className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-black">CLIENTE</span></td>
                {Array.from({ length: 31 }, (_, index) => {
                  const day = index + 1;
                  const key = `d${day}`;
                  const value = safeValue(clientRow[key]);
                  const isSaving = savingLead === `${row.id}-${day}`;
                  return (
                    <td key={day} className="px-1 py-1.5 text-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        onChange={(e) => onChange(Number(row.id), day, e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={(e) => onBlur(Number(row.id), day, e.target.value)}
                        placeholder="-"
                        className={`w-12 px-1.5 py-1.5 rounded-lg text-center bg-slate-950 border text-emerald-300 font-black outline-none focus:ring-1 focus:ring-emerald-500 ${isSaving ? 'border-emerald-500 animate-pulse' : 'border-slate-800'}`}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-black text-emerald-300">{sumDays(clientRow)}</td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const StatusBadge: React.FC<{ value?: string }> = ({ value }) => {
  const status = value || '-';
  const klass =
    status === 'OK'
      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
      : status === 'PAUSADA'
      ? 'bg-rose-950 text-rose-300 border-rose-800'
      : status.includes('AGUARDANDO')
      ? 'bg-amber-950 text-amber-300 border-amber-800'
      : 'bg-slate-800 text-slate-300 border-slate-700';

  return <span className={`px-2 py-1 rounded-lg border text-[9px] font-black ${klass}`}>{status}</span>;
};
