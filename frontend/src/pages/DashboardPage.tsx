import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, FormControl, Select, MenuItem, Grid } from '@mui/material'
import { dashboardApi } from '../services/api'

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState('HOJE')
  const [resumo, setResumo] = useState<any>(null)

  useEffect(() => {
    loadDashboard().catch(console.error)
  }, [periodo])

  const loadDashboard = async () => {
    try {
      const response = await dashboardApi.resumo(periodo)
      setResumo(response.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    }
  }

  const periodos = [
    { value: 'HOJE', label: 'Hoje' },
    { value: 'ULTIMOS_7_DIAS', label: 'Últimos 7 dias' },
    { value: 'ULTIMO_MES', label: 'Este mês' },
    { value: 'MES_ANTERIOR', label: 'Mês anterior' },
    { value: 'ESTE_ANO', label: 'Este ano' },
    { value: 'ANO_ANTERIOR', label: 'Ano anterior' },
  ]

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
            Dashboard Financeiro
          </Typography>
          <Typography variant="body2" sx={{ color: '#888' }}>
            Acompanhe métricas e indicadores de desempenho
          </Typography>
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
            Período
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              {periodos.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Card: Produto Mais Vendido */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1.5 }}>
                Produto Mais Vendido
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
                {resumo?.produtoMaisVendidoNome || '-'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                {resumo?.produtoMaisVendidoQtd || 0} unidades vendidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Cliente Mais Fiel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1.5 }}>
                Cliente Mais Fiel
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
                {resumo?.clienteMaisFielNome || '-'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                {resumo?.clienteMaisFielCompras || 0} compras
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Total Vendido */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1.5 }}>
                Total Vendido no Período
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo?.totalVendidoPeriodo || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
