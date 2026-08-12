import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  LayoutGrid,
  DollarSign,
  Users,
  GripVertical,
  Globe,
  ExternalLink,
  Download,
  Activity, // <-- Novo ícone para o botão de verificar sites
} from "lucide-react";
import { TrafegoView } from "./TrafegoView";

// Função para evitar que a string "null" ou valores nulos apareçam na tela
const safeValue = (val: any) => {
  if (val === null || val === "null" || val === undefined) return "";
  return val;
};

// Função global para exportar dados para CSV (abre no Excel)
const exportToCSV = (dados: any[], nomeArquivo: string) => {
  if (!dados || dados.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // Pega os cabeçalhos a partir das chaves do primeiro objeto
  const headers = Object.keys(dados[0]);

  // Monta as linhas do CSV
  const csvRows = [];
  csvRows.push(headers.join(";")); // Separador padrão pt-BR no Excel é ;

  for (const row of dados) {
    const values = headers.map((header) => {
      const valor = row[header] === null || row[header] === undefined ? "" : String(row[header]);
      const escaped = valor.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(";"));
  }

  const csvString = csvRows.join("\n");
  // \uFEFF força o UTF-8 no Excel para não quebrar acentos
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${nomeArquivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==========================================
// 1. COMPONENTE PRINCIPAL (MENU DE CARDS)
// ==========================================
export const DashboardTrafego = () => {
  const [activeView, setActiveView] = useState<
    "menu" | "geral" | "sites" | "custos" | "leads"
  >("menu");

  if (activeView === "geral")
    return (
      <div className="animate-in fade-in duration-300">
        <button
          onClick={() => setActiveView("menu")}
          className="mb-4 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-indigo-600 font-bold transition-colors"
        >
          ← Voltar ao Menu
        </button>
        <TrafegoView />
      </div>
    );
  if (activeView === "sites")
    return (
      <div className="animate-in fade-in duration-300">
        <button
          onClick={() => setActiveView("menu")}
          className="mb-4 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-indigo-600 font-bold transition-colors"
        >
          ← Voltar ao Menu
        </button>
        <PlanilhaSitesView />
      </div>
    );
  if (activeView === "custos")
    return (
      <div className="animate-in fade-in duration-300">
        <button
          onClick={() => setActiveView("menu")}
          className="mb-4 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-indigo-600 font-bold transition-colors"
        >
          ← Voltar ao Menu
        </button>
        <PlanilhaMensalView
          tipo="custos"
          titulo="Controle Custo por Resultado"
        />
      </div>
    );
  if (activeView === "leads")
    return (
      <div className="animate-in fade-in duration-300">
        <button
          onClick={() => setActiveView("menu")}
          className="mb-4 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-indigo-600 font-bold transition-colors"
        >
          ← Voltar ao Menu
        </button>
        <PlanilhaMensalView tipo="leads" titulo="Controle de Leads" />
      </div>
    );

  return (
    <div className="p-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-extrabold mb-6 text-slate-800 dark:text-white">Menu de Tráfego</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1 - Sites */}
        <div
          onClick={() => setActiveView("sites")}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group transform hover:-translate-y-1"
        >
          <Globe className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-slate-800">
            Controle de Sites
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Validação diária de status dos sites (OK ou X).
          </p>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => setActiveView("geral")}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group transform hover:-translate-y-1"
        >
          <LayoutGrid className="w-8 h-8 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-slate-800">
            Controle Geral de Verbas
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Visão consolidada de orçamentos e saldo por campanha.
          </p>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => setActiveView("custos")}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group transform hover:-translate-y-1"
        >
          <DollarSign className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-slate-800">
            Custo por Resultado
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Custo diário detalhado nos 31 dias do mês.
          </p>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setActiveView("leads")}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group transform hover:-translate-y-1"
        >
          <Users className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-slate-800">
            Controle de Leads
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Captação de leads diária com soma total automática.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENTE DA PLANILHA DE SITES
// ==========================================
const PlanilhaSitesView = () => {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingSites, setCheckingSites] = useState(false); // <-- Estado para o loading de verificação
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [mesAno, setMesAno] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroLink, setFiltroLink] = useState("");

  const API_URL = `https://sothink.com.br/app/api/api_sites?`;
  const diasDoMes = Array.from({ length: 31 }, (_, i) => i + 1);

  const isFiltered = filtroEmpresa.trim() !== "" || filtroLink.trim() !== "";

  const fetchDados = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}action=read&mes_ano=${mesAno}`);
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
    setFiltroEmpresa("");
    setFiltroLink("");
  }, [mesAno]);

  const empresasUnicas = Array.from(
    new Set(dados.map((d) => d.empresa).filter((e) => e && e.trim() !== ""))
  ).sort();

  const handleAddRow = async () => {
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("mes_ano", mesAno);

    await fetch(API_URL, { method: "POST", body: formData });
    fetchDados();
  };

  const handleChange = (id: string, field: string, value: string) => {
    setDados((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleBlur = async (item: any) => {
    const formData = new FormData();
    formData.append("action", "update");
    Object.entries(item).forEach(([key, val]) =>
      formData.append(key, val as string)
    );
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, listaFiltrada: any[]) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const novaLista = [...listaFiltrada];
    const itemMovido = novaLista[draggedIndex];
    
    novaLista.splice(draggedIndex, 1);
    novaLista.splice(targetIndex, 0, itemMovido);

    const idsOrdenados = novaLista.map((item) => item.id);
    setDados(novaLista);
    setDraggedIndex(null);

    const formData = new FormData();
    formData.append("action", "update_order");
    formData.append("ids", JSON.stringify(idsOrdenados));
    await fetch(API_URL, { method: "POST", body: formData });
  };

// ==========================================
  // FUNÇÃO NOVA: VERIFICAÇÃO AUTOMÁTICA (DIRETA)
  // ==========================================
  const handleVerificarHoje = async () => {
    const dataAtual = new Date();
    const mesAtualStr = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}`;

    // Trava de segurança para não preencher o dia de hoje no mês errado
    if (mesAno !== mesAtualStr) {
      alert("Por favor, selecione o mês atual para poder fazer a verificação de hoje.");
      return;
    }

    const diaHoje = dataAtual.getDate();
    const confirmacao = window.confirm(`Isso fará um teste em todos os sites e preencherá automaticamente o dia ${diaHoje}. Deseja iniciar?`);
    if (!confirmacao) return;

    setCheckingSites(true);

    const novosDados = [...dados];

    for (let i = 0; i < novosDados.length; i++) {
      const c = novosDados[i];
      let link = c.link?.trim();
      
      if (!link) continue;

      // Adiciona https se o usuário tiver esquecido
      if (!link.startsWith("http")) {
        link = "https://" + link;
      }

      try {
        // Tenta acessar o site diretamente pelo seu navegador, de forma opaca (no-cors)
        // Isso burla bloqueios de Cloudflare e firewalls, pois simula um acesso real do seu IP
        await fetch(link, { 
            mode: 'no-cors', 
            cache: 'no-store' 
        });
        
        // Se o fetch resolveu e não deu erro de rede, o servidor/site está no ar
        novosDados[i][`d${diaHoje}`] = "OK";

      } catch (error) {
        // Se deu erro no fetch, significa que o servidor não respondeu, domínio expirou ou site caiu feio
        console.warn(`O site ${link} parece estar fora do ar.`, error);
        novosDados[i][`d${diaHoje}`] = "X";
      }
      
      // Salva essa alteração no banco de dados
      try {
        const formData = new FormData();
        formData.append("action", "update");
        Object.entries(novosDados[i]).forEach(([key, val]) =>
          formData.append(key, val as string)
        );
        await fetch(API_URL, { method: "POST", body: formData });
      } catch (e) {
        console.error("Erro ao salvar no banco de dados.", e);
      }
      
      // Atualiza a tela e dá uma pausa de meio segundo para não travar sua internet/navegador
      setDados([...novosDados]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCheckingSites(false);
    alert("Verificação de sites concluída com sucesso!");
  };

  const lista = dados.filter((d) => {
    const matchEmpresa = filtroEmpresa === "" || d.empresa === filtroEmpresa;
    const matchLink =
      filtroLink === "" ||
      (d.link && d.link.toLowerCase().includes(filtroLink.toLowerCase()));
    return matchEmpresa && matchLink;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Controle de Sites
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Valide o status diariamente. Salva ao alterar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar link..."
              value={filtroLink}
              onChange={(e) => setFiltroLink(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>

          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
          >
            <option value="">Todas as Empresas</option>
            {empresasUnicas.map((emp, index) => (
              <option key={index} value={emp}>
                {emp}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-bold text-slate-700 dark:text-white hidden sm:block">
              Mês:
            </span>
            <input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm"
            />
          </div>

          <button
            onClick={() => exportToCSV(lista, `sites_monitorados_${mesAno}`)}
            className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-bold"
            title="Baixar Tabela em Excel (CSV)"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
            <h2 className="font-bold text-slate-800">Sites Monitorados</h2>
            <div className="flex gap-2">
              {/* NOVO BOTÃO DE VERIFICAÇÃO */}
              <button
                onClick={handleVerificarHoje}
                disabled={checkingSites}
                className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shadow-sm hover:shadow transition-all text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold"
                title="Checar todos os sites no dia de hoje"
              >
                {checkingSites ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                {checkingSites ? "Verificando..." : "Verificar Hoje"}
              </button>

              <button
                onClick={handleAddRow}
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Nova Linha
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-2 py-3 w-10 text-center"></th>
                  <th className="px-3 py-3 w-40 min-w-[150px]">Empresa</th>
                  <th className="px-3 py-3 w-48 min-w-[200px]">Link do Site</th>
                  {diasDoMes.map((dia) => (
                    <th key={dia} className="px-1 py-3 w-12 text-center">
                      {dia}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-black">
                {lista.length === 0 ? (
                  <tr>
                    <td
                      colSpan={35}
                      className="text-center py-8 text-slate-400"
                    >
                      Nenhum site encontrado com estes filtros.
                    </td>
                  </tr>
                ) : (
                  lista.map((c, index) => (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-blue-50/30 transition-colors ${draggedIndex === index ? "opacity-50 bg-slate-100" : ""}`}
                      draggable={!isFiltered}
                      onDragStart={(e) => !isFiltered && handleDragStart(e, index)}
                      onDragOver={(e) => !isFiltered && handleDragOver(e)}
                      onDrop={(e) => !isFiltered && handleDrop(e, index, lista)}
                    >
                      <td className="p-1 text-center text-slate-400">
                        {!isFiltered ? (
                          <div className="cursor-grab hover:text-blue-600 flex justify-center w-full transition-colors" title="Arraste para reordenar">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300" title="Remova os filtros para ordenar">-</span>
                        )}
                      </td>

                      <td className="p-1">
                        <input
                          type="text"
                          value={safeValue(c.empresa)}
                          onChange={(e) => handleChange(c.id, "empresa", e.target.value)}
                          onBlur={() => handleBlur(c)}
                          className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded outline-none font-bold transition-all text-slate-800"
                          placeholder="Empresa"
                        />
                      </td>
                      <td className="p-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={safeValue(c.link)}
                            onChange={(e) => handleChange(c.id, "link", e.target.value)}
                            onBlur={() => handleBlur(c)}
                            className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded outline-none transition-all text-slate-600"
                            placeholder="https://..."
                          />
                          {c.link && c.link.trim() !== "" && (
                            <a
                              href={c.link.startsWith('http') ? c.link : `https://${c.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                              title="Abrir em nova aba"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>

                      {diasDoMes.map((dia) => {
                        const valor = safeValue(c[`d${dia}`]);
                        const colorClass =
                          valor === "OK"
                            ? "text-emerald-700 bg-emerald-100 font-bold"
                            : valor === "X" || valor === "x"
                            ? "text-rose-700 bg-rose-100 font-bold"
                            : "text-slate-400 hover:bg-slate-100";

                        return (
                          <td
                            key={dia}
                            className="p-1 border-l border-slate-100"
                          >
                            <div className="flex items-center justify-center">
                              <select
                                value={valor}
                                onChange={(e) => handleChange(c.id, `d${dia}`, e.target.value)}
                                onBlur={() => handleBlur(c)}
                                style={{ textAlignLast: "center" }}
                                className={`w-10 h-7 text-center cursor-pointer rounded outline-none appearance-none transition-colors ${colorClass}`}
                                title="Selecione o status"
                              >
                                <option value="">-</option>
                                <option value="OK">OK</option>
                                <option value="X">X</option>
                              </select>
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-1 text-center">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-slate-400 p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. COMPONENTE DA PLANILHA DE CUSTOS/LEADS
// ==========================================
const PlanilhaMensalView = ({
  tipo,
  titulo,
}: {
  tipo: "custos" | "leads";
  titulo: string;
}) => {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragInfo, setDragInfo] = useState<{index: number | null, plataforma: string | null}>({index: null, plataforma: null});
  
  const [mesAno, setMesAno] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroCampanha, setFiltroCampanha] = useState("");

  const API_URL = `https://sothink.com.br/app/api/api_diario?tipo=${tipo}`;
  const diasDoMes = Array.from({ length: 31 }, (_, i) => i + 1);

  const isFiltered = filtroEmpresa.trim() !== "" || filtroCampanha.trim() !== "";
  const isCusto = tipo === "custos";

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
    setFiltroEmpresa("");
    setFiltroCampanha("");
  }, [mesAno]);

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
    setDados((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleBlur = async (item: any) => {
    const formData = new FormData();
    formData.append("action", "update");
    Object.entries(item).forEach(([key, val]) =>
      formData.append(key, val as string)
    );
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

  const handleDragStart = (e: React.DragEvent, index: number, plataforma: string) => {
    setDragInfo({ index, plataforma });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, targetPlataforma: string, listaFiltrada: any[]) => {
    e.preventDefault();
    if (dragInfo.plataforma !== targetPlataforma || dragInfo.index === null || dragInfo.index === targetIndex) {
        setDragInfo({index: null, plataforma: null});
        return;
    }

    const novaLista = [...listaFiltrada];
    const itemMovido = novaLista[dragInfo.index];
    
    novaLista.splice(dragInfo.index, 1);
    novaLista.splice(targetIndex, 0, itemMovido);

    const idsOrdenados = novaLista.map((item) => item.id);

    setDados((prev) => {
      const outros = prev.filter((p) => p.plataforma !== targetPlataforma);
      return [...outros, ...novaLista];
    });
    
    setDragInfo({index: null, plataforma: null});

    const formData = new FormData();
    formData.append("action", "update_order");
    formData.append("ids", JSON.stringify(idsOrdenados));
    await fetch(API_URL, { method: "POST", body: formData });
  };

  const calcularTotal = (item: any) => {
    let total = 0;
    for (let i = 1; i <= 31; i++) {
      const val = item[`d${i}`];
      // Se for X não tenta somar
      if (val !== 'X' && val !== 'x') {
        total += Number(val) || 0;
      }
    }
    return total;
  };

  const renderTable = (plataforma: "Google" | "Meta") => {
    const lista = dados.filter((d) => {
      const matchPlataforma = d.plataforma === plataforma;
      const matchEmpresa = filtroEmpresa === "" || d.empresa === filtroEmpresa;
      const matchCampanha =
        filtroCampanha === "" ||
        (d.campanha &&
          d.campanha.toLowerCase().includes(filtroCampanha.toLowerCase()));

      return matchPlataforma && matchEmpresa && matchCampanha;
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
        <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
            {plataforma === "Google" ? (
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4" />
            ) : (
              <img src="data:image/webp;base64,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" alt="Meta" className="h-3 w-auto object-contain" />
            )}
            {plataforma} Ads
          </h2>
          <button
            onClick={() => handleAddRow(plataforma)}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow transition-all text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Nova Linha
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-2 py-3 w-10 text-center"></th>
                <th className="px-3 py-3 w-40 min-w-[150px]">Empresa</th>
                <th className="px-3 py-3 w-48 min-w-[200px]">Campanha</th>
                <th className="px-3 py-3 w-32 min-w-[120px]">Status</th>
                {diasDoMes.map((dia) => (
                  <th key={dia} className="px-2 py-3 w-16 text-center">
                    {dia}
                  </th>
                ))}
                {tipo === "leads" && (
                  <th className="px-3 py-3 text-center bg-indigo-50 text-indigo-700">
                    Total
                  </th>
                )}
                <th className="px-3 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-black">
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={36} className="text-center py-8 text-slate-400">
                    Nenhuma campanha encontrada com estes filtros.
                  </td>
                </tr>
              ) : (
                lista.map((c, index) => {
                  // STATUS COLORIDO 
                  const statusVal = safeValue(c.status_obs);
                  const statusColor = 
                    statusVal === "OK" ? "text-emerald-700 bg-emerald-100" :
                    statusVal === "PAUSADA" ? "text-rose-700 bg-rose-100" :
                    statusVal === "FINALIZADA" ? "text-amber-700 bg-amber-100" :
                    "text-slate-600 hover:bg-slate-100 bg-transparent";

                  return (
                  <tr 
                    key={c.id} 
                    className={`hover:bg-slate-50/70 transition-colors group ${dragInfo.index === index && dragInfo.plataforma === plataforma ? "opacity-50 bg-slate-100" : ""}`}
                    draggable={!isFiltered}
                    onDragStart={(e) => !isFiltered && handleDragStart(e, index, plataforma)}
                    onDragOver={(e) => !isFiltered && handleDragOver(e)}
                    onDrop={(e) => !isFiltered && handleDrop(e, index, plataforma, lista)}
                  >
                    {/* ÍCONE DE ARRASTAR */}
                    <td className="p-1 text-center text-slate-400">
                      {!isFiltered ? (
                        <div className="cursor-grab hover:text-indigo-600 flex justify-center w-full transition-colors" title="Arraste para reordenar">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300" title="Remova os filtros para ordenar">-</span>
                      )}
                    </td>

                    <td className="p-1">
                      <input
                        type="text"
                        value={safeValue(c.empresa)}
                        onChange={(e) => handleChange(c.id, "empresa", e.target.value)}
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded outline-none font-bold transition-all text-slate-800"
                        placeholder="Empresa"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={safeValue(c.campanha)}
                        onChange={(e) => handleChange(c.id, "campanha", e.target.value)}
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded outline-none transition-all text-slate-600"
                        placeholder="Nome da Campanha"
                      />
                    </td>
                    <td className="p-1">
                      <select
                        value={statusVal}
                        onChange={(e) => handleChange(c.id, "status_obs", e.target.value)}
                        onBlur={() => handleBlur(c)}
                        className={`w-full px-1 py-1.5 rounded outline-none font-semibold cursor-pointer transition-colors ${statusColor}`}
                      >
                        <option value="" className="text-slate-700 bg-white">Selecione...</option>
                        <option value="OK" className="text-emerald-700 bg-white">OK</option>
                        <option value="PAUSADA" className="text-rose-700 bg-white">PAUSADA</option>
                        <option value="FINALIZADA" className="text-amber-700 bg-white">FINALIZADA</option>
                      </select>
                    </td>

                    {diasDoMes.map((dia) => {
                      const val = safeValue(c[`d${dia}`]);
                      const isX = val.toString().toUpperCase() === "X"; // Verifica se o valor é um X
                      
                      return (
                      <td key={dia} className="p-1 border-l border-slate-100">
                        <div className={`flex items-center justify-center rounded px-1 transition-colors ${
                          isX
                            ? "bg-amber-100 text-amber-700" // AQUI: Se for X, fundo amarelo e texto amarelo escuro
                            : isCusto 
                            ? "hover:bg-emerald-50 focus-within:bg-emerald-50 text-emerald-700" 
                            : "hover:bg-indigo-50 focus-within:bg-indigo-50 text-indigo-700"
                        }`}>
                          {/* Só mostra o R$ se for Custo E não for "X" */}
                          {isCusto && !isX && val !== "" && (
                            <span className="text-[10px] font-bold mr-0.5 opacity-60">R$</span>
                          )}
                          
                          <input
                            type="text" 
                            value={val}
                            onChange={(e) => handleChange(c.id, `d${dia}`, e.target.value)}
                            onBlur={() => handleBlur(c)}
                            className={`w-10 py-1 text-center bg-transparent rounded outline-none transition-colors ${
                              isX 
                                ? "text-amber-800 font-bold" // AQUI: Negrito no texto do X
                                : isCusto ? "focus:text-emerald-700 font-medium" : "focus:text-indigo-700 font-medium"
                            }`}
                          />
                        </div>
                      </td>
                    )})}

                    {tipo === "leads" && (
                      <td className="p-1 text-center font-bold bg-indigo-50/50 text-indigo-700 border-l border-indigo-100">
                        {calcularTotal(c)}
                      </td>
                    )}

                    <td className="p-1 text-center">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-slate-400 p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )})
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {titulo}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Separado por plataforma e mês. Salva ao digitar.
          </p>
        </div>

        {/* ÁREA DE FILTROS SUPERIORES */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* BUSCA POR CAMPANHA */}
          <div className="relative w-full sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar campanha..."
              value={filtroCampanha}
              onChange={(e) => setFiltroCampanha(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          {/* SELETOR DE CLIENTE / EMPRESA */}
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
          >
            <option value="">Todas as Empresas</option>
            {empresasUnicas.map((emp, index) => (
              <option key={index} value={emp}>
                {emp}
              </option>
            ))}
          </select>

          {/* SELETOR DE MÊS */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-bold text-slate-700 dark:text-white hidden sm:block">
              Mês:
            </span>
            <input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-black bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
            />
          </div>

          {/* NOVO BOTÃO DE EXPORTAR CSV */}
          <button
            onClick={() => exportToCSV(dados, `${tipo}_${mesAno}`)}
            className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-bold"
            title="Baixar Tabela em Excel (CSV)"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
        </div>
      ) : (
        <>
          {renderTable("Google")}
          {renderTable("Meta")}
        </>
      )}
    </div>
  );
};