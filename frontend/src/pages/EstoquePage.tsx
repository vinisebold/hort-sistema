import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Collapse, Tooltip, Card, CardContent } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp, Launch } from '@mui/icons-material'
import { estoqueApi } from '../services/api'

interface ProdutoEstoque {
  id: number
  codigo: string
  descricao: string
  unidadeMedidaSigla: string
  estoqueAtual: number
  isActive: boolean
}

interface Movimentacao {
  id: number
  produtoId: number
  produtoDescricao: string
  naturezaOperacaoDescricao: string
  tipoMovimento: string
  pedidoId: number | null
  quantidade: number
  estoqueAposMovimentacao: number
  dataMovimentacao: string
}

function Row({ produto, onExpand, expanded, movimentacoes }: { produto: ProdutoEstoque; onExpand: () => void; expanded: boolean; movimentacoes: Movimentacao[] }) {
  const navigate = useNavigate()

  const handleNavigateToPedido = (pedidoId: number) => {
    navigate('/pedidos', { 
      state: { 
        highlightPedidoId: pedidoId,
        fromEstoque: true,
        expandedProdutoId: produto.id,
        scrollPosition: window.scrollY
      } 
    })
  }

  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
        <TableCell sx={{ width: 50 }}>
          <IconButton size="small" onClick={onExpand}>
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
              {produto.descricao}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              Código: {produto.codigo} • {produto.unidadeMedidaSigla}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ width: 150 }}>
          <Chip
            label={`${produto.estoqueAtual} ${produto.unidadeMedidaSigla}`}
            color={produto.estoqueAtual > 0 ? 'success' : 'error'}
            sx={{ fontWeight: 500, minWidth: 80 }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ py: 0, bgcolor: '#f9f9f9', borderBottom: expanded ? '1px solid #ddd' : 'none' }}>
          <Collapse in={expanded} timeout="auto">
            <Box sx={{ py: 3, px: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 500, color: '#333' }}>
                Histórico de Movimentações
              </Typography>
              {movimentacoes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    Nenhuma movimentação encontrada
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ bgcolor: 'white', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>Data</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>Natureza</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>Tipo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>Quantidade</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>Estoque Após</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>Pedido</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {movimentacoes.map((mov) => (
                        <TableRow 
                          key={mov.id}
                          sx={{ 
                            '&:hover': { bgcolor: '#f8f9fa' },
                            '& td': { borderBottom: '1px solid #eee' }
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>
                            {new Date(mov.dataMovimentacao).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>
                            {mov.naturezaOperacaoDescricao}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={mov.tipoMovimento}
                              color={mov.tipoMovimento === 'ENTRADA' ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#555' }}>
                            {mov.quantidade}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#555', fontWeight: 500 }}>
                            {mov.estoqueAposMovimentacao}
                          </TableCell>
                          <TableCell align="center">
                            {mov.pedidoId ? (
                              <Tooltip title="Ver pedido">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleNavigateToPedido(mov.pedidoId!)}
                                >
                                  <Launch fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" sx={{ color: '#aaa' }}>-</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default function EstoquePage() {
  const location = useLocation()
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Record<number, Movimentacao[]>>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const hasRestoredState = useRef(false)

  useEffect(() => {
    loadProdutos().catch(console.error)
  }, [])

  useEffect(() => {
    const state = location.state as { expandedProdutoId?: number; scrollPosition?: number }
    if (state?.expandedProdutoId && produtos.length > 0 && !hasRestoredState.current) {
      hasRestoredState.current = true
      const produtoId = state.expandedProdutoId
      handleExpand(produtoId)
      
      if (state.scrollPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo({ top: state.scrollPosition, behavior: 'smooth' })
        }, 300)
      }
    }
  }, [produtos.length])

  const loadProdutos = async () => {
    try {
      const response = await estoqueApi.listarProdutos()
      setProdutos(response.data)
    } catch (error) {
      console.error('Erro ao carregar estoque:', error)
    }
  }

  const handleExpand = async (produtoId: number) => {
    if (expandedId === produtoId) {
      setExpandedId(null)
      return
    }

    setExpandedId(produtoId)

    if (!movimentacoes[produtoId]) {
      try {
        const response = await estoqueApi.timeline(produtoId)
        setMovimentacoes(prev => ({ ...prev, [produtoId]: response.data }))
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error)
      }
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Controle de Estoque
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Visualize o estoque atual e o histórico de movimentações dos produtos
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50} sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }} />
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Produto
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Estoque Atual
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtos.map((produto) => (
                  <Row
                    key={produto.id}
                    produto={produto}
                    expanded={expandedId === produto.id}
                    onExpand={() => handleExpand(produto.id)}
                    movimentacoes={movimentacoes[produto.id] || []}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
