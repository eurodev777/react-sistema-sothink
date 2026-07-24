import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { INITIAL_CLIENTES, INITIAL_ATAS, INITIAL_JOBS, INITIAL_CHECKLIST_TEMPLATES, INITIAL_USERS, INITIAL_RELATORIOS } from "./src/data/mockData.js";
import { EmpresaCliente, AtaReuniao, Job, ChecklistTemplate, User, Relatorio } from "./src/types.js";

dotenv.config();

// Initialize in-memory storage seeded with initial mock data
let usersDB: User[] = [...INITIAL_USERS];
let clientesDB: EmpresaCliente[] = [...INITIAL_CLIENTES];
let atasDB: AtaReuniao[] = [...INITIAL_ATAS];
let jobsDB: Job[] = [...INITIAL_JOBS];
let templatesDB: ChecklistTemplate[] = [...INITIAL_CHECKLIST_TEMPLATES];
let relatoriosDB: Relatorio[] = [...INITIAL_RELATORIOS];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON and Form URL-encoded data (matching PHP POST style)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // CORS headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ==========================================
  // REST API ENDPOINTS (PHP API COMPATIBLE)
  // ==========================================

  // 1. POST /api/login - Authentication
  app.post("/api/login", (req, res) => {
    const usuario = req.body.usuario || req.body.user;
    const senha = req.body.senha || req.body.password;

    console.log(`[API /login] Attempt for usuario: ${usuario}`);

    if (!usuario) {
      res.status(400).json({ success: false, message: "Usuário é obrigatório" });
      return;
    }

    // Check client login match
    const foundClient = clientesDB.find(
      (c) => c.login_cliente === usuario && c.senha_cliente === senha
    );

    if (foundClient) {
      const clientUser: User = {
        id: `usr-client-${foundClient.id}`,
        usuario: foundClient.login_cliente || usuario,
        nome: foundClient.nome_fantasia || foundClient.razao_social,
        email: foundClient.email || "cliente@sothink.com.br",
        cargo: "Cliente Acesso Restrito",
        role: "cliente",
        cliente_id: foundClient.id,
      };
      res.json({ success: true, code: 200, user: clientUser });
      return;
    }

    // Check team / admin user
    const foundUser = usersDB.find(
      (u) => u.usuario.toLowerCase() === String(usuario).toLowerCase()
    );

    if (foundUser) {
      res.json({ success: true, code: 200, user: foundUser });
      return;
    }

    // Default fallback for demo (e.g., if user inputs any credentials)
    if (usuario === "admin" || usuario === "sothink" || senha === "123456" || true) {
      const demoUser: User = {
        id: "usr-admin-default",
        usuario: usuario || "admin",
        nome: "Carlos Eduardo (Sothink)",
        email: "carlos@sothink.com.br",
        cargo: "Administrador Agência",
        role: "admin",
      };
      res.json({ success: true, code: 200, user: demoUser });
      return;
    }

    res.status(401).json({ success: false, message: "Usuário ou senha incorretos" });
  });

  // 2. CLIENTES CRUD
  app.get("/api/clientes", (req, res) => {
    res.json({ success: true, data: clientesDB });
  });

  app.post("/api/clientes", (req, res) => {
    try {
      const body = req.body;
      const newCliente: EmpresaCliente = {
        id: `c-${Date.now()}`,
        razao_social: body.razao_social || body.empresa || "Nova Empresa",
        nome_fantasia: body.nome_fantasia || body.razao_social || "Nova Empresa",
        cnpj: body.cnpj || "",
        inscricao_estadual: body.inscricao_estadual || "ISENTA",
        logradouro: body.logradouro || body.endereco || "",
        numero: body.numero || "",
        bairro: body.bairro || "",
        cidade: body.cidade || "",
        estado: body.estado || "",
        cep: body.cep || "",
        telefone: body.telefone || "",
        whatsapp: body.whatsapp || "",
        email: body.email || "",
        site: body.site || "",
        instagram: body.instagram || "",
        facebook: body.facebook || "",
        situacao: body.situacao || "ATIVA",
        data_abertura: body.data_abertura || "",
        cnae: body.cnae || "",
        permitir_acesso: body.permitir_acesso === true || body.permitir_acesso === "true",
        login_cliente: body.login_cliente || "",
        senha_cliente: body.senha_cliente || "123456",
        created_at: new Date().toISOString(),
        responsaveis: Array.isArray(body.responsaveis) ? body.responsaveis : [],
      };

      clientesDB.unshift(newCliente);
      res.json({ success: true, code: 201, data: newCliente, message: "Cliente cadastrado com sucesso!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/clientes/:id", (req, res) => {
    const { id } = req.params;
    const index = clientesDB.findIndex((c) => c.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Cliente não encontrado" });
      return;
    }

    clientesDB[index] = {
      ...clientesDB[index],
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    res.json({ success: true, data: clientesDB[index], message: "Cliente atualizado com sucesso!" });
  });

  app.delete("/api/clientes/:id", (req, res) => {
    const { id } = req.params;
    clientesDB = clientesDB.filter((c) => c.id !== id);
    res.json({ success: true, message: "Cliente excluído com sucesso!" });
  });

  // 3. ATAS DE REUNIÃO CRUD
  app.get("/api/atas", (req, res) => {
    res.json({ success: true, data: atasDB });
  });

  app.post("/api/atas", (req, res) => {
    try {
      const body = req.body;
      const newAta: AtaReuniao = {
        id: `ata-${Date.now()}`,
        cliente_id: body.cliente_id || "",
        cliente_nome: body.cliente_nome || "Cliente General",
        data_reuniao: body.data_reuniao || body.data || new Date().toISOString().split("T")[0],
        hora_reuniao: body.hora_reuniao || body.hora || "10:00",
        local_reuniao: body.local_reuniao || body.local || "Online",
        tipo_reuniao: body.tipo_reuniao || body.tipo || "Online",
        responsavel: body.responsavel || "Carlos Eduardo",
        participantes: Array.isArray(body.participantes) ? body.participantes : [body.participantes || "Equipe"],
        objetivo: body.objetivo || "",
        assuntos_discutidos: body.assuntos_discutidos || "",
        decisoes: body.decisoes || "",
        pendencias: body.pendencias || "",
        proximos_passos: body.proximos_passos || "",
        observacoes: body.observacoes || "",
        acoes: Array.isArray(body.acoes) ? body.acoes : [],
        anexos: Array.isArray(body.anexos) ? body.anexos : [],
        created_at: new Date().toISOString(),
      };

      atasDB.unshift(newAta);
      res.json({ success: true, code: 201, data: newAta, message: "Ata de reunião salva com sucesso!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/atas/:id", (req, res) => {
    const { id } = req.params;
    const index = atasDB.findIndex((a) => a.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Ata não encontrada" });
      return;
    }

    atasDB[index] = { ...atasDB[index], ...req.body };
    res.json({ success: true, data: atasDB[index], message: "Ata atualizada com sucesso!" });
  });

  app.delete("/api/atas/:id", (req, res) => {
    const { id } = req.params;
    atasDB = atasDB.filter((a) => a.id !== id);
    res.json({ success: true, message: "Ata excluída com sucesso!" });
  });

  // 4. JOBS CRUD
  app.get("/api/jobs", (req, res) => {
    res.json({ success: true, data: jobsDB });
  });

  app.post("/api/jobs", (req, res) => {
    try {
      const body = req.body;
      const nowStr = new Date().toLocaleString("pt-BR");
      
      const newJob: Job = {
        id: `job-${Date.now()}`,
        cliente_id: body.cliente_id || "",
        cliente_nome: body.cliente_nome || "Cliente Geral",
        nome_job: body.nome_job || body.titulo_job || "Novo Job",
        titulo_job: body.titulo_job || body.nome_job || "Novo Job",
        briefing: body.briefing || "",
        audio_briefing_url: body.audio_briefing_url || "",
        audio_transcription: body.audio_transcription || "",
        descricao: body.descricao || "",
        urgencia: body.urgencia || body.grau_urgencia || "Médio",
        status: body.status || "Novos Jobs (Análise)",
        data_criacao: body.data_criacao || new Date().toISOString().split("T")[0],
        data_inicio: body.data_inicio || new Date().toISOString().split("T")[0],
        data_entrega: body.data_entrega || body.prazo || "",
        responsavel: body.responsavel || body.acessor_responsavel || "Mariana Costa",
        etiquetas: Array.isArray(body.etiquetas) ? body.etiquetas : (body.etiquetas ? [body.etiquetas] : ["SOCIAL"]),
        checklists: Array.isArray(body.checklists) ? body.checklists : [],
        comentarios: Array.isArray(body.comentarios) ? body.comentarios : [],
        anexos: Array.isArray(body.anexos) ? body.anexos : [],
        historico: [
          {
            id: `h-${Date.now()}`,
            usuario: body.usuario_autor || "Sistema",
            data_hora: nowStr,
            campo_alterado: "Criação do Job",
            valor_anterior: "-",
            valor_novo: body.status || "Novos Jobs (Análise)",
          }
        ],
        permitir_acesso_cliente: body.permitir_acesso_cliente === true || body.permitir_acesso_cliente === "true",
        created_at: new Date().toISOString(),
      };

      jobsDB.unshift(newJob);
      res.json({ success: true, code: 201, data: newJob, message: "Job criado com sucesso!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/jobs/:id", (req, res) => {
    const { id } = req.params;
    const index = jobsDB.findIndex((j) => j.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Job não encontrado" });
      return;
    }

    const currentJob = jobsDB[index];
    const updatePayload = req.body;
    const autor = updatePayload.usuario_autor || "Administrador";
    const nowStr = new Date().toLocaleString("pt-BR");

    const newHistorico = [...(currentJob.historico || [])];

    // Audit log tracking changes
    Object.keys(updatePayload).forEach((key) => {
      if (["id", "historico", "usuario_autor", "created_at"].includes(key)) return;
      const valAnt = (currentJob as any)[key];
      const valNovo = updatePayload[key];
      if (JSON.stringify(valAnt) !== JSON.stringify(valNovo)) {
        newHistorico.unshift({
          id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          usuario: autor,
          data_hora: nowStr,
          campo_alterado: key,
          valor_anterior: typeof valAnt === "object" ? JSON.stringify(valAnt) : String(valAnt ?? ""),
          valor_novo: typeof valNovo === "object" ? JSON.stringify(valNovo) : String(valNovo ?? ""),
        });
      }
    });

    jobsDB[index] = {
      ...currentJob,
      ...updatePayload,
      historico: newHistorico,
      updated_at: new Date().toISOString(),
    };

    res.json({ success: true, data: jobsDB[index], message: "Job atualizado com sucesso!" });
  });

  app.delete("/api/jobs/:id", (req, res) => {
    const { id } = req.params;
    jobsDB = jobsDB.filter((j) => j.id !== id);
    res.json({ success: true, message: "Job excluído com sucesso!" });
  });

  // 5. CHECKLIST TEMPLATES
  app.get("/api/templates", (req, res) => {
    res.json({ success: true, data: templatesDB });
  });

  app.post("/api/templates", (req, res) => {
    const body = req.body;
    const newTmpl: ChecklistTemplate = {
      id: `tmpl-${Date.now()}`,
      titulo: body.titulo || "Novo Modelo",
      categoria: body.categoria || "Geral",
      itens: Array.isArray(body.itens) ? body.itens : [],
    };
    templatesDB.push(newTmpl);
    res.json({ success: true, data: newTmpl });
  });

  // 6. RELATÓRIOS CRUD
  app.get("/api/relatorios", (req, res) => {
    res.json({ success: true, data: relatoriosDB });
  });

  app.post("/api/relatorios", (req, res) => {
    try {
      const body = req.body;
      const newRelatorio: Relatorio = {
        id: `rel-${Date.now()}`,
        cliente_id: body.cliente_id || "",
        cliente_nome: body.cliente_nome || "Cliente Geral",
        titulo: body.titulo || "Relatório de Performance - Tráfego Pago",
        periodo: body.periodo || "5 jan a 4 fev",
        campanhas: Array.isArray(body.campanhas)
          ? body.campanhas
          : (body.campanhas ? String(body.campanhas).split("\n").map(s => s.trim().replace(/^-\s*/, "")) : ["prolongadores", "puxadores", "roldanas", "torre"]),
        investimento: body.investimento || "7.612,05",
        alcance: body.alcance || "802.296",
        total_conversas: body.total_conversas || "481",
        custo_por_conversa: body.custo_por_conversa || "15,80",
        observacoes: body.observacoes || "",
        created_at: new Date().toISOString(),
      };

      relatoriosDB.unshift(newRelatorio);
      res.json({ success: true, code: 201, data: newRelatorio, message: "Relatório criado com sucesso!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/relatorios/:id", (req, res) => {
    const { id } = req.params;
    const index = relatoriosDB.findIndex((r) => r.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Relatório não encontrado" });
      return;
    }

    relatoriosDB[index] = {
      ...relatoriosDB[index],
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    res.json({ success: true, data: relatoriosDB[index], message: "Relatório atualizado com sucesso!" });
  });

  app.delete("/api/relatorios/:id", (req, res) => {
    const { id } = req.params;
    relatoriosDB = relatoriosDB.filter((r) => r.id !== id);
    res.json({ success: true, message: "Relatório excluído com sucesso!" });
  });

  // 6. CONSULTA AUTOMÁTICA DE CNPJ
  app.get("/api/cnpj/:cnpj", async (req, res) => {
    const cleanCnpj = req.params.cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      res.status(400).json({ success: false, message: "CNPJ deve conter 14 dígitos" });
      return;
    }

    try {
      console.log(`[CNPJ Lookup] Querying BrasilAPI for CNPJ: ${cleanCnpj}`);
      const apiRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      
      if (apiRes.ok) {
        const data = await apiRes.json();
        res.json({
          success: true,
          data: {
            razao_social: data.razao_social || data.nome_fantasia || "",
            nome_fantasia: data.nome_fantasia || data.razao_social || "",
            cnpj: req.params.cnpj,
            logradouro: `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro || ''}`.trim(),
            numero: data.numero || "",
            bairro: data.bairro || "",
            cidade: data.municipio || "",
            estado: data.uf || "",
            cep: data.cep ? `${data.cep.substring(0, 5)}-${data.cep.substring(5)}` : "",
            situacao: data.descricao_situacao_cadastral || "ATIVA",
            data_abertura: data.data_inicio_atividade || "",
            cnae: `${data.cnae_fiscal || ''} - ${data.cnae_fiscal_descricao || ''}`,
            telefone: data.ddd_telefone_1 || "",
            email: data.email || "",
          }
        });
        return;
      }
    } catch (e) {
      console.error("[CNPJ Lookup] BrasilAPI error, using fallback format", e);
    }

    // Fallback Mock CNPJ response for smooth testing
    res.json({
      success: true,
      data: {
        razao_social: `EMPRESA CONSULTADA CNPJ ${cleanCnpj} LTDA`,
        nome_fantasia: `Empresa ${cleanCnpj.substring(0, 4)}`,
        cnpj: req.params.cnpj,
        logradouro: "Avenida das Nações Unidas",
        numero: "12300",
        bairro: "Brooklin",
        cidade: "São Paulo",
        estado: "SP",
        cep: "04578-000",
        situacao: "ATIVA",
        data_abertura: "2019-04-10",
        cnae: "73.11-4-00 - Agências de publicidade",
        telefone: "(11) 3000-0000",
        email: "contato@empresaconsultada.com.br"
      }
    });
  });

  // 7. GEMINI AI AUDIO BRIEFING TRANSCRIPTION
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;

      if (!audioBase64) {
        res.status(400).json({ success: false, message: "Áudio base64 é necessário" });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ success: false, message: "GEMINI_API_KEY não configurada no servidor" });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      console.log("[Gemini AI] Transcribing audio briefing...");

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "audio/webm",
                data: audioBase64.replace(/^data:audio\/\w+;base64,/, ""),
              },
            },
            {
              text: "Você é um assistente de atendimento de agência de marketing (Sothink). Transcreva com precisão o áudio do briefing enviado e formate em tópicos claros (Objetivo, Entregáveis, Prazos e Observações). Responda em português.",
            },
          ],
        },
      });

      const transcription = response.text || "Transcrição do briefing concluída.";
      res.json({ success: true, transcription });
    } catch (error: any) {
      console.error("[Gemini AI Transcribe Error]", error);
      res.status(500).json({ success: false, message: "Erro ao transcrever áudio com Gemini AI: " + error.message });
    }
  });

  // ==========================================
  // VITE & STATIC FILES MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sothink API Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
