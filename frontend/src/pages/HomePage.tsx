import { useNavigate } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Grid, Link, Divider } from '@mui/material'
import {
  Add, Payment, Inventory, PersonAdd, ShoppingCart
} from '@mui/icons-material'

export default function HomePage() {
  const navigate = useNavigate()

  const acessoRapidoItems = [
    { label: 'Pedidos de Venda', icon: '➔', path: '/pedidos' },
    { label: 'Produtos', icon: '➔', path: '/produtos' },
    { label: 'Clientes', icon: '➔', path: '/clientes' },
    { label: 'Resumo Financeiro', icon: '➔', path: '/dashboard' },
    { label: 'Estoque', icon: '➔', path: '/estoque' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Bem-vindo ao Hort Sistema
      </Typography>

      <Grid container spacing={3}>
        {/* Card: Acesso Rápido */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Acesso Rápido
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {acessoRapidoItems.map((item) => (
                  <Link
                    key={item.label}
                    component="button"
                    onClick={() => navigate(item.path)}
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.secondary',
                      py: 0.75,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'primary.main',
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    {item.icon}
                    <Typography variant="body2">{item.label}</Typography>
                  </Link>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Cadastro Rápido */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Cadastro Rápido
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  component="button"
                  onClick={() => navigate('/produtos?new=true')}
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    bgcolor: 'grey.100',
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    }
                  }}
                >
                  <Inventory fontSize="small" />
                  <Typography variant="body2">Adicionar Produto</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto' }}>›</Typography>
                </Link>
                
                <Link
                  component="button"
                  onClick={() => navigate('/clientes?new=true')}
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    bgcolor: 'grey.100',
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    }
                  }}
                >
                  <PersonAdd fontSize="small" />
                  <Typography variant="body2">Adicionar Cliente</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto' }}>›</Typography>
                </Link>
                
                <Link
                  component="button"
                  onClick={() => navigate('/configuracoes/formas-pagamento?new=true')}
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    bgcolor: 'grey.100',
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    }
                  }}
                >
                  <Payment fontSize="small" />
                  <Typography variant="body2">Adicionar Forma de Pagamento</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto' }}>›</Typography>
                </Link>
                
                <Link
                  component="button"
                  onClick={() => navigate('/pedidos?new=true')}
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary',
                    bgcolor: 'grey.100',
                    py: 2,
                    px: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    }
                  }}
                >
                  <ShoppingCart fontSize="small" />
                  <Typography variant="body2">Novo Pedido</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto' }}>›</Typography>
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card: Dicas */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                💡 Dicas do Sistema
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Use o menu lateral para navegar entre as funcionalidades.<br/>
                • O sistema utiliza FIFO para cálculo de custo dos produtos.<br/>
                • Configure as naturezas de operação antes de criar pedidos.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
