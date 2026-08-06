import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Search, GripVertical } from "lucide-react";

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

// Função para ocultar null, "null", undefined, 0 ou "0"
const safeValue = (val: any) => {
  if (val === null || val === "null" || val === undefined || val === 0 || val === "0") return "";
  return val;
};

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
  const [dragInfo, setDragInfo] = useState<{index: number | null, plataforma: string | null}>({index: null, plataforma: null});

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
  // FUNÇÕES DE MUDANÇA DE ORDEM (DRAG & DROP)
  // ==========================================
  const handleDragStart = (e: React.DragEvent, index: number, plataforma: string) => {
    setDragInfo({ index, plataforma });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, targetPlataforma: string, listaFiltrada: CampanhaTrafego[]) => {
    e.preventDefault();
    
    // Não permite arrastar entre plataformas (ex: Google para Meta) nem soltar no mesmo lugar
    if (dragInfo.plataforma !== targetPlataforma || dragInfo.index === null || dragInfo.index === targetIndex) {
        setDragInfo({index: null, plataforma: null});
        return;
    }

    const novaLista = [...listaFiltrada];
    const itemMovido = novaLista[dragInfo.index];
    
    // Move o item na lista localmente
    novaLista.splice(dragInfo.index, 1);
    novaLista.splice(targetIndex, 0, itemMovido);

    const idsOrdenados = novaLista.map((item) => item.id);

    // Atualiza o state mantendo os itens da outra plataforma intocados
    setCampanhas((prev) => {
      const outrasPlataformas = prev.filter((p) => p.plataforma !== targetPlataforma);
      return [...outrasPlataformas, ...novaLista];
    });
    
    setDragInfo({index: null, plataforma: null});

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
            {plataforma === "Google" ? (
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4" />
            ) : (
              <img src="data:image/webp;base64,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" alt="Meta" className="h-3 w-auto object-contain" />
            )}
            {plataforma} Ads
          </h2>
          <button
            onClick={() => handleAddRow(plataforma)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Linha
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-3 py-3 w-10 text-center"></th>
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
                  <td colSpan={13} className="text-center py-8 text-slate-400">
                    Nenhuma campanha cadastrada.
                  </td>
                </tr>
              ) : (
                dados.map((c, index) => {
                  // Lógica de cores do STATUS
                  const statusVal = safeValue(c.status_obs);
                  const statusColor = 
                    statusVal === "OK" ? "text-emerald-700 bg-emerald-100" :
                    statusVal === "PAUSADA" ? "text-rose-700 bg-rose-100" :
                    statusVal === "AGUARDANDO PUBLICAÇÃO" ? "text-amber-700 bg-amber-100" :
                    "text-slate-600 hover:bg-slate-100 bg-transparent";

                  return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/70 transition-colors group ${dragInfo.index === index && dragInfo.plataforma === plataforma ? "opacity-50 bg-slate-100" : ""}`}
                    draggable={!isFiltered}
                    onDragStart={(e) => !isFiltered && handleDragStart(e, index, plataforma)}
                    onDragOver={(e) => !isFiltered && handleDragOver(e)}
                    onDrop={(e) => !isFiltered && handleDrop(e, index, plataforma, dados)}
                  >
                    {/* COLUNA DE ORDENAÇÃO (DRAG) */}
                    <td className="p-1 text-center text-slate-400">
                      {!isFiltered ? (
                        <div className="cursor-grab hover:text-indigo-600 flex justify-center w-full transition-colors" title="Arraste para reordenar">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300" title="Remova o filtro para ordenar">-</span>
                      )}
                    </td>

                    <td className="p-1">
                      <select
                        value={statusVal}
                        onChange={(e) =>
                          handleChange(c.id!, "status_obs", e.target.value)
                        }
                        onBlur={() => handleBlur(c)}
                        className={`w-full px-2 py-1.5 rounded outline-none font-bold cursor-pointer transition-colors ${statusColor}`}
                      >
                        <option value="" className="text-slate-700 bg-white">Selecione...</option>
                        <option value="OK" className="text-emerald-700 bg-white">OK</option>
                        <option value="AGUARDANDO PUBLICAÇÃO" className="text-amber-700 bg-white">AGUARDANDO PUBLICAÇÃO</option>
                        <option value="PAUSADA" className="text-rose-700 bg-white">PAUSADA</option>
                      </select>
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        value={formatDateForInput(safeValue(c.data_atualizacao))}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "data_atualizacao",
                            formatDateForDB(e.target.value)
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 text-black focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={safeValue(c.empresa)}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "empresa",
                            e.target.value
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none font-bold text-slate-800 transition-colors"
                        placeholder="Empresa"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={safeValue(c.campanha)}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "campanha",
                            e.target.value
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none font-semibold text-slate-700 transition-colors"
                        placeholder="Nome da Campanha"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        value={formatDateForInput(safeValue(c.ultimo_pagamento))}
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "ultimo_pagamento",
                            formatDateForDB(e.target.value)
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-black transition-colors"
                      />
                    </td>
                    
                    {/* CAMPOS COM VALORES R$ (Efeito esverdeado) */}
                    <td className="p-1">
                      <div className="flex items-center rounded hover:bg-emerald-50 focus-within:bg-emerald-50 transition-colors">
                        <span className="text-emerald-700/60 font-bold text-[10px] pl-1 mr-0.5">R$</span>
                        <input
                          type="text"
                          value={safeValue(c.verba_total)}
                          placeholder="0,00"
                          onChange={(e) =>
                            handleChange(c.id!, "verba_total", e.target.value)
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-1 py-1.5 bg-transparent border-transparent focus:text-emerald-800 rounded outline-none text-slate-700 font-medium"
                        />
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="flex items-center rounded hover:bg-emerald-50 focus-within:bg-emerald-50 transition-colors">
                        <span className="text-emerald-700/60 font-bold text-[10px] pl-1 mr-0.5">R$</span>
                        <input
                          type="text"
                          value={safeValue(c.verba_disponivel)}
                          placeholder="0,00"
                          onChange={(e) =>
                            handleChange(
                              c.id!,
                              "verba_disponivel",
                              e.target.value
                            )
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-1 py-1.5 bg-transparent border-transparent focus:text-emerald-800 rounded outline-none text-slate-700 font-medium"
                        />
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="flex items-center rounded hover:bg-emerald-50 focus-within:bg-emerald-50 transition-colors">
                        <span className="text-emerald-700/60 font-bold text-[10px] pl-1 mr-0.5">R$</span>
                        <input
                          type="text"
                          value={safeValue(c.orcamento_diario)}
                          placeholder="0,00"
                          onChange={(e) =>
                            handleChange(
                              c.id!,
                              "orcamento_diario",
                              e.target.value
                            )
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-1 py-1.5 bg-transparent border-transparent focus:text-emerald-800 rounded outline-none text-slate-700 font-medium"
                        />
                      </div>
                    </td>

                    <td className="p-1">
                      <input
                        type="text"
                        value={safeValue(c.gasto_diario)}
                        placeholder="ex: 30(S) 15(S)"
                        onChange={(e) =>
                          handleChange(
                            c.id!,
                            "gasto_diario",
                            e.target.value
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-slate-700 font-medium transition-colors"
                      />
                    </td>
                    {plataforma === "Meta" && (
                      <td className="p-1">
                        <input
                          type="text"
                          value={safeValue(c.objetivo)}
                          placeholder="Whats App / Leads"
                          onChange={(e) =>
                            handleChange(c.id!, "objetivo", e.target.value)
                          }
                          onBlur={() => handleBlur(c)}
                          className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-slate-700 transition-colors"
                        />
                      </td>
                    )}
                    <td className="p-1">
                      <input
                        type="date"
                        value={formatDateForInput(safeValue(c.data_termino))}
                        onChange={(e) =>
                          handleChange(
                            c.id!, 
                            "data_termino", 
                            formatDateForDB(e.target.value)
                          )
                        }
                        onBlur={() => handleBlur(c)}
                        className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-100/50 focus:bg-white border-transparent focus:border-indigo-500 focus:ring-1 rounded outline-none text-black transition-colors"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => handleDelete(c.id!)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Deletar Linha"
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
            className="w-full pl-8 pr-3 py-2 text-black bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
          />
        </div>
      </div>

      {renderTable("Google")}
      {renderTable("Meta")}
    </div>
  );
};