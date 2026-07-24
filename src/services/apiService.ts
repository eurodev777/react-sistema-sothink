import { EmpresaCliente, AtaReuniao, Job, ChecklistTemplate, User, CNPJConsultResponse, ApiConfig, Relatorio } from '../types';

const CONFIG_STORAGE_KEY = 'sothink_api_config';

export function getApiConfig(): ApiConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return {
    useRemoteApi: false,
    remoteApiUrl: 'https://api.sothink.com.br',
  };
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function getApiBaseUrl(): string {
  const config = getApiConfig();
  if (config.useRemoteApi && config.remoteApiUrl) {
    return config.remoteApiUrl.replace(/\/$/, '');
  }
  return '/api';
}

// Universal REST fetch wrapper compatible with Express or PHP Backend
async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  useFormData: boolean = false
): Promise<{ success: boolean; data?: T; user?: User; clientPortalObj?: EmpresaCliente; transcription?: string; code?: number; message?: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {};

  let requestBody: any = undefined;

  if (body) {
    if (useFormData) {
      const formData = new FormData();
      Object.keys(body).forEach((key) => {
        const val = body[key];
        if (val !== undefined && val !== null) {
          if (typeof val === 'object' && !(val instanceof Blob) && !(val instanceof File)) {
            formData.append(key, JSON.stringify(val));
          } else {
            formData.append(key, val);
          }
        }
      });
      requestBody = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error(`API Request error [${method} ${url}]`, err);
    return {
      success: false,
      message: `Erro na comunicação com a API: ${err.message || 'Falha de conexão'}`,
    };
  }
}

export const apiService = {
  // Login (POST /login)
  login: async (usuario: string, senha: string) => {
    return request<User>('/login', 'POST', { usuario, senha, user: usuario, password: senha }, false);
  },

  // Clientes CRUD (GET, POST, PUT, DELETE /clientes)
  getClientes: async () => {
    return request<EmpresaCliente[]>('/clientes', 'GET');
  },

  createCliente: async (clienteData: Partial<EmpresaCliente>) => {
    return request<EmpresaCliente>('/clientes', 'POST', clienteData, false);
  },

  updateCliente: async (id: string, clienteData: Partial<EmpresaCliente>) => {
    return request<EmpresaCliente>(`/clientes/${id}`, 'PUT', clienteData, false);
  },

  saveCliente: async (clienteData: Partial<EmpresaCliente>) => {
    if (clienteData.id) {
      return request<EmpresaCliente>(`/clientes/${clienteData.id}`, 'PUT', clienteData, false);
    }
    return request<EmpresaCliente>('/clientes', 'POST', clienteData, false);
  },

  deleteCliente: async (id: string) => {
    return request<void>(`/clientes/${id}`, 'DELETE');
  },

  // Consultar CNPJ
  consultarCNPJ: async (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, '');
    return request<CNPJConsultResponse>(`/cnpj/${clean}`, 'GET');
  },

  // Atas CRUD (GET, POST, PUT, DELETE /atas)
  getAtas: async () => {
    return request<AtaReuniao[]>('/atas', 'GET');
  },

  createAta: async (ataData: Partial<AtaReuniao>) => {
    return request<AtaReuniao>('/atas', 'POST', ataData, false);
  },

  updateAta: async (id: string, ataData: Partial<AtaReuniao>) => {
    return request<AtaReuniao>(`/atas/${id}`, 'PUT', ataData, false);
  },

  saveAta: async (ataData: Partial<AtaReuniao>) => {
    if (ataData.id) {
      return request<AtaReuniao>(`/atas/${ataData.id}`, 'PUT', ataData, false);
    }
    return request<AtaReuniao>('/atas', 'POST', ataData, false);
  },

  deleteAta: async (id: string) => {
    return request<void>(`/atas/${id}`, 'DELETE');
  },

  // Jobs CRUD (GET, POST, PUT, DELETE /jobs)
  getJobs: async () => {
    return request<Job[]>('/jobs', 'GET');
  },

  createJob: async (jobData: Partial<Job>, autor: string = 'Sothink Admin') => {
    return request<Job>('/jobs', 'POST', { ...jobData, usuario_autor: autor }, false);
  },

  updateJob: async (id: string, jobData: Partial<Job>, autor: string = 'Sothink Admin') => {
    return request<Job>(`/jobs/${id}`, 'PUT', { ...jobData, usuario_autor: autor }, false);
  },

  saveJob: async (jobData: Partial<Job>, autor: string = 'Sothink Admin') => {
    if (jobData.id) {
      return request<Job>(`/jobs/${jobData.id}`, 'PUT', { ...jobData, usuario_autor: autor }, false);
    }
    return request<Job>('/jobs', 'POST', { ...jobData, usuario_autor: autor }, false);
  },

  deleteJob: async (id: string) => {
    return request<void>(`/jobs/${id}`, 'DELETE');
  },

  // Checklist Templates
  getTemplates: async () => {
    return request<ChecklistTemplate[]>('/templates', 'GET');
  },

  createTemplate: async (template: Partial<ChecklistTemplate>) => {
    return request<ChecklistTemplate>('/templates', 'POST', template, false);
  },

  // AI Speech Transcription
  transcribeAudioBriefing: async (audioBase64: string, mimeType: string = 'audio/webm') => {
    return request<{ transcription: string }>('/transcribe', 'POST', { audioBase64, mimeType });
  },

  // Relatórios CRUD (GET, POST, PUT, DELETE /relatorios)
  getRelatorios: async () => {
    return request<Relatorio[]>('/relatorios', 'GET');
  },

  createRelatorio: async (relatorioData: Partial<Relatorio>) => {
    return request<Relatorio>('/relatorios', 'POST', relatorioData, false);
  },

  updateRelatorio: async (id: string, relatorioData: Partial<Relatorio>) => {
    return request<Relatorio>(`/relatorios/${id}`, 'PUT', relatorioData, false);
  },

  saveRelatorio: async (relatorioData: Partial<Relatorio>) => {
    if (relatorioData.id) {
      return request<Relatorio>(`/relatorios/${relatorioData.id}`, 'PUT', relatorioData, false);
    }
    return request<Relatorio>('/relatorios', 'POST', relatorioData, false);
  },

  deleteRelatorio: async (id: string) => {
    return request<void>(`/relatorios/${id}`, 'DELETE');
  },
};
