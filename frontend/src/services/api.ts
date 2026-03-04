import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ========== AUTH ==========
export const authApi = {
  status: () => api.get('/auth/status'),
  login: (senha: string) => api.post('/auth/login', { senha }),
  setup: (senha: string, nomeNegocio: string) => api.post('/auth/setup', { senha, nomeNegocio }),
}

// ========== PRODUTOS ==========
export const produtosApi = {
  listar: (cursor?: number, limit: number = 20) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor != null) params.append('cursor', String(cursor))
    return api.get(`/produtos?${params}`)
  },
  listarTodos: () => api.get('/produtos?limit=1000'),
  buscar: (id: number) => api.get(`/produtos/${id}`),
  criar: (data: any) => api.post('/produtos', data),
  atualizar: (id: number, data: any) => api.put(`/produtos/${id}`, data),
  deletar: (id: number) => api.delete(`/produtos/${id}`),
}

// ========== CLIENTES ==========
export const clientesApi = {
  listar: (cursor?: number, limit: number = 20) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor != null) params.append('cursor', String(cursor))
    return api.get(`/clientes?${params}`)
  },
  listarTodos: () => api.get('/clientes?limit=1000'),
  buscar: (id: number) => api.get(`/clientes/${id}`),
  criar: (data: any) => api.post('/clientes', data),
  atualizar: (id: number, data: any) => api.put(`/clientes/${id}`, data),
  deletar: (id: number) => api.delete(`/clientes/${id}`),
  consultarCnpj: (cnpj: string) => api.get(`/clientes/consulta-cnpj/${cnpj}`),
  buscarOuCriarPF: (nome: string) => api.get(`/clientes/buscar-ou-criar-pf?nome=${encodeURIComponent(nome)}`),
}

// ========== UNIDADES MEDIDA ==========
export const unidadesMedidaApi = {
  listar: () => api.get('/unidades-medida'),
  buscar: (id: number) => api.get(`/unidades-medida/${id}`),
  criar: (data: any) => api.post('/unidades-medida', data),
  atualizar: (id: number, data: any) => api.put(`/unidades-medida/${id}`, data),
  deletar: (id: number) => api.delete(`/unidades-medida/${id}`),
}

// ========== NATUREZAS OPERAÇÃO ==========
export const naturezasApi = {
  listar: () => api.get('/naturezas-operacao'),
  buscar: (id: number) => api.get(`/naturezas-operacao/${id}`),
  criar: (data: any) => api.post('/naturezas-operacao', data),
  atualizar: (id: number, data: any) => api.put(`/naturezas-operacao/${id}`, data),
}

// ========== PEDIDOS ==========
export const pedidosApi = {
  listar: (cursor?: number, limit: number = 20) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor != null) params.append('cursor', String(cursor))
    return api.get(`/pedidos?${params}`)
  },
  buscar: (id: number) => api.get(`/pedidos/${id}`),
  criar: (data: any) => api.post('/pedidos', data),
  atualizar: (id: number, data: any) => api.put(`/pedidos/${id}`, data),
  cancelar: (id: number) => api.post(`/pedidos/${id}/cancelar`),
}

// ========== DASHBOARD ==========
export const dashboardApi = {
  resumo: (periodo: string = 'HOJE') => api.get(`/dashboard/resumo?periodo=${periodo}`),
  vendasPorDia: (periodo: string = 'HOJE') => api.get(`/dashboard/vendas-por-dia?periodo=${periodo}`),
  vendasPorMes: (periodo: string = 'HOJE') => api.get(`/dashboard/vendas-por-mes?periodo=${periodo}`),
  topProdutosVendidos: (periodo: string = 'HOJE') => api.get(`/dashboard/top-produtos-vendidos?periodo=${periodo}`),
  topProdutosLucrativos: (periodo: string = 'HOJE') => api.get(`/dashboard/top-produtos-lucrativos?periodo=${periodo}`),
  topClientesFieis: (periodo: string = 'HOJE') => api.get(`/dashboard/top-clientes-fieis?periodo=${periodo}`),
  topClientesLucrativos: (periodo: string = 'HOJE') => api.get(`/dashboard/top-clientes-lucrativos?periodo=${periodo}`),
}

// ========== ESTOQUE ==========
export const estoqueApi = {
  listarProdutos: () => api.get('/estoque/produtos'),
  timeline: (produtoId: number) => api.get(`/estoque/timeline/${produtoId}`),
  detalheMovimentacao: (movimentacaoId: number) => api.get(`/estoque/movimentacao/${movimentacaoId}`),
}

export default api
