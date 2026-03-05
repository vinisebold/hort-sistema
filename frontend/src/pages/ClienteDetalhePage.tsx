import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, Button, Chip, IconButton, Alert, CircularProgress
} from '@mui/material'
import {
  ArrowBack, InfoOutlined
} from '@mui/icons-material'
import axios from 'axios'
import { clientesApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { ClienteFinanceiroResponse, AbaterDividaResponse, Pedido } from '../types'

export default function ClienteDetalhePage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [clienteFinanceiro, setClienteFinanceiro] = useState<ClienteFinanceiroResponse | null>(null)
  const [valorPago, setValorPago] = useState('')
  const [error, setError] = useState<string | null>(null)

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
            Resumo Financeiro
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                Dívida Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>
                {formatCurrency(clienteFinanceiro?.dividaTotal || 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                {pendentes} pendente{pendentes !== 1 ? 's' : ''}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                Dívida Mês Atual
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>
                {formatCurrency(clienteFinanceiro?.dividaMesAtual || 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Período corrente
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                Dívida Mês Anterior
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>
                {formatCurrency(clienteFinanceiro?.dividaMesAnterior || 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Período anterior
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                Crédito
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 300, color: '#333' }}>
                {formatCurrency(clienteFinanceiro?.saldoCredito || 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Saldo disponível
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
          
          {clienteFinanceiro?.historicoPedidos && clienteFinanceiro.historicoPedidos.length > 0 ? (
            <TableContainer sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: '1px solid #ddd' } }}>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Doc. Ref</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Valor</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clienteFinanceiro.historicoPedidos.map((pedido: Pedido) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#888' }}>
                Nenhum pedido encontrado para este cliente.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
