import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Tooltip, Card, CardContent, Dialog, DialogTitle, DialogContent, Button, Avatar, Divider, IconButton } from '@mui/material'
import { Launch, History, TrendingUp, TrendingDown, Visibility } from '@mui/icons-material'
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
  unidadeMedidaSigla: string
}

interface TimelineModalProps {
  open: boolean
  onClose: () => void
  produto: ProdutoEstoque | null
  movimentacoes: Movimentacao[]
  onNavigateToPedido: (pedidoId: number) => void
}

function TimelineModal({ open, onClose, produto, movimentacoes, onNavigateToPedido }: TimelineModalProps) {
  if (!produto) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 500, color: '#333' }}>
            Histórico de Movimentações
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
            {produto.descricao} • Código: {produto.codigo}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {movimentacoes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <History sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#888' }}>
              Nenhuma movimentação encontrada
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* Vertical line that goes through all items */}
            <Box sx={{
              position: 'absolute',
              left: 43, // 3*8 (ml:3) + 40/2 (avatar width/2)
              top: 20, // First avatar top margin
              bottom: 20,
              width: 2,
              bgcolor: '#e0e0e0',
              zIndex: 0
            }} />
            
            {/* Timeline items */}
            {movimentacoes.map((mov) => {
              const isEntrada = mov.tipoMovimento === 'ENTRADA'
              const date = new Date(mov.dataMovimentacao)
              const dateStr = date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })
              const timeStr = date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })

              return (
                <Box key={mov.id} sx={{ display: 'flex', position: 'relative' }}>
                  {/* Timeline column with avatar */}
                  <Box sx={{ 
                    width: 40, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    pt: 2,
                    pb: 2,
                    ml: 3
                  }}>
                    {/* Avatar */}
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: isEntrada ? '#4caf50' : '#ff9800',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 1,
                        position: 'relative'
                      }}
                    >
                      {isEntrada ? (
                        <TrendingUp sx={{ fontSize: 20 }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 20 }} />
                      )}
                    </Avatar>
                  </Box>

                  {/* Content */}
                  <Box sx={{ 
                    flex: 1, 
                    py: 2,
                    px: 2,
                    mr: 3,
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                      borderRadius: 1
                    }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      mb: 1
                    }}>
                      <Box>
                        <Chip
                          label={mov.tipoMovimento}
                          color={isEntrada ? 'success' : 'warning'}
                          size="small"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            mb: 0.5
                          }}
                        />
                        <Typography variant="body2" sx={{ 
                          color: '#555',
                          fontWeight: 500,
                          fontSize: '0.95rem'
                        }}>
                          {mov.quantidade} {mov.unidadeMedidaSigla}
                        </Typography>
                      </Box>
                      
                      {mov.pedidoId && (
                        <Tooltip title="Ver pedido">
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<Launch fontSize="small" />}
                            onClick={() => onNavigateToPedido(mov.pedidoId!)}
                            sx={{ 
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              borderRadius: 2
                            }}
                          >
                            Ver Pedido
                          </Button>
                        </Tooltip>
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                      {mov.naturezaOperacaoDescricao}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      alignItems: 'center',
                      mt: 1
                    }}>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {dateStr} • {timeStr}
                      </Typography>
                      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#555', fontWeight: 500 }}>
                        Estoque após: {mov.estoqueAposMovimentacao} {mov.unidadeMedidaSigla}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ produto, onViewHistory }: { produto: ProdutoEstoque; onViewHistory: () => void }) {
  return (
    <TableRow 
      onClick={onViewHistory}
      sx={{ 
        '&:hover': { bgcolor: '#f8f9fa', cursor: 'pointer' },
        transition: 'background-color 0.2s'
      }}
    >
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
      <TableCell align="right" sx={{ width: 60 }}>
        <Tooltip title="Ver histórico">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onViewHistory()
            }}
            sx={{ color: '#666' }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

export default function EstoquePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Record<number, Movimentacao[]>>({})
  const [selectedProduto, setSelectedProduto] = useState<ProdutoEstoque | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const hasRestoredState = useRef(false)

  useEffect(() => {
    loadProdutos().catch(console.error)
  }, [])

  useEffect(() => {
    const state = location.state as { expandedProdutoId?: number; scrollPosition?: number }
    if (state?.expandedProdutoId && produtos.length > 0 && !hasRestoredState.current) {
      hasRestoredState.current = true
      const produtoId = state.expandedProdutoId
      const produto = produtos.find(p => p.id === produtoId)
      if (produto) {
        handleViewHistory(produto)
      }
      
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

  const handleViewHistory = async (produto: ProdutoEstoque) => {
    setSelectedProduto(produto)
    setModalOpen(true)

    if (!movimentacoes[produto.id]) {
      try {
        const response = await estoqueApi.timeline(produto.id)
        setMovimentacoes(prev => ({ ...prev, [produto.id]: response.data }))
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error)
      }
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  const handleNavigateToPedido = (pedidoId: number) => {
    navigate('/pedidos', { 
      state: { 
        highlightPedidoId: pedidoId,
        fromEstoque: true,
        expandedProdutoId: selectedProduto?.id,
        scrollPosition: window.scrollY
      } 
    })
    setModalOpen(false)
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
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Produto
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Estoque Atual
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtos.map((produto) => (
                  <Row
                    key={produto.id}
                    produto={produto}
                    onViewHistory={() => handleViewHistory(produto)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ color: '#555', fontSize: '0.95rem' }}>
              Exibindo {produtos.length} de {produtos.length}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <TimelineModal
        open={modalOpen}
        onClose={handleCloseModal}
        produto={selectedProduto}
        movimentacoes={selectedProduto ? (movimentacoes[selectedProduto.id] || []) : []}
        onNavigateToPedido={handleNavigateToPedido}
      />
    </Box>
  )
}
