export interface NaturezaOperacao {
  id: number;
  descricao: string;
  tipoMovimento: 'ENTRADA' | 'SAIDA';
  propriedadeCliente: 'DESATIVADO' | 'OPCIONAL' | 'OBRIGATORIO';
  propriedadeValorUnitario: 'DESATIVADO' | 'OPCIONAL' | 'OBRIGATORIO';
  propriedadeStatus: 'DESATIVADO' | 'OPCIONAL' | 'OBRIGATORIO';
}

export interface Pedido {
  id: number;
  naturezaOperacaoId?: number;
  naturezaOperacao?: NaturezaOperacao | string;
  naturezaOperacaoTipo?: 'ENTRADA' | 'SAIDA';
  clienteId?: number | null;
  clienteNome?: string;
  documentoReferencia?: string | null;
  valorTotal: number;
  status: string | null;
  dataEmissao: string;
  itens: ItemPedido[];
}

export interface ItemPedido {
  id?: number;
  produtoId: number;
  produtoDescricao?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  unidadeMedida: { sigla: string };
  estoqueAtual: number;
}

export interface Cliente {
  id: number;
  razaoSocial: string;
  documento: string;
  tipoPessoa?: string;
  nomeFantasia?: string;
  endereco?: string;
  contato?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type DashboardPeriodo = 'HOJE' | 'ULTIMOS_7_DIAS' | 'ULTIMO_MES' | 'MES_ANTERIOR' | 'ESTE_ANO' | 'ANO_ANTERIOR';

export interface DashboardResumoResponse {
  produtoMaisVendidoNome: string | null;
  produtoMaisVendidoQtd: number | null;
  clienteMaisFielNome: string | null;
  clienteMaisFielCompras: number | null;
  totalVendidoPeriodo: number;
}

export interface DashboardTopClienteResponse {
  clienteId: number;
  clienteNome: string;
  quantidadeCompras: number | null;
  valorTotal: number | null;
}

export interface ClienteFinanceiroResponse {
  cliente?: Cliente;
  clienteResponse?: Cliente;
  dividaTotal: number;
  dividaMesAtual: number;
  dividaMesAnterior: number;
  saldoCredito: number;
  totalPedidosPendentes: number;
  totalPedidosPagos: number;
  historicoPedidos: Pedido[];
}

export interface ClientePendenciaFinanceira {
  clienteId: number;
  cliente: Cliente;
  dividaTotal: number;
  saldoCredito: number;
  totalPedidosPendentes: number;
  totalPedidosPagos: number;
}

export interface AbaterDividaRequest {
  valorPago: number;
}

export interface AbaterDividaResponse {
  pedidosQuitados: number[];
  valorUtilizado: number;
  creditoAdicionado: number;
  novoSaldoCredito: number;
  novaDividaTotal: number;
}
