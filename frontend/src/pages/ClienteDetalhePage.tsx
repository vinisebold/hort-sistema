import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, Button, Chip, IconButton, Snackbar, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import {
  ArrowBack, CreditCard, AttachMoney, DateRange, CheckCircle
} from '@mui/icons-material'
import axios from 'axios'
import { clientesApi, pedidosApi } from '../services/api'
import { ClienteFinanceiroResponse, AbaterDividaResponse, Pedido } from '../types'

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

export default function ClienteDetalhePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [clienteFinanceiro, setClienteFinanceiro] = useState<ClienteFinanceiroResponse | null>(null)
  const [valorPago, setValorPago] = useState('')
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' })
  const [error, setError] = useState<string | null>(null)
  const [marcarPagoDialog, setMarcarPagoDialog] = useState<{ open: boolean; pedidoId?: number }>({ open: false })

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

  const getStatusColor = (status: string | null): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    if (status === 'PAGO') return 'success'
    if (status === 'PENDENTE') return 'warning'
    if (status === 'CANCELADO') return 'error'
    return 'default'
  }

  const handleAbaterDivida = async () => {
    if (!valorPago || parseFloat(valorPago) <= 0 || !id) {
      setSnackbar({
        open: true,
        message: 'Informe um valor válido para abater',
        severity: 'warning'
      })
      return
    }

    try {
      setProcessingPayment(true)
      const response = await clientesApi.abaterDivida(parseInt(id), {
        valorPago: parseFloat(valorPago)
      })
      
      const data = response.data as AbaterDividaResponse
      
      setSnackbar({
        open: true,
        message: `Pagamento registrado! ${data.pedidosQuitados.length} pedido(s) quitado(s).`,
        severity: 'success'
      })
      
      setValorPago('')
      await loadClienteFinanceiro()
    } catch (error) {
      console.error('Erro ao abater dívida:', error)
      if (axios.isAxiosError(error)) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Erro ao processar pagamento',
          severity: 'error'
        })
      } else {
        setSnackbar({
          open: true,
          message: 'Erro ao processar pagamento',
          severity: 'error'
        })
      }
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleMarcarComoPago = async () => {
    if (!marcarPagoDialog.pedidoId || !id) return

    try {
      setProcessingPayment(true)
      await pedidosApi.marcarComoPago(marcarPagoDialog.pedidoId)
      
      setSnackbar({
        open: true,
        message: 'Pedido marcado como pago com sucesso',
        severity: 'success'
      })
      
      setMarcarPagoDialog({ open: false })
      await loadClienteFinanceiro()
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      if (axios.isAxiosError(error)) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Erro ao marcar pedido como pago',
          severity: 'error'
        })
      } else {
        setSnackbar({
          open: true,
          message: 'Erro ao marcar pedido como pago',
          severity: 'error'
        })
      }
      setMarcarPagoDialog({ open: false })
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleVoltar = () => {
    navigate('/clientes')
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
  const pendentes = clienteFinanceiro?.totalPedidosPendentes || 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={handleVoltar} size="small">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5">{cliente?.razaoSocial || 'Cliente'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {cliente?.documento}
          </Typography>
        </Box>
      </Box>

      {/* Financial Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Card: Dívida Total */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              boxShadow: 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                DÍVIDA TOTAL
              </Typography>
              <AttachMoney sx={{ fontSize: 20, color: '#c62828' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 'bold' }}>
              {formatCurrency(clienteFinanceiro?.dividaTotal || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pendentes} pendente{pendentes !== 1 ? 's' : ''}
            </Typography>
          </Paper>
        </Grid>

        {/* Card: Este Mês */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              boxShadow: 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                ESTE MÊS
              </Typography>
              <DateRange sx={{ fontSize: 20, color: '#f57f17' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#f57f17', fontWeight: 'bold' }}>
              {formatCurrency(clienteFinanceiro?.dividaMesAtual || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dívida atual
            </Typography>
          </Paper>
        </Grid>

        {/* Card: Mês Anterior */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
              boxShadow: 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                MÊS ANTERIOR
              </Typography>
              <DateRange sx={{ fontSize: 20, color: '#6a1b9a' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
              {formatCurrency(clienteFinanceiro?.dividaMesAnterior || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Período anterior
            </Typography>
          </Paper>
        </Grid>

        {/* Card: Crédito Disponível */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              boxShadow: 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                CRÉDITO DISPONÍVEL
              </Typography>
              <CreditCard sx={{ fontSize: 20, color: '#2e7d32' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              {formatCurrency(clienteFinanceiro?.saldoCredito || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Saldo positivo
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Section */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          💰 REGISTRAR PAGAMENTO
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <TextField
            label="Valor (R$)"
            type="number"
            value={valorPago}
            onChange={(e) => setValorPago(e.target.value)}
            disabled={processingPayment}
            inputProps={{ step: '0.01', min: '0' }}
            sx={{ minWidth: '150px' }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleAbaterDivida}
            disabled={processingPayment || !valorPago}
            sx={{ mt: 1 }}
          >
            {processingPayment ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            ABATER DÍVIDA
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          ℹ️ Os pagamentos são aplicados automaticamente aos pedidos pendentes seguindo a ordem FIFO (primeiro a entrar, primeiro a sair).
        </Typography>
      </Paper>

      {/* Orders History Table */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>HISTÓRICO DE PEDIDOS</Typography>
        
        {clienteFinanceiro?.historicoPedidos && clienteFinanceiro.historicoPedidos.length > 0 ? (
          <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>#ID</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Doc. Ref</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clienteFinanceiro.historicoPedidos.map((pedido: Pedido) => (
                  <TableRow key={pedido.id} hover>
                    <TableCell>{pedido.id}</TableCell>
                    <TableCell>{formatDate(pedido.dataEmissao)}</TableCell>
                    <TableCell>{pedido.documentoReferencia || '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(pedido.valorTotal)}</TableCell>
                    <TableCell>
                      <Chip
                        label={pedido.status || 'N/A'}
                        color={getStatusColor(pedido.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {pedido.status === 'PENDENTE' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => setMarcarPagoDialog({ open: true, pedidoId: pedido.id })}
                          disabled={processingPayment}
                        >
                          Marcar Pago
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 18, color: '#2e7d32' }} />
                          <Typography variant="caption">Quitado</Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', boxShadow: 1 }}>
            <Typography color="text.secondary">
              Nenhum pedido encontrado para este cliente.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Dialog: Confirmar Marcar Como Pago */}
      <Dialog open={marcarPagoDialog.open} onClose={() => setMarcarPagoDialog({ open: false })}>
        <DialogTitle>Marcar Pedido como Pago?</DialogTitle>
        <DialogContent>
          <Typography>
            Você tem certeza que deseja marcar o pedido #{marcarPagoDialog.pedidoId} como pago?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarcarPagoDialog({ open: false })}>Cancelar</Button>
          <Button
            onClick={handleMarcarComoPago}
            color="success"
            variant="contained"
            disabled={processingPayment}
          >
            {processingPayment ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
