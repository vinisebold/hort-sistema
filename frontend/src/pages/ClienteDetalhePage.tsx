import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, Button, Chip, IconButton, Alert, CircularProgress, Menu, MenuItem
} from '@mui/material'
import {
  ArrowBack, InfoOutlined, MoreVert
} from '@mui/icons-material'
import axios from 'axios'
import { clientesApi, pedidosApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { ClienteFinanceiroResponse, AbaterDividaResponse, Pedido } from '../types'

type PeriodoFiltro = '7_DIAS' | '30_DIAS' | 'MES_ATUAL' | 'MES_PASSADO' | 'TODOS'

export default function ClienteDetalhePage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [clienteFinanceiro, setClienteFinanceiro] = useState<ClienteFinanceiroResponse | null>(null)
  const [valorPago, setValorPago] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('MES_ATUAL')
  const [processingStatusPedidoId, setProcessingStatusPedidoId] = useState<number | null>(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedPedidoHistorico, setSelectedPedidoHistorico] = useState<Pedido | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Cliente não encontrado')
      setLoading(false)
      return
    }
    loadClienteFinanceiro()
  }, [id])

  const loadClienteFinanceiro = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!id) return
      const response = await clientesApi.getResumoFinanceiro(parseInt(id))
      setClienteFinanceiro(response.data)
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Erro ao carregar dados do cliente')
      } else {
        setError('Erro ao carregar dados do cliente')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status: string | null): 'default' | 'success' | 'warning' => {
    if (status === 'PAGO') return 'success'
    if (status === 'PENDENTE') return 'warning'
    return 'default'
  }

  const handleAbaterDivida = async () => {
    if (!valorPago || parseFloat(valorPago) <= 0 || !id) {
      showToast('Informe um valor válido para abater', 'warning')
      return
    }

    try {
      setProcessingPayment(true)
      const response = await clientesApi.abaterDivida(parseInt(id), {
        valorPago: parseFloat(valorPago)
      })
      
      const data = response.data as AbaterDividaResponse
      
      showToast(`Pagamento registrado! ${data.pedidosQuitados.length} pedido(s) quitado(s).`, 'success')
      
      setValorPago('')
      await loadClienteFinanceiro()
    } catch (error) {
      console.error('Erro ao abater dívida:', error)
      if (axios.isAxiosError(error)) {
        showToast(error.response?.data?.message || 'Erro ao processar pagamento', 'error')
      } else {
        showToast('Erro ao processar pagamento', 'error')
      }
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleVoltar = () => {
    navigate('/clientes')
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pedido: Pedido) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedPedidoHistorico(pedido)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setSelectedPedidoHistorico(null)
  }

  const handleIrParaPedido = () => {
    if (!selectedPedidoHistorico) return

    navigate('/pedidos', {
      state: {
        highlightPedidoId: selectedPedidoHistorico.id,
        fromCliente: true,
      }
    })
    handleMenuClose()
  }

  const handleMarcarPedidoComoPago = async (pedidoId: number) => {
    try {
      setProcessingStatusPedidoId(pedidoId)
      await pedidosApi.marcarComoPago(pedidoId)
      showToast('Pedido marcado como PAGO com sucesso.', 'success')
      await loadClienteFinanceiro()
      handleMenuClose()
    } catch (error) {
      console.error('Erro ao marcar pedido como pago:', error)
      if (axios.isAxiosError(error)) {
        showToast(error.response?.data?.message || 'Erro ao marcar pedido como pago', 'error')
      } else {
        showToast('Erro ao marcar pedido como pago', 'error')
      }
    } finally {
      setProcessingStatusPedidoId(null)
    }
  }

  const getPeriodoRange = (filtro: PeriodoFiltro) => {
    const agora = new Date()
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())

    if (filtro === '7_DIAS') {
      const inicio = new Date(inicioHoje)
      inicio.setDate(inicio.getDate() - 6)
      return { inicio, fim: null }
    }

    if (filtro === '30_DIAS') {
      const inicio = new Date(inicioHoje)
      inicio.setDate(inicio.getDate() - 29)
      return { inicio, fim: null }
    }

    if (filtro === 'MES_ATUAL') {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
      const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 1)
      return { inicio, fim }
    }

    if (filtro === 'MES_PASSADO') {
      const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
      const fim = new Date(agora.getFullYear(), agora.getMonth(), 1)
      return { inicio, fim }
    }

    return { inicio: null, fim: null }
  }

  const getPeriodoLabel = (filtro: PeriodoFiltro) => {
    if (filtro === '7_DIAS') return 'Últimos 7 dias'
    if (filtro === '30_DIAS') return 'Últimos 30 dias'
    if (filtro === 'MES_ATUAL') return 'Este mês'
    if (filtro === 'MES_PASSADO') return 'Mês passado'
    return 'Todo período'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !clienteFinanceiro) {
    return (
      <Box sx={{ mt: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleVoltar}
          sx={{ mb: 2 }}
        >
          Voltar
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const cliente = clienteFinanceiro?.cliente
  const saldoCredito = clienteFinanceiro?.saldoCredito || 0
  const dividaTotalLiquida = clienteFinanceiro?.dividaTotal || 0

  const historicoPedidos = clienteFinanceiro?.historicoPedidos || []
  const periodo = getPeriodoRange(periodoFiltro)

  const pedidosFiltrados = historicoPedidos.filter((pedido) => {
    const dataPedido = new Date(pedido.dataEmissao)

    if (periodo.inicio && dataPedido < periodo.inicio) return false
    if (periodo.fim && dataPedido >= periodo.fim) return false

    return true
  })

  const pedidosPendentesFiltrados = pedidosFiltrados.filter((pedido) => pedido.status === 'PENDENTE')
  const dividaFiltrada = pedidosPendentesFiltrados.reduce((total, pedido) => total + pedido.valorTotal, 0)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={handleVoltar} size="small">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>{cliente?.razaoSocial || 'Cliente'}</Typography>
          <Typography variant="body2" sx={{ color: '#888' }}>
            {cliente?.documento}
          </Typography>
        </Box>
      </Box>

      {/* Financial Summary Card */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
            Dívida
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            <Chip label="7 dias" clickable color={periodoFiltro === '7_DIAS' ? 'primary' : 'default'} onClick={() => setPeriodoFiltro('7_DIAS')} />
            <Chip label="30 dias" clickable color={periodoFiltro === '30_DIAS' ? 'primary' : 'default'} onClick={() => setPeriodoFiltro('30_DIAS')} />
            <Chip label="Este mês" clickable color={periodoFiltro === 'MES_ATUAL' ? 'primary' : 'default'} onClick={() => setPeriodoFiltro('MES_ATUAL')} />
            <Chip label="Mês passado" clickable color={periodoFiltro === 'MES_PASSADO' ? 'primary' : 'default'} onClick={() => setPeriodoFiltro('MES_PASSADO')} />
            <Chip label="Todos" clickable color={periodoFiltro === 'TODOS' ? 'primary' : 'default'} onClick={() => setPeriodoFiltro('TODOS')} />
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                Dívida no Período
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>
                {formatCurrency(dividaFiltrada)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                {getPeriodoLabel(periodoFiltro)} - {pedidosPendentesFiltrados.length} pendente{pedidosPendentesFiltrados.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                Crédito Disponível
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>
                {formatCurrency(saldoCredito)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Saldo em carteira
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                Dívida Total Líquida
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>
                {formatCurrency(dividaTotalLiquida)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Já considera pedidos pagos e desconto de crédito
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
            Registrar Pagamento
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, color: '#888' }}>
            <InfoOutlined sx={{ mr: 1, fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              Os pagamentos são aplicados automaticamente aos pedidos pendentes seguindo a ordem FIFO (primeiro a entrar, primeiro a sair).
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <TextField
              label="Valor Pago"
              type="number"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              disabled={processingPayment}
              inputProps={{ step: '0.01', min: '0' }}
              sx={{ minWidth: '200px' }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAbaterDivida}
              disabled={processingPayment || !valorPago}
              sx={{ mt: 1 }}
            >
              {processingPayment ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              ABATER DÍVIDA
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Orders History Table */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
            Histórico de Pedidos
          </Typography>
          
          {pedidosFiltrados.length > 0 ? (
            <TableContainer sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: '1px solid #ddd' } }}>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Doc. Ref</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Valor</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedidosFiltrados.map((pedido: Pedido) => (
                    <TableRow 
                      key={pedido.id} 
                      sx={{ 
                        '&:hover': { bgcolor: '#e8eceb' },
                        '& td': { borderBottom: '1px solid #ddd' }
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>#{pedido.id}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>{formatDate(pedido.dataEmissao)}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>{pedido.documentoReferencia || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#555' }}>{formatCurrency(pedido.valorTotal)}</TableCell>
                      <TableCell>
                        <Chip
                          label={pedido.status || 'N/A'}
                          color={getStatusColor(pedido.status)}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, pedido)}
                          disabled={processingStatusPedidoId === pedido.id}
                        >
                          {processingStatusPedidoId === pedido.id ? <CircularProgress size={16} /> : <MoreVert fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#888' }}>
                Nenhum pedido encontrado para o período selecionado.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleIrParaPedido}>Ir para pedido</MenuItem>
        <MenuItem
          onClick={() => selectedPedidoHistorico && handleMarcarPedidoComoPago(selectedPedidoHistorico.id)}
          disabled={selectedPedidoHistorico?.status !== 'PENDENTE' || processingStatusPedidoId === selectedPedidoHistorico?.id}
        >
          Marcar como PAGO
        </MenuItem>
      </Menu>
    </Box>
  )
}
