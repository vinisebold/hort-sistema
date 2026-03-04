import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, Snackbar, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Alert, Checkbox, CircularProgress, Menu, MenuItem
} from '@mui/material'
import { Add, Visibility, MoreVert, ArrowDownward, ArrowUpward } from '@mui/icons-material'
import { pedidosApi, naturezasApi } from '../services/api'
import NaturezaOverlay from '../components/NaturezaOverlay'

interface NaturezaOperacao {
  id: number
  descricao: string
}

interface Pedido {
  id: number
  naturezaOperacao: string
  naturezaOperacaoTipo?: string
  clienteNome: string
  documentoReferencia: string
  valorTotal: number
  statusPagamento: string
  dataEmissao: string
  itens?: ItemPedido[]
}

interface ItemPedido {
  produtoDescricao?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export default function PedidosPage() {
  const navigate = useNavigate()
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

  const getStatusColor = (status: string) => {
    if (status === 'CANCELADO') return 'error'
    if (status === 'PAGO') return 'success'
    return 'warning'
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < pedidos.length}
                  checked={pedidos.length > 0 && selectedIds.length === pedidos.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Série/Número</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell align="right" sx={{ pr: 6 }}>Valor (R$)</TableCell>
              <TableCell sx={{ pl: 6, pr: 1.5 }}>Status</TableCell>
              <TableCell sx={{ pl: 1.5 }}>Tipo/Origem</TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow
                key={pedido.id}
                selected={selectedIds.includes(pedido.id)}
                sx={{ opacity: pedido.statusPagamento === 'CANCELADO' ? 0.5 : 1 }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(pedido.id)}
                    onChange={() => handleSelectOne(pedido.id)}
                  />
                </TableCell>
                <TableCell>{pedido.id}</TableCell>
                <TableCell>{new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{pedido.clienteNome}</TableCell>
                <TableCell align="right" sx={{ pr: 6 }}>R$ {pedido.valorTotal.toFixed(2)}</TableCell>
                <TableCell sx={{ pl: 6, pr: 1.5 }}>
                  <Chip
                    label={pedido.statusPagamento}
                    color={getStatusColor(pedido.statusPagamento)}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ pl: 1.5 }}>{getNaturezaChip(pedido.naturezaOperacao)}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleView(pedido.id)} title="Visualizar">
                    <Visibility />
                  </IconButton>
                  <IconButton onClick={(e) => handleMenuOpen(e, pedido)} title="Mais opções">
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasNext && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button onClick={loadMore} disabled={loadingMore} variant="outlined">
            {loadingMore ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Carregar mais
          </Button>
        </Box>
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
          disabled={selectedMenuPedido?.statusPagamento === 'CANCELADO'}
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
        <DialogTitle>
          Pedido {selectedPedido?.id}
          {selectedPedido?.statusPagamento === 'CANCELADO' && (
            <Chip label="CANCELADO" color="error" size="small" sx={{ ml: 1 }} />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedPedido && (
            <Box>
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Data</Typography>
                  <Typography>{new Date(selectedPedido.dataEmissao).toLocaleString('pt-BR')}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Natureza</Typography>
                  {getNaturezaChip(selectedPedido.naturezaOperacao)}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Cliente</Typography>
                  <Typography>{selectedPedido.clienteNome}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedPedido.statusPagamento}
                    color={getStatusColor(selectedPedido.statusPagamento)}
                  />
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>Itens</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell align="right">Qtd</TableCell>
                    <TableCell align="right">Valor Unit.</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPedido.itens?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.produtoDescricao}</TableCell>
                      <TableCell align="right">{item.quantidade}</TableCell>
                      <TableCell align="right">R$ {item.valorUnitario.toFixed(2)}</TableCell>
                      <TableCell align="right">R$ {item.valorTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right"><strong>TOTAL:</strong></TableCell>
                    <TableCell align="right"><strong>R$ {selectedPedido.valorTotal.toFixed(2)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedPedido?.statusPagamento !== 'CANCELADO' && (
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
          <Button onClick={() => setOpenView(false)}>Fechar</Button>
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
