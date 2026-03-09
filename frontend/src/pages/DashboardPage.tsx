import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import {
  ArrowForward,
  AttachMoney,
  CreditScore,
  Groups,
  ReceiptLong,
  WarningAmber,
} from '@mui/icons-material'
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

const statCardSx = {
  height: '100%',
  borderRadius: 3,
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
}

interface StatCardProps {
  title: string
  value: string
  helper: string
  icon: ReactNode
}

function StatCard({ title, value, helper, icon }: StatCardProps) {
  return (
    <Card sx={statCardSx}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="caption" sx={{ color: '#667085', display: 'block', mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ color: '#101828', fontWeight: 500, mb: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#667085' }}>
              {helper}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: 'rgba(46, 125, 50, 0.10)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
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
    <Card sx={{ ...statCardSx, minHeight: 320 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: '#101828', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#667085', mb: 2.5 }}>
          {subtitle}
        </Typography>

        {items.length === 0 ? (
          <Box
            sx={{
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: '#98A2B3' }}>
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
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(46, 125, 50, 0.12)', color: 'primary.main', fontWeight: 600 }}
                  />
                  <Typography variant="body2" sx={{ color: '#101828', fontWeight: 500 }} noWrap>
                    {item.clienteNome}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: '#475467', fontWeight: 500, whiteSpace: 'nowrap' }}>
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
          <Typography variant="body2" sx={{ color: '#667085', maxWidth: 680 }}>
            Consolide faturamento, inadimplencia e relacionamentos comerciais em uma unica visao operacional.
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
                icon={<AttachMoney fontSize="small" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Clientes com divida"
                value={String(metricas.quantidadeClientesComDivida)}
                helper="Clientes com saldo financeiro pendente"
                icon={<Groups fontSize="small" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Divida total em aberto"
                value={formatCurrency(metricas.dividaTotalAberta)}
                helper="Saldo liquido considerando credito do cliente"
                icon={<WarningAmber fontSize="small" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title="Credito disponivel total"
                value={formatCurrency(metricas.creditoDisponivelTotal)}
                helper="Somatorio de creditos dos clientes com pendencia"
                icon={<CreditScore fontSize="small" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title="Maior devedor"
                value={metricas.maiorDevedor?.cliente.razaoSocial ?? '-'}
                helper={metricas.maiorDevedor ? formatCurrency(metricas.maiorDevedor.dividaTotal) : 'Nenhuma divida em aberto'}
                icon={<ReceiptLong fontSize="small" />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <Card sx={statCardSx}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: 2,
                      flexDirection: { xs: 'column', md: 'row' },
                      mb: 2.5,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ color: '#101828', mb: 0.5 }}>
                        Clientes com pendencia
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#667085' }}>
                        Ordenado por maior divida para acelerar cobranca e priorizacao.
                      </Typography>
                    </Box>
                    <Chip
                      label={`${clientesPendentes.length} cliente${clientesPendentes.length === 1 ? '' : 's'}`}
                      sx={{ bgcolor: 'rgba(46, 125, 50, 0.08)', color: 'primary.main', fontWeight: 600 }}
                    />
                  </Box>

                  {clientesPendentes.length === 0 ? (
                    <Box
                      sx={{
                        minHeight: 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        border: '1px dashed #D0D5DD',
                        borderRadius: 2,
                        bgcolor: '#FCFCFD',
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ color: '#344054', mb: 0.5 }}>
                          Nenhuma pendencia financeira encontrada.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#98A2B3' }}>
                          O periodo atual nao possui clientes com saldo em aberto.
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: '#F9FAFB' }}>Cliente</TableCell>
                            <TableCell sx={{ bgcolor: '#F9FAFB' }}>Pendentes</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#F9FAFB' }}>Credito</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#F9FAFB' }}>Divida</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#F9FAFB', width: 120 }}>Acao</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {clientesPendentes.map((item) => (
                            <TableRow key={item.clienteId} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ color: '#101828', fontWeight: 500 }}>
                                    {item.cliente.razaoSocial}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#667085' }}>
                                    {item.cliente.documento || item.cliente.contato || 'Sem identificacao complementar'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`${item.totalPedidosPendentes} pedido${item.totalPedidosPendentes === 1 ? '' : 's'}`}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right">{formatCurrency(item.saldoCredito)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: '#B42318' }}>
                                {formatCurrency(item.dividaTotal)}
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  endIcon={<ArrowForward fontSize="small" />}
                                  onClick={() => navigate(`/clientes/${item.clienteId}`)}
                                >
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
                  subtitle="Ranking por volume de compras no periodo selecionado."
                  items={topClientesFieis.slice(0, 5)}
                  metricType="compras"
                />
                <RankingCard
                  title="Clientes mais lucrativos"
                  subtitle="Ranking por receita acumulada no periodo selecionado."
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
