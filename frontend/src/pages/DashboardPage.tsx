import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { clientesApi, dashboardApi } from '../services/api'
import {
  Cliente,
  ClienteFinanceiroResponse,
  ClientePendenciaFinanceira,
  DashboardPeriodo,
  DashboardResumoResponse,
  DashboardTopClienteResponse,
} from '../types'

const periodos: Array<{ value: DashboardPeriodo; label: string }> = [
  { value: 'HOJE', label: 'Hoje' },
  { value: 'ULTIMOS_7_DIAS', label: 'Ultimos 7 dias' },
  { value: 'ULTIMO_MES', label: 'Este mes' },
  { value: 'MES_ANTERIOR', label: 'Mes anterior' },
  { value: 'ESTE_ANO', label: 'Este ano' },
  { value: 'ANO_ANTERIOR', label: 'Ano anterior' },
]

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const parseClientesPayload = (payload: unknown): Cliente[] => {
  if (Array.isArray(payload)) return payload as Cliente[]
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data
    return Array.isArray(data) ? (data as Cliente[]) : []
  }
  return []
}

const normalizeClienteFinanceiro = (payload: ClienteFinanceiroResponse): ClienteFinanceiroResponse => {
  return {
    ...payload,
    cliente: payload.cliente ?? payload.clienteResponse,
    clienteResponse: payload.clienteResponse ?? payload.cliente,
  }
}

// Mesmo padrao visual das demais telas (Pedidos, Estoque, Clientes).
const cardSx = {
  height: '100%',
  borderRadius: 2,
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
}

const headCellSx = {
  fontWeight: 500,
  fontSize: '0.875rem',
  color: '#555',
  bgcolor: '#fafafa',
  borderBottom: '2px solid #ddd',
}

interface StatCardProps {
  title: string
  value: string
  helper: string
}

function StatCard({ title, value, helper }: StatCardProps) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ color: '#333', fontWeight: 400, mb: 0.75 }} noWrap>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#777' }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  )
}

interface RankingCardProps {
  title: string
  subtitle: string
  items: DashboardTopClienteResponse[]
  metricType: 'compras' | 'valor'
}

function RankingCard({ title, subtitle, items, metricType }: RankingCardProps) {
  return (
    <Card sx={{ ...cardSx, minHeight: 320 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500, color: '#333', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#777', mb: 2 }}>
          {subtitle}
        </Typography>

        {items.length === 0 ? (
          <Box sx={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ color: '#999' }}>
              Nenhum cliente encontrado para o periodo selecionado.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {items.map((item, index) => (
              <Stack
                key={`${title}-${item.clienteId}`}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                sx={{ py: 1.5 }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#999', width: 20 }}>
                    {index + 1}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }} noWrap>
                    {item.clienteNome}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: '#555', whiteSpace: 'nowrap' }}>
                  {metricType === 'compras'
                    ? `${item.quantidadeCompras ?? 0} compra${item.quantidadeCompras === 1 ? '' : 's'}`
                    : formatCurrency(item.valorTotal ?? 0)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState<DashboardPeriodo>('HOJE')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumo, setResumo] = useState<DashboardResumoResponse | null>(null)
  const [topClientesFieis, setTopClientesFieis] = useState<DashboardTopClienteResponse[]>([])
  const [topClientesLucrativos, setTopClientesLucrativos] = useState<DashboardTopClienteResponse[]>([])
  const [clientesFinanceiro, setClientesFinanceiro] = useState<ClienteFinanceiroResponse[]>([])
  const [clientesPendentes, setClientesPendentes] = useState<ClientePendenciaFinanceira[]>([])

  useEffect(() => {
    void loadDashboard(periodo)
  }, [periodo])

  const loadDashboard = async (periodoSelecionado: DashboardPeriodo) => {
    try {
      setLoading(true)
      setError(null)

      const [resumoResponse, fieisResponse, lucrativosResponse, clientesResponse] = await Promise.all([
        dashboardApi.resumo(periodoSelecionado),
        dashboardApi.topClientesFieis(periodoSelecionado),
        dashboardApi.topClientesLucrativos(periodoSelecionado),
        clientesApi.listarTodos(),
      ])

      const clientes = parseClientesPayload(clientesResponse.data)

      const financeiros = await Promise.allSettled(
        clientes.map(async (cliente) => {
          const response = await clientesApi.getResumoFinanceiro(cliente.id)
          return normalizeClienteFinanceiro(response.data as ClienteFinanceiroResponse)
        })
      )

      const clientesFinanceirosNormalizados = financeiros
        .filter((result): result is PromiseFulfilledResult<ClienteFinanceiroResponse> => result.status === 'fulfilled')
        .map((result) => result.value)

      const pendencias = clientesFinanceirosNormalizados
        .filter((financeiro) => (financeiro.dividaTotal ?? 0) > 0 && financeiro.cliente)
        .map((financeiro) => ({
          clienteId: financeiro.cliente!.id,
          cliente: financeiro.cliente!,
          dividaTotal: financeiro.dividaTotal ?? 0,
          saldoCredito: financeiro.saldoCredito ?? 0,
          totalPedidosPendentes: financeiro.totalPedidosPendentes ?? 0,
          totalPedidosPagos: financeiro.totalPedidosPagos ?? 0,
        }))
        .sort((a, b) => b.dividaTotal - a.dividaTotal)

      setResumo(resumoResponse.data as DashboardResumoResponse)
      setTopClientesFieis((fieisResponse.data as DashboardTopClienteResponse[]) ?? [])
      setTopClientesLucrativos((lucrativosResponse.data as DashboardTopClienteResponse[]) ?? [])
      setClientesFinanceiro(clientesFinanceirosNormalizados)
      setClientesPendentes(pendencias)
    } catch (err) {
      console.error('Erro ao carregar dashboard financeiro:', err)
      setError('Nao foi possivel carregar a central financeira.')
      setResumo(null)
      setTopClientesFieis([])
      setTopClientesLucrativos([])
      setClientesFinanceiro([])
      setClientesPendentes([])
    } finally {
      setLoading(false)
    }
  }

  const metricas = useMemo(() => {
    const quantidadeClientesComDivida = clientesPendentes.length
    const dividaTotalAberta = clientesPendentes.reduce((total, item) => total + item.dividaTotal, 0)
    const creditoDisponivelTotal = clientesFinanceiro.reduce((total, item) => total + (item.saldoCredito ?? 0), 0)
    const maiorDevedor = clientesPendentes[0] ?? null

    return {
      quantidadeClientesComDivida,
      dividaTotalAberta,
      creditoDisponivelTotal,
      maiorDevedor,
    }
  }, [clientesFinanceiro, clientesPendentes])

  const handlePeriodoChange = (event: SelectChangeEvent) => {
    setPeriodo(event.target.value as DashboardPeriodo)
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'flex-start' },
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
            Central Financeira
          </Typography>
          <Typography variant="body2" sx={{ color: '#777', maxWidth: 680 }}>
            Faturamento, inadimplencia e relacionamento com clientes.
          </Typography>
        </Box>

        <Box sx={{ minWidth: { xs: '100%', md: 220 } }}>
          <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
            Periodo
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={periodo} onChange={handlePeriodoChange}>
              {periodos.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total vendido no periodo"
                value={formatCurrency(resumo?.totalVendidoPeriodo ?? 0)}
                helper={`Produto lider: ${resumo?.produtoMaisVendidoNome ?? 'Sem vendas no periodo'}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Clientes com divida"
                value={String(metricas.quantidadeClientesComDivida)}
                helper="Clientes com saldo financeiro pendente"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Divida total em aberto"
                value={formatCurrency(metricas.dividaTotalAberta)}
                helper="Saldo liquido considerando credito do cliente"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title="Credito disponivel total"
                value={formatCurrency(metricas.creditoDisponivelTotal)}
                helper="Somatorio de creditos dos clientes"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title="Maior devedor"
                value={metricas.maiorDevedor?.cliente.razaoSocial ?? '-'}
                helper={metricas.maiorDevedor ? formatCurrency(metricas.maiorDevedor.dividaTotal) : 'Nenhuma divida em aberto'}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <Card sx={cardSx}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ p: 3, pb: 2 }}>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500, color: '#333', mb: 0.5 }}>
                      Clientes com pendencia
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#777' }}>
                      Ordenado por maior divida.
                      {clientesPendentes.length > 0
                        ? ` ${clientesPendentes.length} cliente${clientesPendentes.length === 1 ? '' : 's'} em aberto.`
                        : ''}
                    </Typography>
                  </Box>

                  {clientesPendentes.length === 0 ? (
                    <Box sx={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        Nenhuma pendencia financeira encontrada.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={headCellSx}>Cliente</TableCell>
                            <TableCell sx={headCellSx}>Pendentes</TableCell>
                            <TableCell align="right" sx={headCellSx}>Credito</TableCell>
                            <TableCell align="right" sx={headCellSx}>Divida</TableCell>
                            <TableCell align="right" sx={{ ...headCellSx, width: 100 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {clientesPendentes.map((item) => (
                            <TableRow key={item.clienteId} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                                  {item.cliente.razaoSocial}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#777' }}>
                                  {item.cliente.documento || item.cliente.contato || 'Sem identificacao complementar'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.875rem', color: '#555' }}>
                                {item.totalPedidosPendentes} pedido{item.totalPedidosPendentes === 1 ? '' : 's'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#555' }}>
                                {formatCurrency(item.saldoCredito)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.95rem', fontWeight: 500, color: '#c62828' }}>
                                {formatCurrency(item.dividaTotal)}
                              </TableCell>
                              <TableCell align="right">
                                <Button size="small" onClick={() => navigate(`/clientes/${item.clienteId}`)}>
                                  Abrir
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Stack spacing={3}>
                <RankingCard
                  title="Clientes mais fieis"
                  subtitle="Volume de compras no periodo."
                  items={topClientesFieis.slice(0, 5)}
                  metricType="compras"
                />
                <RankingCard
                  title="Clientes mais lucrativos"
                  subtitle="Receita acumulada no periodo."
                  items={topClientesLucrativos.slice(0, 5)}
                  metricType="valor"
                />
              </Stack>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}
