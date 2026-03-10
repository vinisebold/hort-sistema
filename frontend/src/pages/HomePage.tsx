import { useNavigate } from 'react-router-dom'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid2 as Grid,
    Link,
    Button
} from '@mui/material'
import {
    Inventory,
    PersonAdd,
    ShoppingCart,
    AddShoppingCart,
    Widgets,
    ArrowForward,
    AccountBalanceWallet,
    Category,
    Scale
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
        { label: 'Adicionar Produto', icon: <Inventory />, path: '/produtos/novo' },
        { label: 'Adicionar Cliente', icon: <PersonAdd />, path: '/clientes/novo' },
        { label: 'Adicionar Unidade', icon: <Scale />, path: '/unidades-medida/novo' },
        { label: 'Adicionar Natureza', icon: <Category />, path: '/naturezas-operacao/novo' },
    ]

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
                    Página Inicial
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                    Acesse rapidamente as principais funcionalidades do sistema e crie novos cadastros
                </Typography>
            </Box>

            <Grid container spacing={3}>

                {/* COLUNA ESQUERDA - Acesso Rápido e Ajuda */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Acesso Rápido */}
                    <Card elevation={0} sx={{ 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
                        borderRadius: 2,
                        mb: 3 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontSize: '1.125rem', fontWeight: 500, color: '#333' }}>
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
                                            color: '#039be5',
                                            fontSize: '15px',
                                            height: '28px',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        <ArrowForward fontSize="inherit" sx={{ fontSize: 24, flexShrink: 0 }} />
                                        {item.label}
                                    </Link>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* COLUNA DIREITA - Dashboards e Cadastros */}
                <Grid size={{ xs: 12, md: 8 }}>

                    {/* Cadastros Rápidos Grid */}
                    <Card elevation={0} sx={{ 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
                        borderRadius: 2 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontSize: '1.125rem', fontWeight: 500, color: '#333' }}>
                                Cadastros rápidos
                            </Typography>
                            <Grid container spacing={2}>
                                {cadastrosRapidos.map((item) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => navigate(item.path, { state: { fromHome: true } })}
                                            startIcon={<Box component="span" sx={{ color: '#039be5', display: 'flex', alignItems: 'center' }}>{item.icon}</Box>}
                                            endIcon={<ArrowForward fontSize="small" sx={{ color: '#bdbdbd' }} />}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: 2,
                                                px: 3,
                                                color: '#424242',
                                                borderColor: '#e0e0e0',
                                                bgcolor: '#eeeeee',
                                                border: 'none',
                                                fontSize: '15px',
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
                        </CardContent>
                    </Card>

                </Grid>
            </Grid>
        </Box>
    )
}
