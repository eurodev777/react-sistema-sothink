import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Search, ArrowUp, ArrowDown } from "lucide-react";

export interface CampanhaTrafego {
  id?: string;
  plataforma: "Google" | "Meta";
  status_obs: string;
  data_atualizacao: string;
  empresa: string;
  campanha: string;
  ultimo_pagamento: string;
  verba_total: string;
  verba_disponivel: string;
  orcamento_diario: string;
  gasto_diario: string;
  objetivo: string;
  data_termino: string;
}

const formatDateForInput = (dateStr?: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    } else if (parts.length === 2) {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return dateStr;
};

const formatDateForDB = (dateStr?: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

export const TrafegoView: React.FC = () => {
  const [campanhas, setCampanhas] = useState<CampanhaTrafego[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = "https://sothink.com.br/app/api/trafego"; // Aponta para o seu trafego.php

  const fetchCampanhas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=read`);
      const data = await res.json();
      setCampanhas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar tráfego:", err);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const handleAddRow = async (plataforma: "Google" | "Meta") => {
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("plataforma", plataforma);

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      const data = await res.json();
      if (data.sucesso) {
        fetchCampanhas();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (
    id: string,
    field: keyof CampanhaTrafego,
    value: string
  ) => {
    setCampanhas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleBlur = async (campanha: CampanhaTrafego) => {
    if (!campanha.id) return;
    const formData = new FormData();
    formData.append("action", "update");
    Object.entries(campanha).forEach(([key, val]) => {
      formData.append(key, val as string);
    });

    try {
      await fetch(API_URL, { method: "POST", body: formData });
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover esta campanha?")) return;
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("id", id);

    try {
      await fetch(API_URL, { method: "POST", body: formData });
      setCampanhas((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  // ==========================================
  // NOVA FUNÇÃO DE MUDANÇA DE ORDEM
  // ==========================================
  const handleMoveOrder = async (index: number, direction: number, plataforma: string, listaRenderizada: CampanhaTrafego[]) => {
    if (
      (direction === -1 && index === 0) || 
      (direction === 1 && index === listaRenderizada.length - 1)
    ) return;

    // Faz a troca apenas visual (UX instantâneo)
    const novaLista = [...listaRenderizada];
    const itemMovido = novaLista[index];
    novaLista.splice(index, 1);
    novaLista.splice(index + direction, 0, itemMovido);

    const idsOrdenados = novaLista.map(item => item.id);

    // Atualiza o estado misturando a plataforma alterada com a outra plataforma
    setCampanhas(prev => {
      const outrasPlataformas = prev.filter(p => p.plataforma !== plataforma);
      return [...outrasPlataformas, ...novaLista];
    });

    // Envia a nova ordem pro PHP
    const formData = new FormData();
    formData.append("action", "update_order");
    formData.append("ids", JSON.stringify(idsOrdenados));
    await fetch(API_URL, { method: "POST", body: formData });
  };


  const renderTable = (plataforma: "Google" | "Meta") => {
    const listaCampanhas = Array.isArray(campanhas) ? campanhas : [];

    const isFiltered = searchTerm.trim() !== "";

    const dados = listaCampanhas.filter((c) => {
      const nomeEmpresa = c.empresa || "";
      const busca = searchTerm || "";
      return (
        c.plataforma === plataforma &&
        nomeEmpresa.toLowerCase().includes(busca.toLowerCase())
      );
    });

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
          <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
            {plataforma === "Google" ? "🟢 Google Ads" : "🔵 Meta Ads"}
          </h2>
          <button
            onClick={() => handleAddRow(plataforma)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Nova Linha
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-3 py-3 w-16 text-center">Ordem</th>
                <th className="px-3 py-3 w-40">Obs (Status)</th>
                <th className="px-3 py-3 w-32">Atualização</th>
                <th className="px-3 py-3 w-64">Cliente</th>
                <th className="px-3 py-3 w-64">Nome Campanha</th>
                <th className="px-3 py-3 w-32">Último Pag.</th>
                <th className="px-3 py-3 w-32">
                  {plataforma === "Meta" ? "Pagamento" : "Verba"}
                </th>
                <th className="px-3 py-3 w-32">Disponível</th>
                <th className="px-3 py-3 w-32">Orçamento</th>
                <th className="px-3 py-3 w-32">Gasto Diário</th>
                {plataforma === "Meta" && (
                  <th className="px-3 py-3 w-28">Objetivo</th>
                )}
                <th className="px-3 py-3 w-32">Término</th>
                <th className="px-3 py-3 w-10 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 !text-black">
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-6 text-slate-400">
                    Nenhuma campanha cadastrada.
                  </td>
                </tr>
              ) : (
                dados.map((c, index) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {/* Botões de Ordem */}
                    <td className="p-1 text-center">
                      {!isFiltered ? (
                        <div className="flex flex-col items-center justify-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleMoveOrder(index, -1, plataforma, dados)}
                             disabled={index === 0}
                             className="disabled:opacity-20 hover:text-indigo-600"
                           >
                             <ArrowUp className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleMoveOrder(index, 1, plataforma, dados)}
                             disabled={index === dados.length - 1}
                             className="disabled:opacity-20 hover:text-indigo-600"
                           >
                             <ArrowDown className="w-4 h-4" />
                           </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300" title="Remova o filtro para ordenar">-</span>
                      )}
                    </td>

                    <td className="p-1">
                      <select
                        value={c.status_obs || ""}
                        onChange={(e) =>
                          handleChange(c.id!, "status_obs", e.target.value)
                        }
                        onBlur={() => handleBlur(c)}
                        className={`w-full px-2 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded outline-none font-bold ${
                          c.status_obs === "OK"
                            ? "text-emerald-600"
                            : c.status_obs === "PAUSADA"
                            ? "text-rose-500"
                            : c.status_obs === "AGUARDANDO PUBLICAÇÃO"
                            ? "text-amber-500"
                            : "text-slate-700"
                        }`}
                      >
                        <option value="" className="text-slate-700">Selecione...</option>
                        <option value="OK" className="text-emerald-600">OK</option>
                        <option value="AGUARDANDO PUBLICAÇÃO" className="text-amber-500">AGUARDANDO PUBLICAÇÃO</option>
                        <option value="PAUSADA" className="text-rose-500">PAUSADA</option>
                      </select>
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        value={formatDateForInput(c.data_atualizacao)}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "data_atualizacao",
                            formatDateForDB(e.target.value)
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent text-black focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c?.empresa || ""}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "empresa",
                            e.target.value
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none font-semibold text-slate-800"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c?.campanha || ""}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "campanha",
                            e.target.value
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none font-semibold text-slate-800"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        value={formatDateForInput(c.ultimo_pagamento)}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "ultimo_pagamento",
                            formatDateForDB(e.target.value)
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-black"
                      />
                    </td>
                    <td className="p-1">
                      <div className="flex items-center">
                        <span className="text-slate-400 font-semibold pl-2">R$</span>
                        <input
                          type="text"
                          value={c.verba_total || ""}
                          placeholder="0,00"
                          onChange={(e) =>
                            handleChange(c.id!, "verba_total", e.target.value)
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-1 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-slate-700"
                        />
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="flex items-center">
                        <span className="text-slate-400 font-semibold pl-2">R$</span>
                        <input
                          type="text"
                          value={c.verba_disponivel || ""}
                          placeholder="0,00"
                          onChange={(e) =>
                            handleChange(
                              c.id!,
                              "verba_disponivel",
                              e.target.value
                            )
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-1 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-slate-700"
                        />
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="flex items-center">
                        <span className="text-slate-400 font-semibold pl-2">R$</span>
                        <input
                          type="text"
                          value={c.orcamento_diario || ""}
                          placeholder="0,00"
                          onChange={(e) =>
                            handleChange(
                              c.id!,
                              "orcamento_diario",
                              e.target.value
                            )
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-1 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-slate-700"
                        />
                      </div>
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.gasto_diario || ""}
                        placeholder="ex: 30(S) 15(S)"
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "gasto_diario",
                            e.target.value
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-slate-700 font-medium"
                      />
                    </td>
                    {plataforma === "Meta" && (
                      <td className="p-1">
                        <input
                          type="text"
                          value={c.objetivo || ""}
                          placeholder="Whats App / Leads"
                          onChange={(e) =>
                            handleChange(c.id!, "objetivo", e.target.value)
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-2 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-slate-700"
                        />
                      </td>
                    )}
                    <td className="p-1">
                      <input
                        type="date"
                        value={formatDateForInput(c.data_termino)}
                        onChange={(e) =>
                          handleChange(
                            c.id!, 
                            "data_termino", 
                            formatDateForDB(e.target.value)
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-black"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => handleDelete(c.id!)}
                        className="p-1.5 text-red-600 hover:text-rose-500 hover:bg-rose-50 rounded opacity-100 group-hover:opacity-100 transition-all"
                        title="Deletar Linha"
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
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Tráfego Pago
          </h1>
          <p className="text-xs text-slate-900 dark:text-white mt-1">
            Planilha de controle de Google e Meta Ads (Salva automaticamente ao
            digitar)
          </p>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar campanha..."
            className="w-full pl-8 pr-3 py-2 text-black bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/40 outline-none"
          />
        </div>
      </div>

      {renderTable("Google")}
      {renderTable("Meta")}
    </div>
  );
};