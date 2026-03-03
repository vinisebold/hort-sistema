import { useNavigate } from 'react-router-dom'
import {
    Box,
    Card,
    Typography,
    Grid2 as Grid,
    Link,
    Paper,
    Button
} from '@mui/material'
import {
    Inventory,
    PersonAdd,
    ShoppingCart,
    AddShoppingCart,
    Widgets,
    ArrowForward,
    AccountBalanceWallet
} from '@mui/icons-material'

export default function HomePage() {
    const navigate = useNavigate()

    const acessoRapidoItems = [
        { label: 'Novo Pedido', icon: <AddShoppingCart fontSize="small" />, path: '/pedidos/novo' },
        { label: 'Lista de Pedidos', icon: <ShoppingCart fontSize="small" />, path: '/pedidos' },
        { label: 'Controle de Estoque', icon: <Widgets fontSize="small" />, path: '/estoque' },
        { label: 'Financeiro', icon: <AccountBalanceWallet fontSize="small" />, path: '/financeiro' },
        { label: 'Produtos', icon: <Inventory fontSize="small" />, path: '/produtos' },
        { label: 'Clientes', icon: <PersonAdd fontSize="small" />, path: '/clientes' },
    ]

    const cadastrosRapidos = [
        { label: 'Adicionar produto', icon: <Inventory />, path: '/produtos?new=true' },
        { label: 'Adicionar cliente', icon: <PersonAdd />, path: '/clientes?new=true' },
    ]

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>


            <Grid container spacing={3}>

                {/* COLUNA ESQUERDA - Acesso Rápido e Ajuda */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ height: '100%', bgcolor: 'transparent' }}>
                        {/* Acesso Rápido */}
                        <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                Acesso rápido
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {acessoRapidoItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        component="button"
                                        onClick={() => navigate(item.path)}
                                        underline="none"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            color: '#039be5', // Azul similar ao da imagem
                                            fontSize: '0.95rem',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        <ArrowForward fontSize="inherit" sx={{ fontSize: 16 }} />
                                        {item.label}
                                    </Link>
                                ))}
                            </Box>
                        </Paper>
                    </Card>
                </Grid>

                {/* COLUNA DIREITA - Dashboards e Cadastros */}
                <Grid size={{ xs: 12, md: 8 }}>

                    {/* Cadastros Rápidos Grid */}
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                            Cadastros rápidos
                        </Typography>
                        <Grid container spacing={2}>
                            {cadastrosRapidos.map((item) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => navigate(item.path)}
                                        startIcon={<Box component="span" sx={{ color: '#039be5' }}>{item.icon}</Box>} // Ícone azul
                                        endIcon={<ArrowForward fontSize="small" sx={{ color: '#bdbdbd' }} />}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            py: 2,
                                            px: 3,
                                            color: '#424242',
                                            borderColor: '#e0e0e0',
                                            bgcolor: '#eeeeee', // Fundo cinza claro
                                            border: 'none', // Remove borda padrão para parecer com card flat
                                            '&:hover': {
                                                bgcolor: '#e0e0e0',
                                                border: 'none'
                                            },
                                            '& .MuiButton-endIcon': {
                                                marginLeft: 'auto'
                                            },
                                            textTransform: 'none',
                                            fontWeight: 400
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                </Grid>
            </Grid>
        </Box>
    )
}