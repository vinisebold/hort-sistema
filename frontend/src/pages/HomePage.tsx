import { useNavigate } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Grid, Link, Divider } from '@mui/material'
import {
  ShoppingCart, Inventory, People, TrendingUp, Warehouse,
  Add, Payment
} from '@mui/icons-material'

export default function HomePage() {
  const navigate = useNavigate()

  const acessoRapidoItems = [
    { label: 'Pedidos de Venda', icon: <ShoppingCart fontSize="small" />, path: '/pedidos' },
    { label: 'Produtos', icon: <Inventory fontSize="small" />, path: '/produtos' },
    { label: 'Clientes', icon: <People fontSize="small" />, path: '/clientes' },
    { label: 'Resumo Financeiro', icon: <TrendingUp fontSize="small" />, path: '/dashboard' },
    { label: 'Estoque', icon: <Warehouse fontSize="small" />, path: '/estoque' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Bem-vindo ao Hort Sistema 🌱
      </Typography>

      <Grid container spacing={3}>
        {/* Card: Acesso Rápido */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Acesso Rápido
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {acessoRapidoItems.map((item) => (
                  <Link
                    key={item.label}
                    component="button"
                    onClick={() => navigate(item.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      color: 'text.primary',
                      textDecoration: 'none',
                      py: 1,
                      px: 1,
                      borderRadius: 1,
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        color: 'primary.main',
                      }
                    }}
                  >
                    {item.icon}
                    <Typography>{item.label}</Typography>
                  </Link>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Cadastro Rápido */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Cadastro Rápido
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Link
                  component="button"
                  onClick={() => navigate('/produtos?new=true')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    textDecoration: 'none',
                    py: 1,
                    px: 1,
                    borderRadius: 1,
                    transition: 'all 0.15s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                    }
                  }}
                >
                  <Add fontSize="small" />
                  <Typography>Adicionar Produto</Typography>
                </Link>
                
                <Link
                  component="button"
                  onClick={() => navigate('/clientes?new=true')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    textDecoration: 'none',
                    py: 1,
                    px: 1,
                    borderRadius: 1,
                    transition: 'all 0.15s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                    }
                  }}
                >
                  <Add fontSize="small" />
                  <Typography>Adicionar Cliente</Typography>
                </Link>
                
                <Link
                  component="button"
                  onClick={() => navigate('/configuracoes/formas-pagamento?new=true')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    textDecoration: 'none',
                    py: 1,
                    px: 1,
                    borderRadius: 1,
                    transition: 'all 0.15s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                    }
                  }}
                >
                  <Payment fontSize="small" />
                  <Typography>Adicionar Forma de Pagamento</Typography>
                </Link>
                
                <Link
                  component="button"
                  onClick={() => navigate('/pedidos?new=true')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    textDecoration: 'none',
                    py: 1,
                    px: 1,
                    borderRadius: 1,
                    transition: 'all 0.15s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                    }
                  }}
                >
                  <ShoppingCart fontSize="small" />
                  <Typography>Novo Pedido</Typography>
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Dicas */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                💡 Dicas do Sistema
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Use o menu lateral para navegar entre as funcionalidades do sistema.<br/>
                • O sistema utiliza FIFO (Primeiro a Entrar, Primeiro a Sair) para cálculo de custo dos produtos.<br/>
                • Configure as naturezas de operação antes de criar pedidos.<br/>
                • O estoque é atualizado automaticamente ao criar pedidos de compra ou venda.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
