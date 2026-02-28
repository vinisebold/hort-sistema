import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, Snackbar, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Checkbox
} from '@mui/material'
import { Add, Visibility } from '@mui/icons-material'
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
  formaPagamento: string
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
  const [openView, setOpenView] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>([])
  const [showOverlay, setShowOverlay] = useState(false)

  const [selectedIds, setSelectedIds] = useState<number[]>([])

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
      setPedidos(response.data)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
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

  const getNaturezaChip = (tipo: string, tipoMovimento?: string) => {
    if (tipoMovimento === 'ENTRADA') {
      return <Chip label={tipo} color="success" size="small" />
    }
    return <Chip label={tipo} color="warning" size="small" />
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
              <TableCell>ID</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell align="right" sx={{ pr: 6 }}>Valor (R$)</TableCell>
              <TableCell sx={{ pl: 6, pr: 1.5 }}>Status</TableCell>
              <TableCell sx={{ pl: 1.5 }}>Tipo/Origem</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id} selected={selectedIds.includes(pedido.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(pedido.id)}
                    onChange={() => handleSelectOne(pedido.id)}
                  />
                </TableCell>
                <TableCell>#{pedido.id}</TableCell>
                <TableCell>{new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{pedido.clienteNome}</TableCell>
                <TableCell align="right" sx={{ pr: 6 }}>R$ {pedido.valorTotal.toFixed(2)}</TableCell>
                <TableCell sx={{ pl: 6, pr: 1.5 }}>
                  <Chip 
                    label={pedido.statusPagamento} 
                    color={pedido.statusPagamento === 'PAGO' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell sx={{ pl: 1.5 }}>{getNaturezaChip(pedido.naturezaOperacao)}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleView(pedido.id)}>
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

      {/* Dialog Visualizar Pedido */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pedido #{selectedPedido?.id}</DialogTitle>
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
                  <Typography variant="body2" color="text.secondary">Forma de Pagamento</Typography>
                  <Typography>{selectedPedido.formaPagamento}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedPedido.statusPagamento} 
                    color={selectedPedido.statusPagamento === 'PAGO' ? 'success' : 'warning'} 
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
