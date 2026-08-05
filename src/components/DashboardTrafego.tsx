import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Search, LayoutGrid, DollarSign, Users } from "lucide-react";
import { TrafegoView } from "./TrafegoView";

// ==========================================
// 1. COMPONENTE PRINCIPAL (MENU DE CARDS)
// ==========================================
export const DashboardTrafego = () => {
  const [activeView, setActiveView] = useState<"menu" | "geral" | "custos" | "leads">("menu");

  if (activeView === "geral") return <div><button onClick={() => setActiveView("menu")} className="mb-4 text-indigo-600 font-bold">← Voltar ao Menu</button><TrafegoView /></div>;
  if (activeView === "custos") return <div><button onClick={() => setActiveView("menu")} className="mb-4 text-indigo-600 font-bold">← Voltar ao Menu</button><PlanilhaMensalView tipo="custos" titulo="Controle Custo por Resultado" /></div>;
  if (activeView === "leads") return <div><button onClick={() => setActiveView("menu")} className="mb-4 text-indigo-600 font-bold">← Voltar ao Menu</button><PlanilhaMensalView tipo="leads" titulo="Controle de Leads" /></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold mb-6">Menu de Tráfego</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div onClick={() => setActiveView("geral")} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-500 transition group">
          <LayoutGrid className="w-8 h-8 text-indigo-500 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-lg font-bold text-slate-800">Controle Geral de Verbas</h2>
          <p className="text-sm text-black mt-2">Visão consolidada de orçamentos e saldo por campanha.</p>
        </div>
        {/* Card 2 */}
        <div onClick={() => setActiveView("custos")} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-emerald-500 transition group">
          <DollarSign className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-lg font-bold text-slate-800">Controle Custo por Resultado</h2>
          <p className="text-sm text-black mt-2">Custo diário detalhado nos 31 dias do mês.</p>
        </div>
        {/* Card 3 */}
        <div onClick={() => setActiveView("leads")} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-amber-500 transition group">
          <Users className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-lg font-bold text-slate-800">Controle de Leads</h2>
          <p className="text-sm text-black mt-2">Captação de leads diária com soma total automática no final da linha.</p>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 2. COMPONENTE DA PLANILHA DE 31 DIAS
// ==========================================
const PlanilhaMensalView = ({ tipo, titulo }: { tipo: "custos" | "leads", titulo: string }) => {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mesAno, setMesAno] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  // ESTADOS DOS FILTROS NOVOS
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroCampanha, setFiltroCampanha] = useState("");

  const API_URL = `https://sothink.com.br/app/api/api_diario?tipo=${tipo}`;
  const diasDoMes = Array.from({ length: 31 }, (_, i) => i + 1); 

  const fetchDados = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}&action=read&mes_ano=${mesAno}`);
      const data = await res.json();
      setDados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
    // Limpa os filtros ao trocar de mês para evitar confusão
    setFiltroEmpresa("");
    setFiltroCampanha("");
  }, [mesAno]); 

  // Pega todas as empresas únicas cadastradas neste mês para preencher o Select
  const empresasUnicas = Array.from(
    new Set(dados.map((d) => d.empresa).filter((e) => e && e.trim() !== ""))
  ).sort();

  const handleAddRow = async (plataforma: "Google" | "Meta") => {
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("plataforma", plataforma);
    formData.append("mes_ano", mesAno);

    await fetch(API_URL, { method: "POST", body: formData });
    fetchDados();
  };

  const handleChange = (id: string, field: string, value: string) => {
    setDados((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleBlur = async (item: any) => {
    const formData = new FormData();
    formData.append("action", "update");
    Object.entries(item).forEach(([key, val]) => formData.append(key, val as string));
    await fetch(API_URL, { method: "POST", body: formData });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover esta linha?")) return;
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("id", id);
    await fetch(API_URL, { method: "POST", body: formData });
    setDados((prev) => prev.filter((item) => item.id !== id));
  };

  const calcularTotal = (item: any) => {
    let total = 0;
    for (let i = 1; i <= 31; i++) {
      total += Number(item[`d${i}`]) || 0;
    }
    return total;
  };

  const renderTable = (plataforma: "Google" | "Meta") => {
    // APLICA OS FILTROS AQUI
    const lista = dados.filter((d) => {
      const matchPlataforma = d.plataforma === plataforma;
      const matchEmpresa = filtroEmpresa === "" || d.empresa === filtroEmpresa;
      const matchCampanha = filtroCampanha === "" || (d.campanha && d.campanha.toLowerCase().includes(filtroCampanha.toLowerCase()));
      
      return matchPlataforma && matchEmpresa && matchCampanha;
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
          <h2 className="font-bold text-slate-900">{plataforma} Ads</h2>
          <button onClick={() => handleAddRow(plataforma)} className="bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nova Linha
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-100 text-black uppercase font-bold text-[10px]">
              <tr>
                <th className="px-3 py-3 w-40 min-w-[150px]">Empresa</th>
                <th className="px-3 py-3 w-48 min-w-[200px]">Campanha</th>
                <th className="px-3 py-3 w-32 min-w-[120px]">Status</th>
                {diasDoMes.map(dia => (
                  <th key={dia} className="px-2 py-3 w-16 text-center">{dia}</th>
                ))}
                {tipo === "leads" && <th className="px-3 py-3 text-center bg-indigo-50 text-indigo-700">Total</th>}
                <th className="px-3 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-black">
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={35} className="text-center py-6 text-slate-400">Nenhuma campanha encontrada com estes filtros.</td>
                </tr>
              ) : (
                lista.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-1">
                      <input type="text" value={c.empresa || ""} onChange={(e) => handleChange(c.id, "empresa", e.target.value)} onBlur={() => handleBlur(c)} className="w-full px-2 py-1 bg-transparent border-transparent focus:bg-white focus:border-indigo-500 rounded outline-none font-bold" placeholder="Empresa"/>
                    </td>
                    <td className="p-1">
                      <input type="text" value={c.campanha || ""} onChange={(e) => handleChange(c.id, "campanha", e.target.value)} onBlur={() => handleBlur(c)} className="w-full px-2 py-1 bg-transparent border-transparent focus:bg-white focus:border-indigo-500 rounded outline-none" placeholder="Nome da Campanha"/>
                    </td>
                    <td className="p-1">
                      <select value={c.status_obs || ""} onChange={(e) => handleChange(c.id, "status_obs", e.target.value)} onBlur={() => handleBlur(c)} className="w-full px-1 py-1 bg-transparent outline-none">
                        <option value="">Selecione</option>
                        <option value="OK">OK</option>
                        <option value="PAUSADA">PAUSADA</option>
                        <option value="FINALIZADA">FINALIZADA</option>
                      </select>
                    </td>
                    
                    {diasDoMes.map((dia) => (
                      <td key={dia} className="p-1 border-l border-slate-100">
                        <div className="flex items-center justify-center">
                          {tipo === "custos" && <span className="text-black text-[10px] mr-0.5">R$</span>}
                          <input
                            type={tipo === "custos" ? "text" : "number"}
                            value={c[`d${dia}`] == 0 ? "" : c[`d${dia}`]}
                            onChange={(e) => handleChange(c.id, `d${dia}`, e.target.value)}
                            onBlur={() => handleBlur(c)}
                            className="w-10 text-center bg-transparent focus:bg-white border-transparent focus:border-indigo-500 rounded outline-none"
                          />
                        </div>
                      </td>
                    ))}

                    {tipo === "leads" && (
                      <td className="p-1 text-center font-bold bg-indigo-50/50 text-indigo-700 border-l border-indigo-100">
                        {calcularTotal(c)}
                      </td>
                    )}

                    <td className="p-1 text-center">
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{titulo}</h1>
          <p className="text-xs text-slate-900 dark:text-white">Separado por plataforma e mês. Salva ao digitar.</p>
        </div>
        
        {/* ÁREA DE FILTROS SUPERIORES */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          
          {/* BUSCA POR CAMPANHA (Escrevendo) */}
          <div className="relative w-full sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar campanha..."
              value={filtroCampanha}
              onChange={(e) => setFiltroCampanha(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* SELETOR DE CLIENTE / EMPRESA */}
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          >
            <option value="">Todas as Empresas</option>
            {empresasUnicas.map((emp, index) => (
              <option key={index} value={emp}>{emp}</option>
            ))}
          </select>

          {/* SELETOR DE MÊS */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-bold text-slate-900 dark:text-white hidden sm:block">Mês:</span>
            <input 
              type="month" 
              value={mesAno} 
              onChange={(e) => setMesAno(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div> : (
        <>
          {renderTable("Google")}
          {renderTable("Meta")}
        </>
      )}
    </div>
  );
};