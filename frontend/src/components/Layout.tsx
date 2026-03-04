import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
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

const menuCategories = [
    {
        title: 'Principal',
        items: [
            { text: 'Início', icon: <Dashboard />, path: '/inicio', title: 'Início' },
            { text: 'Financeiro', icon: <AttachMoney />, path: '/financeiro', title: 'Financeiro' },
        ]
    },
    {
        title: 'Movimentações',
        items: [
            { text: 'Pedidos', icon: <ShoppingCart />, path: '/pedidos', title: 'Pedidos' },
            { text: 'Estoque', icon: <Widgets />, path: '/estoque', title: 'Estoque' },
        ]
    },
    {
        title: 'Cadastros',
        items: [
            { text: 'Produtos', icon: <Inventory />, path: '/produtos', title: 'Produtos' },
            { text: 'Clientes', icon: <People />, path: '/clientes', title: 'Clientes' },
            { text: 'Naturezas de Operação', icon: <SyncAlt />, path: '/naturezas-operacao', title: 'Naturezas de Operação' },
            { text: 'Unidades de Medida', icon: <Scale />, path: '/unidades-medida', title: 'Unidades de Medida' },
        ]
    }
]

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout, usuario } = useAuth()

    const [open, setOpen] = useState(false)
    const [accountOpen, setAccountOpen] = useState(false)
    const [pageTitle, setPageTitle] = useState('Hort Sistema')

    useEffect(() => {
        const allItems = menuCategories.flatMap(cat => cat.items).concat([{ text: 'Conta', icon: <Person />, path: '/conta', title: 'Minha Conta' }])
        
        const found = allItems.find(item => {
            if (item.path === '/inicio') {
                return location.pathname === '/' || location.pathname === '/inicio'
            }
            return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
        })

        if (found) {
            setPageTitle(found.title)
        } else {
            setPageTitle('Hort Sistema')
        }
    }, [location.pathname])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const formatarCnpj = (cnpj: string): string => {
        const apenasNumeros = cnpj.replace(/\D/g, '')
        if (apenasNumeros.length !== 14) {
            return apenasNumeros
        }
        return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
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

    // Routes that should show the page-level header acting as an extension of the AppBar
    const isExtendedHeaderRoute = location.pathname === '/pedidos/novo' || /^\/pedidos\/\d+/.test(location.pathname)

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
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 64,
                    bgcolor: (theme) => theme.palette.primary.main,
                    boxShadow: isExtendedHeaderRoute ? 'none' : 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: (theme) => theme.zIndex.appBar,
                    '& .MuiIconButton-root': { color: 'white' },
                    '& .MuiTypography-root': { color: 'white' }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer(true)}
                        sx={{ height: '100%', borderRadius: 0, px: 2 }}
                    >
                        <Menu />
                    </IconButton>

                    <Box
                        onClick={() => navigate('/inicio')}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 400, fontSize: '24px' }}>
                            {pageTitle}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    {usuario && (
                        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, mr: 3 }}>
                            {usuario.nomeFantasia} - {formatarCnpj(usuario.cnpj)}
                        </Typography>
                    )}
                    <IconButton color="inherit" sx={{ height: '100%', borderRadius: 0, px: 1.5 }}><Apps /></IconButton>
                    <IconButton color="inherit" sx={{ height: '100%', borderRadius: 0, px: 1.5 }}><HelpOutline /></IconButton>
                    <IconButton color="inherit" onClick={toggleAccountDrawer(true)} sx={{ height: '100%', borderRadius: 0, px: 1.5 }}>
                        <AccountCircle />
                    </IconButton>
                </Box>
            </Box>

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
                    justifyContent: 'center',
                    px: 3,
                    height: 84
                }}>
                    <img
                        src="../../public/assets/logo-hort-sistema.png"
                        alt="Hort Sistemas"
                        style={{ maxHeight: '84px', maxWidth: '100%' }}
                    />
                </Box>

                <Box sx={{ overflow: 'auto' }}>
                    <List disablePadding>
                        {menuCategories.map((category, index) => (
                            <Box key={category.title}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        px: 3,
                                        pt: 2,
                                        pb: 1,
                                        display: 'block',
                                        color: '#9e9e9e',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}
                                >
                                    {category.title}
                                </Typography>
                                {category.items.map((item) => (
                                    <ListItem key={item.text} disablePadding>
                                        <ListItemButton
                                            selected={isSelected(item.path)}
                                            onClick={() => handleNavigate(item.path)}
                                            sx={{
                                                py: 1,
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
                                                primaryTypographyProps={{ fontWeight: isSelected(item.path) ? 600 : 400, fontSize: '0.95rem' }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {index < menuCategories.length - 1 && <Divider sx={{ mt: 1, mb: 1, mx: 2 }} />}
                            </Box>
                        ))}
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
                    px: { xs: 6, sm: 14, md: 24 },
                    width: '100%',
                    bgcolor: '#f5f5f5',
                    minHeight: '100vh'
                }}
            >
                <Box sx={{ height: 64 }} />
                <Box sx={{ maxWidth: 1800, mx: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    )
}
