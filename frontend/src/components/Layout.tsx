import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Collapse,
    CssBaseline,
    Divider,
} from '@mui/material'
import {
    Dashboard,
    Inventory,
    People,
    ShoppingCart,
    Widgets,
    Logout,
    Settings,
    ExpandLess,
    ExpandMore,
    Payment,
    SyncAlt,
    Scale,
    Menu,
    AccountCircle,
    HelpOutline,
    Apps,
    AttachMoney,
    Person
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const drawerWidth = 280

const menuItems = [
    { text: 'Início', icon: <Dashboard />, path: '/inicio', title: 'Início' },
    { text: 'Resumo Financeiro', icon: <AttachMoney />, path: '/dashboard', title: 'Resumo Financeiro' },
    { text: 'Produtos', icon: <Inventory />, path: '/produtos', title: 'Produtos' },
    { text: 'Clientes', icon: <People />, path: '/clientes', title: 'Clientes' },
    { text: 'Pedidos', icon: <ShoppingCart />, path: '/pedidos', title: 'Pedidos' },
    { text: 'Estoque', icon: <Widgets />, path: '/estoque', title: 'Estoque' },
]

const configItems = [
    { text: 'Formas de Pagamento', icon: <Payment />, path: '/configuracoes/formas-pagamento', title: 'Formas de Pagamento' },
    { text: 'Naturezas de Operação', icon: <SyncAlt />, path: '/configuracoes/naturezas-operacao', title: 'Naturezas de Operação' },
    { text: 'Unidades de Medida', icon: <Scale />, path: '/configuracoes/unidades-medida', title: 'Unidades de Medida' },
]

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout, nomeNegocio } = useAuth()

    const [open, setOpen] = useState(false)
    const [accountOpen, setAccountOpen] = useState(false)
    const [configOpen, setConfigOpen] = useState(false)
    const [pageTitle, setPageTitle] = useState('Hort Sistema')

    useEffect(() => {
        const allItems = [...menuItems, ...configItems, { text: 'Conta', path: '/conta', title: 'Minha Conta' }]
        
        const found = allItems.find(item => {
            if (item.path === '/inicio') {
                return location.pathname === '/' || location.pathname === '/inicio'
            }
            return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
        })

        if (found) {
            setPageTitle(found.title)
        } else if (location.pathname.startsWith('/configuracoes')) {
            setPageTitle('Configurações')
        } else {
            setPageTitle('Hort Sistema')
        }
    }, [location.pathname])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen)
    }

    const toggleAccountDrawer = (newOpen: boolean) => () => {
        setAccountOpen(newOpen)
    }

    const handleNavigate = (path: string) => {
        navigate(path)
        setOpen(false)
        setAccountOpen(false)
    }

    const isConfigActive = location.pathname.startsWith('/configuracoes')

    const isSelected = (path: string) => {
        if (path === '/inicio') {
            return location.pathname === '/' || location.pathname === '/inicio'
        }
        return location.pathname === path
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <CssBaseline />

            {/* APP BAR (Cabeçalho) */}
            <AppBar
                position="fixed"
                sx={{
                    bgcolor: '#2e7d32',
                    boxShadow: 2
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', p: 0, minHeight: '64px !important' }}>
                    {/* Lado Esquerdo: Menu Hamburguer e Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', height: 64, m: 0 }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={toggleDrawer(true)}
                            edge="start"
                            sx={{ height: '100%', borderRadius: 0, px: 2, m: 0 }}
                        >
                            <Menu />
                        </IconButton>

                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500, ml: 1 }}>
                            {pageTitle}
                        </Typography>
                    </Box>

                    {/* Lado Direito: Ações e Conta */}
                    <Box sx={{ display: 'flex', alignItems: 'center', height: 64, m: 0 }}>
                        {nomeNegocio && (
                            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, mx: 1 }}>
                                {nomeNegocio}
                            </Typography>
                        )}
                        <IconButton color="inherit" size="small" sx={{ height: '100%', borderRadius: 0, px: 2, m: 0 }}><Apps /></IconButton>
                        <IconButton color="inherit" size="small" sx={{ height: '100%', borderRadius: 0, px: 2, m: 0 }}><HelpOutline /></IconButton>

                        {/* Ícone de Conta */}
                        <IconButton color="inherit" onClick={toggleAccountDrawer(true)} sx={{ height: '100%', borderRadius: 0, px: 2, m: 0 }}>
                            <AccountCircle />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* DRAWER ESQUERDO (Navegação Principal) */}
            <Drawer
                anchor="left"
                open={open}
                onClose={toggleDrawer(false)}
                variant="temporary"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#fff',
                    },
                }}
            >
                {/* Header do Drawer com LOGO */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', // Centralizado para a logo ficar melhor
                    px: 3,
                    height: 84
                }}>
                    <img
                        src="../../public/assets/logo-hort-sistema.png"
                        alt="Hort Sistemas"
                        style={{ maxHeight: '84px', maxWidth: '100%' }}
                    />
                </Box>

                <Box sx={{ overflow: 'auto'}}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={isSelected(item.path)}
                                    onClick={() => handleNavigate(item.path)}
                                    sx={{
                                        py: 1.5,
                                        px: 3,
                                        borderLeft: isSelected(item.path) ? '4px solid #2e7d32' : '4px solid transparent',
                                        '&.Mui-selected': {
                                            bgcolor: 'rgba(46, 125, 50, 0.08)',
                                            color: '#2e7d32',
                                            '& .MuiListItemIcon-root': { color: '#2e7d32' },
                                            '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.12)' },
                                        },
                                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: '#757575' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{ fontWeight: isSelected(item.path) ? 600 : 400 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}

                        <Divider sx={{ my: 1 }} />

                        <ListItem disablePadding>
                            <ListItemButton
                                selected={isConfigActive}
                                onClick={() => setConfigOpen(!configOpen)}
                                sx={{ py: 1.5, px: 3, borderLeft: '4px solid transparent' }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: '#757575' }}>
                                    <Settings />
                                </ListItemIcon>
                                <ListItemText primary="Configurações" />
                                {configOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                        </ListItem>

                        <Collapse in={configOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {configItems.map((item) => (
                                    <ListItemButton
                                        key={item.text}
                                        sx={{ pl: 9, py: 1 }}
                                        selected={location.pathname === item.path}
                                        onClick={() => handleNavigate(item.path)}
                                    >
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{ fontSize: '0.9rem' }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    </List>
                </Box>
            </Drawer>

            {/* DRAWER DIREITO (Conta e Ações) */}
            <Drawer
                anchor="right"
                open={accountOpen}
                onClose={toggleAccountDrawer(false)}
                variant="temporary"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#fff',
                    },
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    px: 3,
                    height: 64
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        Conta
                    </Typography>
                </Box>

                <Divider />

                <List sx={{ py: 2 }}>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleNavigate('/conta')}
                            selected={location.pathname === '/conta'}
                            sx={{
                                py: 1.5,
                                px: 3,
                                borderLeft: location.pathname === '/conta' ? '4px solid #2e7d32' : '4px solid transparent',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(46, 125, 50, 0.08)',
                                    color: '#2e7d32',
                                    '& .MuiListItemIcon-root': { color: '#2e7d32' },
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: '#757575' }}>
                                <Person />
                            </ListItemIcon>
                            <ListItemText primary="Meus Dados" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{ py: 1.5, px: 3, borderLeft: '4px solid transparent' }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: '#757575' }}>
                                <Logout />
                            </ListItemIcon>
                            <ListItemText primary="Sair" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>

            {/* CONTEÚDO PRINCIPAL */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    px: { xs: 2, sm: 4, md: 6 },
                    width: '100%',
                    bgcolor: '#f5f5f5',
                    minHeight: '100vh'
                }}
            >
                <Toolbar />
                <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    )
}