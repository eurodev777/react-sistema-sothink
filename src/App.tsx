import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Toast, ToastType } from "./components/Toast";
import { DashboardView } from "./components/DashboardView";
import { ClientsView } from "./components/ClientsView";
import { AtasView } from "./components/AtasView";
import { JobsKanbanView, KANBAN_COLUMNS } from "./components/JobsKanbanView";
import { RelatoriosView } from "./components/RelatoriosView";
import { ClientPortalView } from "./components/ClientPortalView";
import { LoginModal } from "./components/LoginModal";

import {
  EmpresaCliente,
  AtaReuniao,
  Job,
  ChecklistTemplate,
  User,
  JobStatus,
  JobUrgencia,
  Relatorio,
  Anexo,
} from "./types";
import {
  INITIAL_CLIENTES,
  INITIAL_ATAS,
  INITIAL_JOBS,
  INITIAL_CHECKLIST_TEMPLATES as INITIAL_TEMPLATES,
  INITIAL_USERS,
  INITIAL_RELATORIOS,
} from "./data/mockData";
import { apiService } from "./services/apiService";
import {
  Plus,
  X,
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Menu,
} from "lucide-react";
import { TrafegoView } from "./components/TrafegoView";
import { DashboardTrafego } from "./components/DashboardTrafego";

export function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [clientPortalObj, setClientPortalObj] = useState<EmpresaCliente | null>(
    null
  );

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "clientes" | "atas" | "jobs" | "relatorios" | "trafego"
  >("dashboard");

  // Toast Notification State
  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    title: string;
    desc?: string;
  }>({
    show: false,
    type: "success",
    title: "",
  });

  const showToast = (type: ToastType, title: string, desc?: string) => {
    setToast({ show: true, type, title, desc });
  };

  // Main Data States
  const [atas, setAtas] = useState<AtaReuniao[]>(INITIAL_ATAS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [templates, setTemplates] =
    useState<ChecklistTemplate[]>(INITIAL_TEMPLATES);
  const [relatorios, setRelatorios] = useState<Relatorio[]>(INITIAL_RELATORIOS);

  // Navigation Deep Links / Pre-selections
  const [preSelectedClientForAta, setPreSelectedClientForAta] =
    useState<EmpresaCliente | null>(null);
  const [selectedJobForKanbanModal, setSelectedJobForKanbanModal] =
    useState<Job | null>(null);

  // Quick Create Job Modal State
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [newJobData, setNewJobData] = useState<Partial<Job>>({
    cliente_id: "",
    titulo_job: "",
    urgencia: "Médio",
    responsavel: "",
    data_inicio: new Date().toISOString().split("T")[0],
    data_entrega: "",
    briefing: "",
    etiquetas: ["SOCIAL"],
  });
  const [clientes, setClientes] = useState<EmpresaCliente[]>([]);
  // NOVO: Estado para controlar a Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  React.useEffect(() => {
    const carregarClientes = async () => {
      try {
        const response = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=clientes"
        );
        const data = await response.json();
        setClientes(data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };
    carregarClientes();
  }, []);

  // Verificar se já existe uma sessão salva no localStorage ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem("@d2r:user");
    const savedClientPortal = localStorage.getItem("@d2r:clientPortal");

    if (savedClientPortal) {
      try {
        setClientPortalObj(JSON.parse(savedClientPortal));
      } catch (e) {
        localStorage.removeItem("@d2r:clientPortal");
      }
    } else if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("@d2r:user");
      }
    }
  }, []);

  // Apply Dark Mode Class to HTML
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Load Initial Data from API (with fallback to mock data)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [cRes, aRes, jRes, tRes, rRes] = await Promise.all([
          apiService.getClientes(),
          apiService.getAtas(),
          apiService.getJobs(),
          apiService.getTemplates(),
          apiService.getRelatorios(),
        ]);

        if (cRes.success && cRes.data) setClientes(cRes.data);
        if (aRes.success && aRes.data) setAtas(aRes.data);
        if (jRes.success && jRes.data) setJobs(jRes.data);
        if (tRes.success && tRes.data) setTemplates(tRes.data);
        if (rRes.success && rRes.data) setRelatorios(rRes.data);
      } catch (e) {
        console.warn(
          "Usando dados mockados locais enquanto o servidor carrega."
        );
      }
    };
    loadAllData();
  }, []);

  // CRUD Handlers for Relatorios
  const handleSaveRelatorio = async (relatorioData: Partial<Relatorio>) => {
    const res = await apiService.saveRelatorio(relatorioData);
    if (res.success && res.data) {
      if (relatorioData.id) {
        setRelatorios((prev) =>
          prev.map((r) => (r.id === res.data.id ? res.data : r))
        );
      } else {
        setRelatorios((prev) => [res.data, ...prev]);
      }
    }
  };

  const handleDeleteRelatorio = async (id: string) => {
    const res = await apiService.deleteRelatorio(id);
    if (res.success) {
      setRelatorios((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // CRUD Handlers for Clients
  const handleSaveCliente = async (clienteData: Partial<EmpresaCliente>) => {
    const res = await apiService.saveCliente(clienteData);
    if (res.success && res.data) {
      if (clienteData.id) {
        setClientes((prev) =>
          prev.map((c) => (c.id === res.data.id ? res.data : c))
        );
      } else {
        setClientes((prev) => [res.data, ...prev]);
      }
    }
  };

  const handleDeleteCliente = async (id: string) => {
    const res = await apiService.deleteCliente(id);
    if (res.success) {
      setClientes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // CRUD Handlers for Atas
  const handleSaveAta = async (ataData: Partial<AtaReuniao>) => {
    const res = await apiService.saveAta(ataData);
    if (res.success && res.data) {
      if (ataData.id) {
        setAtas((prev) =>
          prev.map((a) => (a.id === res.data.id ? res.data : a))
        );
      } else {
        setAtas((prev) => [res.data, ...prev]);
      }
    }
  };

  const handleDeleteAta = async (id: string) => {
    const res = await apiService.deleteAta(id);
    if (res.success) {
      setAtas((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // CRUD Handlers for Jobs
  const handleSaveJob = async (jobData: Partial<Job>) => {
    const res = await apiService.saveJob(jobData);
    if (res.success && res.data) {
      if (jobData.id) {
        setJobs((prev) =>
          prev.map((j) => (j.id === res.data.id ? res.data : j))
        );
      } else {
        setJobs((prev) => [res.data, ...prev]);
      }
    }
  };

  const handleDeleteJob = async (id: string) => {
    const res = await apiService.deleteJob(id);
    if (res.success) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  };

  // Quick Create Job Submit
  const handleCreateNewJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newJobData.cliente_id || !newJobData.titulo_job) {
      showToast(
        "error",
        "Campos Obrigatórios",
        "Selecione o cliente e informe o título do job."
      );
      return;
    }

    try {
      const cliente = clientes.find((c) => c.id === newJobData.cliente_id);
      const form = new FormData();

      form.append("tabela", "jobs");
      form.append("cliente_id", newJobData.cliente_id);
      form.append("titulo", newJobData.titulo_job || "");
      form.append("briefing", newJobData.briefing || "");
      form.append("descricao", "");
      form.append("prioridade", newJobData.urgencia || "Médio");
      form.append("status", "Novos Jobs (Análise)");

      // Enviando data_criacao e data_inicio para API
      form.append("data_criacao", new Date().toISOString().slice(0, 10));
      form.append("data_inicio", newJobData.data_inicio || "");
      form.append("data_entrega", newJobData.data_entrega || "");

      // A MÁGICA DO USUÁRIO LOGADO AQUI:
      const responsavelParaSalvar = newJobData.responsavel
        ? newJobData.responsavel
        : user?.nome || "";
      form.append("responsavel", responsavelParaSalvar);

      form.append("etiquetas", JSON.stringify([]));
      form.append("permitir_acesso_cliente", "0");

      const response = await fetch(
        "https://sothink.com.br/app/api/inserir?tabela=jobs",
        {
          method: "POST",
          body: form,
        }
      );

      const texto = await response.text();
      let result;

      try {
        result = JSON.parse(texto);
      } catch {
        throw new Error("Resposta da API:\n" + texto);
      }

      if (result.erro) {
        throw new Error(result.erro);
      }

      setNewJobModalOpen(false);

      // Resetando os dados após criar e restaurando data_inicio pro dia atual
      setNewJobData({
        cliente_id: "",
        titulo_job: "",
        urgencia: "Médio",
        data_inicio: new Date().toISOString().split("T")[0],
        data_entrega: "",
        briefing: "",
        anexos: [],
      });

      showToast(
        "success",
        "Novo Job Criado!",
        `${
          cliente?.nome_fantasia || cliente?.razao_social
        } adicionado no Kanban.`
      );

      setActiveTab("jobs");
      window.location.reload();
    } catch (err: any) {
      showToast("error", "Erro ao criar Job", err.message);
    }
  };

  // Render Portal do Cliente view if logged in as a Client
  if (clientPortalObj) {
    return (
      <ClientPortalView
        client={clientPortalObj}
        jobs={jobs}
        relatorios={relatorios}
        onLogoutClient={() => {
          localStorage.removeItem("@d2r:user");
          localStorage.removeItem("@d2r:clientPortal");
          setClientPortalObj(null);
          setUser(null);
          showToast("info", "Sessão Encerrada");
        }}
        onSaveJob={handleSaveJob}
        showToast={showToast}
      />
    );
  }

  // Não logado -> mostra apenas a tela de login
  if (!user && !clientPortalObj) {
    return (
      <LoginModal
        onLoginSuccess={(u, clientObj) => {
          if (clientObj) {
            setClientPortalObj(clientObj);
          } else {
            setUser(u);
          }
        }}
        showToast={showToast}
      />
    );
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard Geral";
      case "clientes":
        return "CRM de Clientes";
      case "atas":
        return "Atas de Reunião";
      case "jobs":
        return "Controle de Jobs";
      case "relatorios":
        return "Relatórios de Tráfego";
      case "trafego":
        return "Gestão de Tráfego Pago";
      default:
        return "Controle de Jobs";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      <Toast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        description={toast.desc}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Main Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        currentUser={user}
        onLogout={() => {
          localStorage.removeItem("@d2r:user");
          localStorage.removeItem("@d2r:clientPortal");
          setUser(null);
          setClientPortalObj(null);
        }}
        showToast={showToast}
        activeTabTitle={getTabTitle()}
        isDashboard={activeTab === "dashboard"}
        onBackToDashboard={() => setActiveTab("dashboard")}
      />

      {/* App Body Layout */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Container da Sidebar com animação de largura */}
        <div
          className={`${
            isSidebarOpen ? "w-64" : "w-0 md:w-12"
          } transition-all duration-300 ease-in-out flex-shrink-0 z-10 bg-white dark:bg-slate-900`}
        >
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            clientesCount={clientes.length}
            atasCount={atas.length}
            jobsCount={jobs.length}
            collapsed={!isSidebarOpen}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 w-full overflow-x-hidden overflow-y-auto">
          {/* NOVO: Botão rápido para abrir/fechar o menu caso não queira colocar no Header */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mb-4 cursor-pointer flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {isSidebarOpen ? "Ocultar Menu" : "Mostrar Menu"}
            </span>
          </button>
          {activeTab === "dashboard" && (
            <DashboardView
              clientes={clientes}
              atas={atas}
              jobs={jobs}
              onOpenNewCliente={() => setActiveTab("clientes")}
              onOpenNewAta={() => {
                setPreSelectedClientForAta(null);
                setActiveTab("atas");
              }}
              onOpenNewJob={() => setNewJobModalOpen(true)}
              onSelectJob={(j) => {
                setSelectedJobForKanbanModal(j);
                setActiveTab("jobs");
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "clientes" && (
            <ClientsView
              clientes={clientes}
              atas={atas}
              jobs={jobs}
              onSaveCliente={handleSaveCliente}
              onDeleteCliente={handleDeleteCliente}
              onSelectJob={(j) => {
                setSelectedJobForKanbanModal(j);
                setActiveTab("jobs");
              }}
              onOpenNewAtaForClient={(comp) => {
                setPreSelectedClientForAta(comp);
                setActiveTab("atas");
              }}
              onOpenNewJobForClient={(comp) => {
                setNewJobData((prev) => ({ ...prev, cliente_id: comp.id }));
                setNewJobModalOpen(true);
              }}
              showToast={showToast}
            />
          )}

          {activeTab === "atas" && (
            <AtasView
              atas={atas}
              clientes={clientes}
              onSaveAta={handleSaveAta}
              onDeleteAta={handleDeleteAta}
              showToast={showToast}
              preSelectedClient={preSelectedClientForAta}
            />
          )}

          {activeTab === "jobs" && (
            <JobsKanbanView
              jobs={jobs}
              clientes={clientes}
              templates={templates}
              currentUser={user}
              onSaveJob={handleSaveJob}
              onDeleteJob={handleDeleteJob}
              showToast={showToast}
              selectedJobFromApp={selectedJobForKanbanModal}
              onClearSelectedJob={() => setSelectedJobForKanbanModal(null)}
              onOpenNewJobModal={() => setNewJobModalOpen(true)}
            />
          )}

          {activeTab === "relatorios" && (
            <RelatoriosView
              relatorios={relatorios}
              clientes={clientes}
              onSaveRelatorio={handleSaveRelatorio}
              onDeleteRelatorio={handleDeleteRelatorio}
              showToast={showToast}
            />
          )}

          {activeTab === "trafego" && <DashboardTrafego />}
        </main>
      </div>

      {/* Global Quick New Job Modal */}
      {newJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Criar Novo Job no Kanban
              </h3>
              <button
                onClick={() => setNewJobModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateNewJobSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cliente Solicitante *
                </label>
                <select
                  required
                  value={newJobData.cliente_id}
                  onChange={(e) =>
                    setNewJobData({ ...newJobData, cliente_id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="">Selecione a empresa cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome_fantasia || c.razao_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Job *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Campanha Tráfego Reels Black Friday"
                  value={newJobData.titulo_job}
                  onChange={(e) =>
                    setNewJobData({ ...newJobData, titulo_job: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              {/* Trocado grid-cols-2 por grid-cols-3 para incluir Data Início */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grau de Urgência
                  </label>
                  <select
                    value={newJobData.urgencia}
                    onChange={(e) =>
                      setNewJobData({
                        ...newJobData,
                        urgencia: e.target.value as JobUrgencia,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={newJobData.data_inicio}
                    onChange={(e) =>
                      setNewJobData({
                        ...newJobData,
                        data_inicio: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Entrega
                  </label>
                  <input
                    type="date"
                    value={newJobData.data_entrega}
                    onChange={(e) =>
                      setNewJobData({
                        ...newJobData,
                        data_entrega: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Briefing Inicial
                </label>
                <textarea
                  rows={3}
                  value={newJobData.briefing}
                  onChange={(e) =>
                    setNewJobData({ ...newJobData, briefing: e.target.value })
                  }
                  placeholder="Resumo das necessidades e especificações do cliente..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewJobModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Criar Job no Kanban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
