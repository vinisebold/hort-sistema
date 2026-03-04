export interface NaturezaOperacao {
  id: number;
  descricao: string;
  tipoMovimento: 'ENTRADA' | 'SAIDA';
  exigeCliente: boolean;
  exigeValorUnitario: boolean;
  exigeStatus: boolean;
}

export interface Pedido {
  id: number;
  naturezaOperacaoId?: number;
  naturezaOperacao?: NaturezaOperacao | string;
  naturezaOperacaoTipo?: string;
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
}

export interface ClienteFinanceiroResponse {
  cliente: Cliente & { 
    tipoPessoa: string;
    documento: string;
    endereco?: string;
    contato?: string;
  };
  dividaTotal: number;
  dividaMesAtual: number;
  dividaMesAnterior: number;
  saldoCredito: number;
  totalPedidosPendentes: number;
  totalPedidosPagos: number;
  historicoPedidos: Pedido[];
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
