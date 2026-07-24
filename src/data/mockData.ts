import { EmpresaCliente, AtaReuniao, Job, ChecklistTemplate, User, Relatorio } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    usuario: 'admin',
    nome: 'Carlos Eduardo (Sothink)',
    email: 'carlos@sothink.com.br',
    cargo: 'Diretor de Operações',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'u-2',
    usuario: 'lucas',
    nome: 'Lucas Silva',
    email: 'lucas@sothink.com.br',
    cargo: 'Gestor de Tráfego & Meta Ads',
    role: 'colaborador',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'u-3',
    usuario: 'mariana',
    nome: 'Mariana Costa',
    email: 'mariana@sothink.com.br',
    cargo: 'Head of Social Media & Content',
    role: 'colaborador',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'u-4',
    usuario: 'andre',
    nome: 'André Mendonça',
    email: 'andre@sothink.com.br',
    cargo: 'Senior Brand Designer',
    role: 'colaborador',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'u-cliente1',
    usuario: 'bellavista',
    nome: 'Roberto Bella Vista',
    email: 'roberto@bellavista.com.br',
    cargo: 'Gerente de Marketing - Bella Vista',
    role: 'cliente',
    cliente_id: 'c-1',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_CLIENTES: EmpresaCliente[] = [
  {
    id: 'c-1',
    razao_social: 'BELLA VISTA GASTRONOMIA E EVENTOS LTDA',
    nome_fantasia: 'Bella Vista Gastronomia',
    cnpj: '12.345.678/0001-90',
    inscricao_estadual: '109.876.543.110',
    logradouro: 'Avenida Paulista',
    numero: '1500',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-200',
    telefone: '(11) 3289-0000',
    whatsapp: '(11) 98765-4321',
    email: 'contato@bellavista.com.br',
    site: 'https://bellavista.com.br',
    instagram: '@bellavista_restaurante',
    facebook: 'bellavistagastronomia',
    situacao: 'ATIVA',
    data_abertura: '2018-05-14',
    cnae: '56.11-2-01 - Restaurantes e similares',
    permitir_acesso: true,
    login_cliente: 'bellavista',
    senha_cliente: 'bella2026',
    created_at: '2026-01-10T10:00:00Z',
    responsaveis: [
      {
        id: 'r-1',
        nome: 'Roberto Bella Vista',
        cargo: 'Proprietário & CMO',
        email: 'roberto@bellavista.com.br',
        telefone: '(11) 3289-0001',
        whatsapp: '(11) 98765-4321',
        data_aniversario: '1985-08-20',
      },
      {
        id: 'r-2',
        nome: 'Aline Souza',
        cargo: 'Coordenadora de Eventos',
        email: 'aline@bellavista.com.br',
        telefone: '(11) 3289-0002',
        whatsapp: '(11) 99887-1122',
        data_aniversario: '1992-03-12',
      }
    ]
  },
  {
    id: 'c-2',
    razao_social: 'TECHCORP SOLUCOES EM TI S.A.',
    nome_fantasia: 'TechCorp Innovation',
    cnpj: '98.765.432/0001-10',
    inscricao_estadual: 'ISENTA',
    logradouro: 'Rua Funchal',
    numero: '418',
    bairro: 'Vila Olímpia',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04551-060',
    telefone: '(11) 4003-9000',
    whatsapp: '(11) 97123-9988',
    email: 'marketing@techcorp.io',
    site: 'https://techcorp.io',
    instagram: '@techcorp_io',
    facebook: 'techcorpinnovation',
    situacao: 'ATIVA',
    data_abertura: '2015-11-03',
    cnae: '62.01-5-01 - Desenvolvimento de programas de computador sob encomenda',
    permitir_acesso: true,
    login_cliente: 'techcorp',
    senha_cliente: 'tech2026',
    created_at: '2026-02-01T14:30:00Z',
    responsaveis: [
      {
        id: 'r-3',
        nome: 'Fernanda Lima',
        cargo: 'VP de Marketing Global',
        email: 'fernanda.lima@techcorp.io',
        telefone: '(11) 4003-9005',
        whatsapp: '(11) 97123-9988',
        data_aniversario: '1988-11-25',
      }
    ]
  },
  {
    id: 'c-3',
    razao_social: 'STUDIO NATURA COSMETICOS NATURAIS LTDA',
    nome_fantasia: 'Studio Natura',
    cnpj: '45.123.890/0001-55',
    inscricao_estadual: '112.334.556.789',
    logradouro: 'Alameda Gabriel Monteiro da Silva',
    numero: '890',
    bairro: 'Jardim Paulistano',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01442-000',
    telefone: '(11) 3062-7711',
    whatsapp: '(11) 96543-2109',
    email: 'contato@studionatural.com.br',
    site: 'https://studionatural.com.br',
    instagram: '@studionatural_oficial',
    facebook: 'studionaturalbr',
    situacao: 'ATIVA',
    data_abertura: '2020-09-18',
    cnae: '47.72-5-00 - Comércio varejista de cosméticos e perfumaria',
    permitir_acesso: false,
    created_at: '2026-02-20T09:15:00Z',
    responsaveis: [
      {
        id: 'r-4',
        nome: 'Juliana Rocha',
        cargo: 'Fundadora & Head de Produto',
        email: 'juliana@studionatural.com.br',
        telefone: '(11) 3062-7712',
        whatsapp: '(11) 96543-2109',
        data_aniversario: '1990-07-04',
      }
    ]
  }
];

export const INITIAL_ATAS: AtaReuniao[] = [
  {
    id: 'ata-1',
    cliente_id: 'c-1',
    cliente_nome: 'Bella Vista Gastronomia',
    data_reuniao: '2026-07-20',
    hora_reuniao: '14:30',
    local_reuniao: 'Google Meet (Online)',
    tipo_reuniao: 'Online',
    responsavel: 'Carlos Eduardo (Sothink)',
    participantes: ['Roberto Bella Vista (Cliente)', 'Aline Souza (Cliente)', 'Mariana Costa (Sothink)', 'Lucas Silva (Sothink)'],
    objetivo: 'Alinhamento da Estratégia de Mídia e Lançamento do Cardápio de Primavera/Verão.',
    assuntos_discutidos: `1. Desempenho das campanhas de Meta Ads no primeiro semestre (+34% em reservas online).
2. Lançamento do novo menu assinado pelo Chef Executivo em Setembro.
3. Necessidade de gravação de novos vídeos no restaurante (Reels e TikTok).
4. Produção de materiais impressos e QR codes para as mesas.`,
    decisoes: `• Aumentar o orçamento mensal de Tráfego Pago em 25% a partir de Agosto.
• Agendar a diária de foto e vídeo no restaurante para a próxima terça-feira às 10h.
• Sothink ficará responsável pelo redesign do cardápio físico e versão interativa em QR Code.`,
    pendencias: 'Aline (Cliente) enviará a ficha técnica dos 8 novos pratos até sexta-feira.',
    proximos_passos: 'Elaborar o cronograma completo de divulgação de 60 dias no Trello/Kanban e enviar para aprovação.',
    observacoes: 'Cliente elogiou os resultados das campanhas de Dia dos Namorados.',
    created_at: '2026-07-20T16:00:00Z',
    acoes: [
      {
        id: 'a-1',
        tarefa: 'Criar briefing do Ensaio Fotográfico e Vídeo',
        responsavel: 'Mariana Costa',
        prazo: '2026-07-25',
        status: 'Concluído',
      },
      {
        id: 'a-2',
        tarefa: 'Ajustar conjunto de anúncios de Tráfego Pago para reservas',
        responsavel: 'Lucas Silva',
        prazo: '2026-07-28',
        status: 'Em Andamento',
      },
      {
        id: 'a-3',
        tarefa: 'Design do Cardápio Primavera/Verão',
        responsavel: 'André Mendonça',
        prazo: '2026-08-05',
        status: 'Pendente',
      }
    ],
    anexos: [
      {
        id: 'anx-1',
        nome: 'Apresentacao_Resultados_Q2_BellaVista.pdf',
        tamanho: '3.4 MB',
        tipo: 'pdf',
        url: '#',
        data_upload: '2026-07-20',
      }
    ]
  }
];

export const INITIAL_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'tmpl-1',
    titulo: 'Cronograma Shows / Eventos',
    categoria: 'Eventos & Entretenimento',
    itens: [
      'Alinhamento com produção artística',
      'Criação da identidade visual do evento (Feed & Stories)',
      'Abertura das vendas de ingressos / Link na bio',
      'Configuração de pixel e público de remarketing',
      'Disparo de E-mail Marketing / WhatsApp Broadcast',
      'Avisos de Virada de Lote (1º, 2º e 3º Lotes)',
      'Cobertura em tempo real / Bastidores (Stories)',
      'Obrigados pós-evento + Álbum de Fotos'
    ]
  },
  {
    id: 'tmpl-2',
    titulo: 'Lançamento Social Media / Mensal',
    categoria: 'Social Media',
    itens: [
      'Definição da linha editorial e pilares de conteúdo',
      'Criação do Grid / Mídia Kit de postagens',
      'Redação das legendas (Copywriting) e hashtags',
      'Design dos carrosséis e artes do feed',
      'Edição de vídeos curtos (Reels / TikTok)',
      'Aprovação interna da equipe de estratégia',
      'Aprovação final do Cliente no Portal',
      'Agendamento nas plataformas'
    ]
  },
  {
    id: 'tmpl-3',
    titulo: 'Otimização de Mídia Pago (Meta & Google Ads)',
    categoria: 'Tráfego Pago',
    itens: [
      'Auditoria de tags (Google Tag Manager & Meta Pixel)',
      'Pesquisa de palavras-chave / Posições de busca',
      'Desenvolvimento de 3 variações de criativos (Copy + Arte)',
      'Segmentação de públicos quentes e frios (Lookalike)',
      'Configuração de orçamento diário e estratégia de lances',
      'Testes A/B de Landing Page',
      'Relatório semanal de conversões e CPL'
    ]
  }
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-101',
    cliente_id: 'c-1',
    cliente_nome: 'Bella Vista Gastronomia',
    nome_job: 'Campanha Cardápio Primavera/Verão',
    titulo_job: 'Lançamento do Novo Cardápio Primavera/Verão 2026',
    briefing: 'Criar conjunto de peças e campanha de tráfego pago para anunciar o novo menu assinado pelo Chef Executivo. Foco em fotos de pratos gourmet e vídeos dinâmicos de montagem.',
    audio_briefing_url: '',
    audio_transcription: 'O cliente quer destacar bastante os pratos com frutos do mar e as sobremesas autorais. Precisamos de artes no formato Stories e Reels para Instagram, além de banners para o site.',
    descricao: 'Pacote completo de peças de Social Media + Mídia Paga + Cardápio impresso.',
    urgencia: 'Alto',
    status: 'Em Andamento',
    data_criacao: '2026-07-21',
    data_inicio: '2026-07-22',
    data_entrega: '2026-08-10',
    responsavel: 'Mariana Costa',
    etiquetas: ['SOCIAL', 'TRÁFEGO', 'DESIGN'],
    permitir_acesso_cliente: true,
    created_at: '2026-07-21T10:00:00Z',
    checklists: [
      { id: 'chk-1', texto: 'Aprovação do conceito criativo', concluido: true, responsavel: 'Mariana Costa' },
      { id: 'chk-2', texto: 'Design das 6 artes do feed', concluido: true, responsavel: 'André Mendonça' },
      { id: 'chk-3', texto: 'Edição dos 3 Reels com bastidores', concluido: false, responsavel: 'Mariana Costa' },
      { id: 'chk-4', texto: 'Subir campanhas no gerenciador Meta Ads', concluido: false, responsavel: 'Lucas Silva' }
    ],
    comentarios: [
      {
        id: 'cm-1',
        usuario: 'Carlos Eduardo (Sothink)',
        cargo: 'Diretor',
        texto: 'Pessoal, priorizar os vídeos de frutos do mar que o Roberto enfatizou na reunião.',
        data_hora: '2026-07-22 11:30'
      },
      {
        id: 'cm-2',
        usuario: 'Roberto Bella Vista',
        cargo: 'Cliente',
        texto: 'As cores da primeira prevendo ficaram ótimas! Aguardo a versão final do cardápio.',
        data_hora: '2026-07-23 09:15'
      }
    ],
    anexos: [
      {
        id: 'ax-1',
        nome: 'Fotos_AltaRes_Pratos_Provisorio.zip',
        tamanho: '18.2 MB',
        tipo: 'zip',
        url: '#',
        data_upload: '2026-07-21'
      }
    ],
    historico: [
      {
        id: 'h-1',
        usuario: 'Carlos Eduardo',
        data_hora: '2026-07-21 10:00',
        campo_alterado: 'Status',
        valor_anterior: 'Novos Jobs (Análise)',
        valor_novo: 'Em Andamento'
      },
      {
        id: 'h-2',
        usuario: 'Mariana Costa',
        data_hora: '2026-07-22 14:00',
        campo_alterado: 'Grau de Urgência',
        valor_anterior: 'Médio',
        valor_novo: 'Alto'
      }
    ]
  },
  {
    id: 'job-102',
    cliente_id: 'c-2',
    cliente_nome: 'TechCorp Innovation',
    nome_job: 'Mídia Paga B2B - Q3 Leads',
    titulo_job: 'Campanha de Geração de Leads B2B LinkedIn Ads & Google Search',
    briefing: 'Configurar e escalar campanha de alta conversão focada em diretores de tecnologia e CTOs. Produto principal: Soluções Cloud Enterprise.',
    audio_briefing_url: '',
    descricao: 'Campanha contínua com otimização semanal de CPA e CPL.',
    urgencia: 'Crítico',
    status: 'Novos Jobs (Análise)',
    data_criacao: '2026-07-23',
    data_inicio: '2026-07-25',
    data_entrega: '2026-08-25',
    responsavel: 'Lucas Silva',
    etiquetas: ['TRÁFEGO', 'ADVERTISING', 'ESTRATÉGIA'],
    permitir_acesso_cliente: true,
    created_at: '2026-07-23T15:00:00Z',
    checklists: [
      { id: 'chk-10', texto: 'Verificação do formulário nativo do LinkedIn Ads', concluido: false, responsavel: 'Lucas Silva' },
      { id: 'chk-11', texto: 'Integração de Webhook com CRM RD Station', concluido: false, responsavel: 'Lucas Silva' }
    ],
    comentarios: [],
    anexos: [],
    historico: [
      {
        id: 'h-3',
        usuario: 'Fernanda Lima (Cliente)',
        data_hora: '2026-07-23 15:00',
        campo_alterado: 'Criação do Job via Portal',
        valor_anterior: '-',
        valor_novo: 'Enviado para Análise'
      }
    ]
  },
  {
    id: 'job-103',
    cliente_id: 'c-3',
    cliente_nome: 'Studio Natura',
    nome_job: 'Redesign Embalagens Óleos Essenciais',
    titulo_job: 'Design da Nova Linha Premium de Séruns Naturais',
    briefing: 'Criação dos rótulos e embalagens para a nova linha orgânica. Necessita de facas de corte e mockups 3D para o e-commerce.',
    audio_briefing_url: '',
    descricao: 'Criação visual + mockups 3D para loja virtual.',
    urgencia: 'Médio',
    status: 'Aprovação Clientes',
    data_criacao: '2026-07-10',
    data_inicio: '2026-07-12',
    data_entrega: '2026-07-30',
    responsavel: 'André Mendonça',
    etiquetas: ['DESIGN', 'ENVIAR PARA PRODUÇÃO'],
    permitir_acesso_cliente: true,
    created_at: '2026-07-10T09:00:00Z',
    checklists: [
      { id: 'chk-20', texto: 'Estudo de tipografia e paleta minimalista', concluido: true, responsavel: 'André Mendonça' },
      { id: 'chk-21', texto: 'Renderização dos Mockups 3D', concluido: true, responsavel: 'André Mendonça' },
      { id: 'chk-22', texto: 'Aprovação gráfica final da gráfica parceira', concluido: true, responsavel: 'André Mendonça' }
    ],
    comentarios: [
      {
        id: 'cm-20',
        usuario: 'André Mendonça',
        cargo: 'Designer',
        texto: 'Enviado os mockups finais em alta resolução para aprovação do cliente.',
        data_hora: '2026-07-23 17:40'
      }
    ],
    anexos: [
      {
        id: 'ax-20',
        nome: 'Mockup_StudioNatura_Serums_3D.jpg',
        tamanho: '5.2 MB',
        tipo: 'jpg',
        url: '#',
        data_upload: '2026-07-23'
      }
    ],
    historico: []
  },
  {
    id: 'job-104',
    cliente_id: 'c-1',
    cliente_nome: 'Bella Vista Gastronomia',
    nome_job: 'Anúncios Google Meu Negócio & Maps',
    titulo_job: 'Campanha Local - Almoço Executivo',
    briefing: 'Campanha geo-localizada num raio de 5km no Google Maps para captar executivos da Paulista.',
    audio_briefing_url: '',
    descricao: 'Anúncios no Maps e Waze Ads.',
    urgencia: 'Baixo',
    status: 'Publicar Campanha',
    data_criacao: '2026-07-18',
    data_inicio: '2026-07-19',
    data_entrega: '2026-07-28',
    responsavel: 'Lucas Silva',
    etiquetas: ['TRÁFEGO', 'ESTRATÉGIA'],
    permitir_acesso_cliente: true,
    created_at: '2026-07-18T11:00:00Z',
    checklists: [],
    comentarios: [],
    anexos: [],
    historico: []
  },
  {
    id: 'job-105',
    cliente_id: 'c-2',
    cliente_nome: 'TechCorp Innovation',
    nome_job: 'E-bookTendências TI 2027',
    titulo_job: 'Diagramação de E-book Ricamente Ilustrado (30 Páginas)',
    briefing: 'Produção e diagramação do e-book anual de tendências para captura de leads qualificados.',
    audio_briefing_url: '',
    descricao: 'Diagramação no InDesign + PDF interativo.',
    urgencia: 'Médio',
    status: 'Revisão',
    data_criacao: '2026-07-05',
    data_inicio: '2026-07-06',
    data_entrega: '2026-07-31',
    responsavel: 'André Mendonça',
    etiquetas: ['DESIGN', 'ESTRATÉGIA'],
    permitir_acesso_cliente: true,
    created_at: '2026-07-05T08:00:00Z',
    checklists: [],
    comentarios: [],
    anexos: [],
    historico: []
  }
];

export const INITIAL_RELATORIOS: Relatorio[] = [
  {
    id: 'rel-101',
    cliente_id: 'c-1',
    cliente_nome: 'Bella Vista Gastronomia',
    titulo: 'Relatório Mensal de Performance - Tráfego Pago',
    periodo: '5 jan a 4 fev',
    campanhas: ['prolongadores', 'puxadores', 'roldanas', 'torre'],
    investimento: '7.612,05',
    alcance: '802.296',
    total_conversas: '481',
    custo_por_conversa: '15,80',
    observacoes: 'Excelente performance nas campanhas de fundo de funil focadas em atração para whatsapp. Destaque para o conjunto Torre com maior volume de conversas.',
    created_at: '2026-02-05T10:00:00Z',
  },
  {
    id: 'rel-102',
    cliente_id: 'c-2',
    cliente_nome: 'TechCorp Innovation',
    titulo: 'Relatório Meta Ads & Google Search',
    periodo: '1 jan a 31 jan',
    campanhas: ['Software B2B', 'Landing Page TI', 'E-book Lead Gen'],
    investimento: '12.450,00',
    alcance: '1.240.000',
    total_conversas: '620',
    custo_por_conversa: '20,08',
    observacoes: 'Campanha B2B gerando leads qualificados no segmento corporativo de grande porte.',
    created_at: '2026-02-01T14:30:00Z',
  }
];

