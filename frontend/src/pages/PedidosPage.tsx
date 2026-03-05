import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Snackbar, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Alert, Checkbox, CircularProgress, Menu, MenuItem, Card, CardContent
} from '@mui/material'
import { Add, Visibility, MoreVert, ArrowDownward, ArrowUpward, ArrowBack } from '@mui/icons-material'
import { pedidosApi, naturezasApi } from '../services/api'
import NaturezaOverlay from '../components/NaturezaOverlay'
import { NaturezaOperacao, Pedido } from '../types'

export default function PedidosPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>([])
  const [showOverlay, setShowOverlay] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [cancelConfirm, setCancelConfirm] = useState<Pedido | null>(null)
  const [highlightedId, setHighlightedId] = useState<number | null>(null)
  const [showBackButton, setShowBackButton] = useState(false)
  const [estoqueState, setEstoqueState] = useState<{ expandedProdutoId?: number; scrollPosition?: number } | null>(null)
  
  const pedidoRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({})
  const hasProcessedNavigation = useRef(false)
  
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedMenuPedido, setSelectedMenuPedido] = useState<Pedido | null>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pedido: Pedido) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedMenuPedido(pedido)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setSelectedMenuPedido(null)
  }

  useEffect(() => {
    loadPedidos().catch(console.error)
    loadNaturezas().catch(console.error)
  }, [])

  useEffect(() => {
    const state = location.state as { highlightPedidoId?: number; fromEstoque?: boolean; expandedProdutoId?: number; scrollPosition?: number }
    
    // Só processa uma vez por navegação
    if (state?.fromEstoque && !hasProcessedNavigation.current) {
      hasProcessedNavigation.current = true
      setShowBackButton(true)
      setEstoqueState({
        expandedProdutoId: state.expandedProdutoId,
        scrollPosition: state.scrollPosition
      })
      
      // Se veio do estoque, processa o highlight
      if (state.highlightPedidoId && pedidos.length > 0) {
        const pedidoId = state.highlightPedidoId
        setHighlightedId(pedidoId)
        
        setTimeout(() => {
          const rowElement = pedidoRefs.current[pedidoId]
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
        
        setTimeout(() => {
          setHighlightedId(null)
        }, 4000)
      }
      
      // Limpa o state apenas uma vez, após processar
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [pedidos, location.state, location.pathname, navigate])

  // Reset quando componente desmonta ou rota muda completamente
  useEffect(() => {
    return () => {
      hasProcessedNavigation.current = false
    }
  }, [])

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(pedidos.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const loadPedidos = async () => {
    try {
      const response = await pedidosApi.listar()
      const payload = response.data
      const data = Array.isArray(payload) ? payload : (payload.data ?? [])
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setPedidos(data)
      setNextCursor(nc ?? null)
      setHasNext(hn)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    }
  }

  const loadMore = async () => {
    if (!hasNext || loadingMore || nextCursor == null) return
    setLoadingMore(true)
    try {
      const response = await pedidosApi.listar(nextCursor)
      const payload = response.data
      const data = Array.isArray(payload) ? payload : (payload.data ?? [])
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setPedidos(prev => [...prev, ...data])
      setNextCursor(nc ?? null)
      setHasNext(hn)
    } catch (error) {
      console.error('Erro ao carregar mais pedidos:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const loadNaturezas = async () => {
    try {
      const response = await naturezasApi.listar()
      setNaturezas(response.data)
    } catch (error) {
      console.error('Erro ao carregar naturezas:', error)
    }
  }

  const handleSelectNatureza = (id: number) => {
    setShowOverlay(false)
    navigate(`/pedidos/novo?naturezaId=${id}`)
  }

  const handleBackToEstoque = () => {
    navigate('/estoque', { state: estoqueState })
    setShowBackButton(false)
    hasProcessedNavigation.current = false
  }

  const handleView = async (id: number) => {
    try {
      const response = await pedidosApi.buscar(id)
      setSelectedPedido(response.data)
      setOpenView(true)
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
    }
  }

  const handleCancelar = async () => {
    if (!cancelConfirm) return
    try {
      await pedidosApi.cancelar(cancelConfirm.id)
      setCancelConfirm(null)
      setOpenView(false)
      setSnackbar({ open: true, message: 'Pedido cancelado com sucesso.', severity: 'success' })
      await loadPedidos()
    } catch (error: any) {
      setCancelConfirm(null)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erro ao cancelar pedido.',
        severity: 'error'
      })
    }
  }

  const getStatusColor = (status: string | null) => {
    if (status === 'CANCELADO') return 'error'
    if (status === 'PAGO') return 'success'
    if (status === 'PENDENTE') return 'warning'
    return 'default'
  }

  const getNaturezaChip = (tipo: string) => {
    const isEntrada = tipo?.toLowerCase().includes('compra') || tipo?.toLowerCase().includes('estorno')
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isEntrada ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
        <Typography variant="body2">{tipo}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Pedidos
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Gerencie pedidos de vendas e compras
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < pedidos.length}
                      checked={pedidos.length > 0 && selectedIds.length === pedidos.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Cliente
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Tipo/Origem
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Valor
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pedidos.map((pedido) => (
                  <TableRow
                    key={pedido.id}
                    ref={(el) => { pedidoRefs.current[pedido.id] = el }}
                    selected={selectedIds.includes(pedido.id)}
                    sx={{
                      backgroundColor: highlightedId === pedido.id ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
                      transition: 'background-color 3s ease-out',
                      '&:hover': { bgcolor: '#f8f9fa' },
                      '&.Mui-selected': { bgcolor: '#e3f2fd' },
                      '&.Mui-selected:hover': { bgcolor: '#bbdefb' }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(pedido.id)}
                        onChange={() => handleSelectOne(pedido.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
                          {pedido.clienteNome}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          Pedido #{pedido.id} • {new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>
                      {getNaturezaChip(typeof pedido.naturezaOperacao === 'string' ? pedido.naturezaOperacao : pedido.naturezaOperacao?.descricao || '')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.95rem', fontWeight: 500, color: '#333' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valorTotal)}
                    </TableCell>
                    <TableCell>
                      {pedido.status ? (
                        <Chip
                          label={pedido.status}
                          color={getStatusColor(pedido.status)}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Chip label="N/A" color="default" size="small" sx={{ fontSize: '0.75rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleView(pedido.id)} title="Visualizar" size="small">
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={(e) => handleMenuOpen(e, pedido)} title="Mais opções" size="small">
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {hasNext && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button onClick={loadMore} disabled={loadingMore} variant="outlined">
            {loadingMore ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Carregar mais
          </Button>
        </Box>
      )}

      {showBackButton && (
        <Fab
          color="primary"
          aria-label="back to estoque"
          onClick={handleBackToEstoque}
          sx={{
            position: 'fixed',
            bottom: 32,
            left: 32,
            transition: 'transform 0.2s',
          }}
        >
          <ArrowBack />
        </Fab>
      )}

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setShowOverlay(true)}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          transition: 'transform 0.2s',
          ...(showOverlay && { transform: 'scale(0)' })
        }}
      >
        <Add />
      </Fab>

      <NaturezaOverlay
        open={showOverlay}
        onClose={() => setShowOverlay(false)}
        naturezas={naturezas}
        onSelect={handleSelectNatureza}
      />

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        TransitionProps={{
          timeout: 150,
        }}
        slotProps={{
          paper: {
            sx: {
              marginLeft: '-38px',
            }
          }
        }}
      >
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement Devolver */ }}>
          Devolver
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement Retornar */ }}>
          Retornar
        </MenuItem>
        <MenuItem 
          onClick={() => { 
            handleMenuClose()
            if (selectedMenuPedido) setCancelConfirm(selectedMenuPedido)
          }}
          disabled={selectedMenuPedido?.status === 'CANCELADO'}
        >
          Cancelar
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement Ver financeiro */ }}>
          Ver financeiro
        </MenuItem>
      </Menu>

      {/* Dialog Confirmar Cancelamento */}
      <Dialog open={!!cancelConfirm} onClose={() => setCancelConfirm(null)}>
        <DialogTitle>Cancelar Pedido {cancelConfirm?.id}?</DialogTitle>
        <DialogContent>
          <Typography>
            Esta ação irá estornar o estoque e reverter os lotes FIFO associados a este pedido.
            Esta operação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirm(null)}>Voltar</Button>
          <Button onClick={handleCancelar} color="error" variant="contained">
            Confirmar Cancelamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualizar Pedido */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 300, color: '#333' }}>
              Pedido #{selectedPedido?.id}
            </Typography>
            {selectedPedido?.status === 'CANCELADO' && (
              <Chip label="CANCELADO" color="error" size="small" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedPedido && (
            <Box>
              <Box sx={{ display: 'flex', gap: 4, mb: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                    Cliente
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#333' }}>
                    {selectedPedido.clienteNome}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                    Data
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#555' }}>
                    {new Date(selectedPedido.dataEmissao).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                    Natureza
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {getNaturezaChip(typeof selectedPedido.naturezaOperacao === 'string' ? selectedPedido.naturezaOperacao : selectedPedido.naturezaOperacao?.descricao || '')}
                  </Box>
                </Box>
                {selectedPedido.status && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedPedido.status}
                        color={getStatusColor(selectedPedido.status)}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>

              <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 500, color: '#333' }}>
                Itens do Pedido
              </Typography>
              <TableContainer sx={{ bgcolor: '#fafafa', borderRadius: 1, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>
                        Produto
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>
                        Qtd
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>
                        Valor Unit.
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', borderBottom: '1px solid #ddd' }}>
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPedido.itens?.map((item, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                          '& td': { borderBottom: '1px solid #eee' }
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>
                          {item.produtoDescricao}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#555' }}>
                          {item.quantidade}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#555' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorUnitario)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#555' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'white' }}>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#333', borderBottom: 'none', pt: 2 }}>
                        TOTAL:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#333', borderBottom: 'none', pt: 2 }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPedido.valorTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2 }}>
          {selectedPedido?.status !== 'CANCELADO' && (
            <Button
              color="error"
              onClick={() => {
                setOpenView(false)
                setCancelConfirm(selectedPedido)
              }}
            >
              Cancelar Pedido
            </Button>
          )}
          <Button onClick={() => setOpenView(false)} variant="contained">Fechar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
