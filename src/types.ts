/**
 * Types & Interfaces for Sothink Marketing Agency Platform
 */

export interface User {
  id: string;
  usuario: string;
  nome: string;
  email: string;
  cargo: string;
  avatar?: string;
  role: 'admin' | 'colaborador' | 'cliente';
  cliente_id?: string;
}

export interface ResponsavelCliente {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  whatsapp: string;
  data_aniversario: string;
}

export interface EmpresaCliente {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  email: string;
  site: string;
  instagram: string;
  facebook: string;
  situacao?: string;
  data_abertura?: string;
  cnae?: string;
  responsaveis: ResponsavelCliente[];
  permitir_acesso?: boolean;
  login_cliente?: string;
  senha_cliente?: string;
  created_at: string;
  updated_at?: string;
}

export interface AcaoAta {
  id: string;
  tarefa: string;
  responsavel: string;
  prazo: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
}

export interface Anexo {
  id: string;
  nome: string;
  tamanho: string;
  tipo: string;
  url: string;
  data_upload: string;
}

export interface AtaReuniao {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  data_reuniao: string;
  hora_reuniao: string;
  local_reuniao: string;
  tipo_reuniao: 'Presencial' | 'Online' | 'Híbrido';
  responsavel: string;
  participantes: string[];
  objetivo: string;
  assuntos_discutidos: string;
  decisoes: string;
  pendencias: string;
  proximos_passos: string;
  observacoes: string;
  acoes: AcaoAta[];
  anexos: Anexo[];
  created_at: string;
}

export type JobStatus =
  | 'Novos Jobs (Análise)'
  | 'Aguardando Terceiros'
  | 'Programado'
  | 'Em Andamento'
  | 'Alterações'
  | 'Revisão'
  | 'Aprovação Interna'
  | 'Aprovação Clientes'
  | 'Finalizado'
  | 'Publicar Campanha'
  | 'Enviar para Produção'
  | 'Pausado / Cancelado';

export type JobUrgencia = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

export type JobEtiqueta =
  | 'SOCIAL'
  | 'TRÁFEGO'
  | 'ADVERTISING'
  | 'ESTRATÉGIA'
  | 'DESIGN'
  | 'ENVIAR PARA PRODUÇÃO'
  | string;

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
  responsavel?: string;
}

export interface ChecklistTemplate {
  id: string;
  titulo: string;
  categoria: string;
  itens: string[];
}

export interface Comentario {
  id: string;
  usuario: string;
  cargo: string;
  texto: string;
  data_hora: string;
  avatar?: string;
  audio_url?: string;
}

export interface HistoricoAlteracao {
  id: string;
  usuario: string;
  data_hora: string;
  campo_alterado: string;
  valor_anterior: string;
  valor_novo: string;
}

export interface Job {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  nome_job: string;
  titulo_job: string;
  briefing: string;
  audio_briefing_url?: string;
  audio_transcription?: string;
  descricao: string;
  urgencia: JobUrgencia;
  status: JobStatus;
  data_criacao: string;
  data_inicio: string;
  data_entrega: string;
  responsavel: string; // Assessor responsável
  etiquetas: string[];
  checklists: ChecklistItem[];
  comentarios: Comentario[];
  anexos: Anexo[];
  historico: HistoricoAlteracao[];
  permitir_acesso_cliente: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Relatorio {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  titulo: string;
  periodo: string; // e.g. "5 jan a 4 fev"
  campanhas: string[]; // e.g. ["prolongadores", "puxadores", "roldanas", "torre"]
  investimento: string; // e.g. "7.612,05"
  alcance: string; // e.g. "802.296"
  total_conversas: string; // e.g. "481"
  custo_por_conversa: string; // e.g. "15,80"
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CNPJConsultResponse {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  situacao: string;
  data_abertura: string;
  cnae: string;
  telefone?: string;
  email?: string;
}

export interface ApiConfig {
  useRemoteApi: boolean;
  remoteApiUrl: string;
}
