import React, { useState, useEffect } from "react";

import { Header } from "./components/Header";

import { Sidebar } from "./components/Sidebar";

import { Toast, ToastType } from "./components/Toast";

import { DashboardView } from "./components/DashboardView";

import { ClientsView } from "./components/ClientsView";

import { AtasView } from "./components/AtasView";

import {
  JobsKanbanView,
  KANBAN_COLUMNS,
  TAGS_PRESETS,
} from "./components/JobsKanbanView";

import { RelatoriosView } from "./components/RelatoriosView";

import { ClientPortalView } from "./components/ClientPortalView";

import { LoginModal } from "./components/LoginModal";

import {
  EmpresaCliente,
  AtaReuniao,
  Job,
  ChecklistTemplate,
  User,
  JobUrgencia,
  Relatorio,
} from "./types";

import { apiService } from "./services/apiService";

import { Link2, Menu, Paperclip, Plus, Trash2, X } from "lucide-react";

import { DashboardTrafego } from "./components/DashboardTrafego";

import { RHView } from "./components/RHView";

import { Leads } from "./components/Leads";
import { OperacionalView } from "./components/OperacionalView";

export function App() {
  // Theme state

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Authentication State

  const [user, setUser] = useState<User | null>(null);

  const [clientPortalObj, setClientPortalObj] = useState<EmpresaCliente | null>(
    null,
  );

  // Active Tab State

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "clientes"
    | "rh"
    | "atas"
    | "jobs"
    | "operacional"
    | "relatorios"
    | "trafego"
    | "leads"
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

  const [permissoes, setPermissoes] = useState<any[]>([]);

  // Enquanto as permissões não terminarem de carregar,
  // nenhuma área protegida é liberada.
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);

  // Main Data States - INICIANDO 100% VAZIOS (SEM MOCK)

  const [atas, setAtas] = useState<AtaReuniao[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [jobs, setJobs] = useState<Job[]>([]);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);

  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);

  const [clientes, setClientes] = useState<EmpresaCliente[]>([]);

  // Navigation Deep Links / Pre-selections

  const [preSelectedClientForAta, setPreSelectedClientForAta] =
    useState<EmpresaCliente | null>(null);

  const [selectedJobForKanbanModal, setSelectedJobForKanbanModal] =
    useState<Job | null>(null);

  // Quick Create Job Modal State

  const [newJobModalOpen, setNewJobModalOpen] = useState(false);

  const [newJobFiles, setNewJobFiles] = useState<File[]>([]);
  const [newJobLinksText, setNewJobLinksText] = useState("");

  const [newJobData, setNewJobData] = useState<Partial<Job>>({
    cliente_id: "",

    titulo_job: "",

    urgencia: "Médio" as JobUrgencia,

    responsavel: "",

    status: "Novos Jobs (Análise)",

    data_inicio: new Date().toISOString().split("T")[0],

    data_entrega: "",

    briefing: "",

    etiquetas: ["SOCIAL"],
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => {
    const carregarPermissoes = async () => {
      if (!user?.id) {
        setPermissoes([]);
        setPermissoesCarregadas(false);
        return;
      }

      setPermissoesCarregadas(false);

      try {
        const response = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=usuarios_permissoes",
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível carregar as permissões do usuário.",
          );
        }

        const data = await response.json();

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.dados)
            ? data.dados
            : [];

        // Guarda somente as permissões do usuário logado.
        const permissoesDoUsuario = lista.filter(
          (p: any) => String(p.usuario_id) === String(user.id),
        );

        setPermissoes(permissoesDoUsuario);
      } catch (error) {
        console.error("Erro ao carregar permissões:", error);

        // Falha segura: se der erro, não libera módulos protegidos.
        setPermissoes([]);
      } finally {
        setPermissoesCarregadas(true);
      }
    };

    carregarPermissoes();
  }, [user?.id]);

  const temPermissao = (quadro: string) => {
    if (!user || !permissoesCarregadas) return false;

    // IMPORTANTE:
    // Não existe mais bypass de admin/administrador.
    // Todo usuário interno respeita exatamente o que foi marcado no RH.
    const permissao = permissoes.find(
      (p) => String(p.quadro) === String(quadro),
    );

    if (!permissao) return false;

    return (
      permissao.permitido === true ||
      permissao.permitido === 1 ||
      permissao.permitido === "1" ||
      permissao.permitido === "true"
    );
  };

  const podeAcessarAba = (tab: string) => {
    if (tab === "dashboard") return true;

    const mapaPermissoes: Record<string, string> = {
      clientes: "clientes",
      rh: "usuarios",
      atas: "atas_reuniao",
      jobs: "jobs",
      operacional: "jobs",
      relatorios: "relatorios_performance",
      trafego: "trafego",
      leads: "leads",
    };

    const quadro = mapaPermissoes[tab];

    if (!quadro) return false;

    return temPermissao(quadro);
  };

  // Se o usuário estiver numa aba que perdeu permissão,
  // volta imediatamente para o Dashboard.
  useEffect(() => {
    if (!user || !permissoesCarregadas) return;

    if (activeTab !== "dashboard" && !podeAcessarAba(activeTab)) {
      setActiveTab("dashboard");
    }
  }, [activeTab, user, permissoes, permissoesCarregadas]);

  // Apply Dark Mode Class to HTML

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // CARREGAMENTO ÚNICO DE DADOS DIRETAMENTE DO BANCO DE DADOS (SEM API MOCKADA)

  useEffect(() => {
    const carregarTudoDoBanco = async () => {
      try {
        // Clientes

        const resClientes = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=clientes",
        );

        const dataClientes = await resClientes.json();

        if (Array.isArray(dataClientes)) setClientes(dataClientes);

        // Jobs

        const resJobs = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=jobs",
        );

        const dataJobs = await resJobs.json();

        if (Array.isArray(dataJobs)) setJobs(dataJobs);

        // Atas

        const resAtas = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=atas_reuniao",
        );

        const dataAtas = await resAtas.json();

        if (Array.isArray(dataAtas)) setAtas(dataAtas);

        // Relatorios

        const resRelat = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=relatorios",
        );

        const dataRelat = await resRelat.json();

        if (Array.isArray(dataRelat)) setRelatorios(dataRelat);

        // Colaboradores

        const resUsers = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=usuarios",
        );

        const dataUsers = await resUsers.json();

        console.log("USUÁRIOS API:", dataUsers);

        if (Array.isArray(dataUsers)) {
          setUsers(dataUsers);
        } else if (Array.isArray(dataUsers?.dados)) {
          setUsers(dataUsers.dados);
        } else {
          setUsers([]);
        }

        // Templates (tentativa de buscar real, se der erro ignora para não quebrar)

        try {
          const resTemp = await fetch(
            "https://sothink.com.br/app/api/listar?tabela=templates",
          );

          const dataTemp = await resTemp.json();

          if (Array.isArray(dataTemp)) setTemplates(dataTemp);
        } catch (e) {}
      } catch (error) {
        console.error("Erro ao carregar dados do banco:", error);
      }
    };

    // Só carrega os dados se houver um usuário ou cliente logado para otimizar

    if (user || clientPortalObj) {
      carregarTudoDoBanco();
    }
  }, [user, clientPortalObj]); // Recarrega os dados ao logar

  // Função auxiliar para recarregar apenas os jobs após criar um novo

  const fetchAllJobsApp = async () => {
    try {
      const response = await fetch(
        "https://sothink.com.br/app/api/listar?tabela=jobs",
      );

      const data = await response.json();

      if (Array.isArray(data)) setJobs(data);
    } catch (error) {
      console.error("Erro ao atualizar jobs:", error);
    }
  };

  // CRUD Handlers for Relatorios

  const handleSaveRelatorio = async (relatorioData: Partial<Relatorio>) => {
    const res = await apiService.saveRelatorio(relatorioData);

    if (res.success && res.data) {
      if (relatorioData.id) {
        setRelatorios((prev) =>
          prev.map((r) => (r.id === res.data.id ? res.data : r)),
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
          prev.map((c) => (c.id === res.data.id ? res.data : c)),
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
          prev.map((a) => (a.id === res.data.id ? res.data : a)),
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
    // Quando o Kanban salva internamente, ele já chama a API.

    // Para manter a tela sincronizada, nós podemos simplesmente atualizar o estado aqui também.

    setJobs((prev) =>
      prev.map((j) => (j.id === jobData.id ? { ...j, ...jobData } : j)),
    );
  };

  const handleDeleteJob = async (id: string) => {
    // Já é deletado no banco pelo componente JobsKanbanView, aqui só atualizamos a UI

    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const openNewJobFromAta = (cliente: EmpresaCliente, ata?: AtaReuniao) => {
    const hoje = new Date().toISOString().split("T")[0];
    const ataData = (ata || {}) as any;

    const briefingPartes = ata
      ? [
          ataData.assuntos_discutidos || ataData.assuntos
            ? `ASSUNTOS DISCUTIDOS:\n${ataData.assuntos_discutidos || ataData.assuntos}`
            : "",
          ataData.decisoes ? `DECISÕES:\n${ataData.decisoes}` : "",
          ataData.pendencias ? `PENDÊNCIAS:\n${ataData.pendencias}` : "",
          ataData.proximos_passos
            ? `PRÓXIMOS PASSOS:\n${ataData.proximos_passos}`
            : "",
          ataData.observacoes ? `OBSERVAÇÕES:\n${ataData.observacoes}` : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

    setNewJobData({
      cliente_id: cliente.id,
      titulo_job: ataData.objetivo
        ? String(ataData.objetivo)
        : "Novo Job da Ata de Reunião",
      urgencia: "Médio" as JobUrgencia,
      responsavel: ataData.responsavel || user?.nome || "",
      status: "Novos Jobs (Análise)",
      data_inicio: hoje,
      data_entrega: "",
      briefing: briefingPartes,
      etiquetas: ["SOCIAL"],
    });

    setNewJobFiles([]);
    setNewJobLinksText("");
    setNewJobModalOpen(true);
  };

  const normalizeJobLinks = (value: string) =>
    Array.from(
      new Set(
        value
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) =>
            /^https?:\/\//i.test(item) ? item : `https://${item}`,
          ),
      ),
    );

  // Quick Create Job Submit

  const handleCreateNewJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newJobData.cliente_id || !newJobData.titulo_job) {
      showToast(
        "error",

        "Campos Obrigatórios",

        "Selecione o cliente e informe o título do job.",
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

      form.append("prioridade", String(newJobData.urgencia || "Médio"));

      form.append(
        "status",
        String(newJobData.status || "Novos Jobs (Análise)"),
      );

      form.append("data_criacao", new Date().toISOString().slice(0, 10));

      form.append("data_inicio", newJobData.data_inicio || "");

      form.append("data_entrega", newJobData.data_entrega || "");

      const responsavelParaSalvar = newJobData.responsavel
        ? newJobData.responsavel
        : user?.nome || "";

      form.append("responsavel", responsavelParaSalvar);

      form.append(
        "etiquetas",
        JSON.stringify(
          Array.isArray(newJobData.etiquetas)
            ? newJobData.etiquetas
            : ["SOCIAL"],
        ),
      );

      form.append("permitir_acesso_cliente", "0");
      form.append("links", JSON.stringify(normalizeJobLinks(newJobLinksText)));

      newJobFiles.forEach((file) => {
        form.append("arquivos[]", file);
      });

      const response = await fetch(
        "https://sothink.com.br/app/api/inserir?tabela=jobs",

        {
          method: "POST",

          body: form,
        },
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

      // Resetando formulário

      setNewJobData({
        cliente_id: "",

        titulo_job: "",

        urgencia: "Médio" as JobUrgencia,

        responsavel: "",

        status: "Novos Jobs (Análise)",

        data_inicio: new Date().toISOString().split("T")[0],

        data_entrega: "",

        briefing: "",

        etiquetas: ["SOCIAL"],
      });
      setNewJobFiles([]);
      setNewJobLinksText("");

      showToast(
        "success",

        "Novo Job Criado!",

        `${cliente?.nome_fantasia || cliente?.razao_social} adicionado no Kanban.`,
      );

      // Atualiza a lista em segundo plano puxando as infos fresquinhas do banco

      await fetchAllJobsApp();

      setActiveTab("jobs");
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

      case "rh":
        return "RH";

      case "atas":
        return "Atas de Reunião";

      case "jobs":
        return "Controle de Jobs";

      case "operacional":
        return "Quadro Geral — Operacional";

      case "relatorios":
        return "Relatórios de Tráfego";

      case "trafego":
        return "Gestão de Tráfego Pago";

      case "leads":
        return "Leads / CRM";

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

      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        currentUser={user}
        onLogout={() => {
          localStorage.removeItem("@d2r:user");

          localStorage.removeItem("@d2r:clientPortal");

          setUser(null);

          setClientPortalObj(null);

          setPermissoes([]);

          setPermissoesCarregadas(false);
        }}
        showToast={showToast}
        activeTabTitle={getTabTitle()}
        isDashboard={activeTab === "dashboard"}
        onBackToDashboard={() => setActiveTab("dashboard")}
      />

      <div className="flex flex-1 min-h-[calc(100vh-64px)] overflow-hidden relative">
        <div
          className={`${
            isSidebarOpen ? "w-64" : "w-0 md:w-12"
          } transition-all duration-300 ease-in-out flex-shrink-0 z-10 bg-white dark:bg-slate-900`}
        >
          <Sidebar
            activeTab={activeTab as any}
            onTabChange={(tab) => {
              if (tab === "dashboard" || podeAcessarAba(tab)) {
                setActiveTab(tab as typeof activeTab);
              }
            }}
            clientesCount={clientes.length}
            atasCount={atas.length}
            jobsCount={jobs.length}
            collapsed={!isSidebarOpen}
            currentUser={user}
            podeAcessarAba={podeAcessarAba}
          />
        </div>

        <main className="flex-1 p-6 lg:p-8 w-full overflow-x-hidden overflow-y-auto">
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
              users={users}
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
              onNavigateTab={(tab) => {
                if (podeAcessarAba(tab)) {
                  setActiveTab(tab);
                }
              }}
              // currentUser={user}

              podeAcessarAba={podeAcessarAba}
            />
          )}

          {activeTab === "clientes" && podeAcessarAba("clientes") && (
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

          {activeTab === "rh" && podeAcessarAba("rh") && <RHView />}

          {activeTab === "atas" && podeAcessarAba("atas") && (
            <AtasView
              atas={atas}
              clientes={clientes}
              onSaveAta={handleSaveAta}
              onDeleteAta={handleDeleteAta}
              showToast={showToast}
              preSelectedClient={preSelectedClientForAta}
              onOpenNewJobForClient={openNewJobFromAta}
            />
          )}

          {activeTab === "jobs" && podeAcessarAba("jobs") && (
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
              onOpenOperationalBoard={() => setActiveTab("operacional")}
            />
          )}

          {activeTab === "operacional" && podeAcessarAba("operacional") && (
            <OperacionalView
              users={users}
              currentUser={user}
              showToast={showToast}
            />
          )}

          {activeTab === "relatorios" && podeAcessarAba("relatorios") && (
            <RelatoriosView
              relatorios={relatorios}
              clientes={clientes}
              onSaveRelatorio={handleSaveRelatorio}
              onDeleteRelatorio={handleDeleteRelatorio}
              showToast={showToast}
            />
          )}

          {activeTab === "trafego" && podeAcessarAba("trafego") && (
            <DashboardTrafego />
          )}

          {activeTab === "leads" && podeAcessarAba("leads") && <Leads />}
        </main>
      </div>

      {newJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável
                  </label>

                  <select
                    value={newJobData.responsavel || ""}
                    onChange={(e) =>
                      setNewJobData({
                        ...newJobData,
                        responsavel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="">Sem responsável</option>
                    {users
                      .filter((u: any) => {
                        const ativo = (u as any)?.ativo;
                        return !(
                          ativo === false ||
                          ativo === 0 ||
                          ativo === "0" ||
                          String(ativo).toLowerCase() === "false"
                        );
                      })
                      .map((u: any) => (
                        <option key={u.id} value={u.nome}>
                          {u.nome}
                          {u.cargo ? ` (${u.cargo})` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status atual
                  </label>

                  <select
                    value={String(newJobData.status || "Novos Jobs (Análise)")}
                    onChange={(e) =>
                      setNewJobData({
                        ...newJobData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {KANBAN_COLUMNS.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grau de Urgência
                  </label>

                  <select
                    value={String(newJobData.urgencia || "Médio")}
                    onChange={(e) =>
                      setNewJobData({
                        ...newJobData,
                        urgencia: e.target.value as JobUrgencia,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Normal - 7 dias</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Início
                  </label>

                  <input
                    type="date"
                    value={newJobData.data_inicio || ""}
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
                    value={newJobData.data_entrega || ""}
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Etiquetas / Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAGS_PRESETS.map((tag) => {
                    const tagsAtuais = Array.isArray(newJobData.etiquetas)
                      ? newJobData.etiquetas.map(String)
                      : [];
                    const selecionada = tagsAtuais.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setNewJobData({
                            ...newJobData,
                            etiquetas: selecionada
                              ? tagsAtuais.filter((item) => item !== tag)
                              : [...tagsAtuais, tag],
                          })
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-extrabold transition ${
                          selecionada
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <Paperclip className="h-4 w-4 text-indigo-500" />
                  Arquivos / anexos
                </div>
                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  Selecionar arquivos
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      setNewJobFiles(Array.from(e.target.files || []))
                    }
                  />
                </label>
                {newJobFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newJobFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-[11px] dark:bg-slate-900"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewJobFiles((previous) =>
                              previous.filter(
                                (_, fileIndex) => fileIndex !== index,
                              ),
                            )
                          }
                          className="shrink-0 text-slate-400 hover:text-rose-500"
                          title="Remover arquivo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Link2 className="h-4 w-4 text-indigo-500" />
                  Links / referências
                </label>
                <textarea
                  rows={3}
                  value={newJobLinksText}
                  onChange={(e) => setNewJobLinksText(e.target.value)}
                  placeholder={
                    "Cole um ou mais links, um por linha.\nEx.: drive.google.com/...\nhttps://figma.com/..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Pode informar vários links, um por linha.
                </p>
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
