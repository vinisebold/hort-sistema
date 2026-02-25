import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material'
import { dashboardApi } from '../services/api'

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState('HOJE')
  const [resumo, setResumo] = useState<any>(null)

  useEffect(() => {
    loadDashboard()
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={periodo}
            label="Período"
            onChange={(e) => setPeriodo(e.target.value)}
          >
            {periodos.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Card: Produto Mais Vendido */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Produto Mais Vendido
              </Typography>
              <Typography variant="h5" component="div">
                {resumo?.produtoMaisVendidoNome || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resumo?.produtoMaisVendidoQtd || 0} unidades vendidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Cliente Mais Fiel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Cliente Mais Fiel
              </Typography>
              <Typography variant="h5" component="div">
                {resumo?.clienteMaisFielNome || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resumo?.clienteMaisFielCompras || 0} compras
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Total Vendido */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Vendido no Período
              </Typography>
              <Typography variant="h5" component="div">
                R$ {resumo?.totalVendidoPeriodo?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
