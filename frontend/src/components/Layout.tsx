import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Collapse, useMediaQuery, useTheme } from '@mui/material'
import { Home, Dashboard, Inventory, People, ShoppingCart, Warehouse, Logout, Settings, ExpandLess, ExpandMore, Payment, SyncAlt, Scale, Menu, ChevronLeft, AccountCircle } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const drawerWidth = 240
const drawerWidthClosed = 65

const menuItems = [
  { text: 'Início', icon: <Home />, path: '/inicio' },
  { text: 'Resumo Financeiro', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Produtos', icon: <Inventory />, path: '/produtos' },
  { text: 'Clientes', icon: <People />, path: '/clientes' },
  { text: 'Pedidos', icon: <ShoppingCart />, path: '/pedidos' },
  { text: 'Estoque', icon: <Warehouse />, path: '/estoque' },
]

const configItems = [
  { text: 'Formas de Pagamento', icon: <Payment />, path: '/configuracoes/formas-pagamento' },
  { text: 'Naturezas de Operação', icon: <SyncAlt />, path: '/configuracoes/naturezas-operacao' },
  { text: 'Unidades de Medida', icon: <Scale />, path: '/configuracoes/unidades-medida' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, nomeNegocio } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [open, setOpen] = useState(!isMobile)
  const [configOpen, setConfigOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleToggle = () => {
    setOpen(!open)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    if (isMobile) {
      setOpen(false)
    }
  }

  const isConfigActive = location.pathname.startsWith('/configuracoes')

  const isSelected = (path: string) => {
    if (path === '/inicio') {
      return location.pathname === '/' || location.pathname === '/inicio'
    }
    return location.pathname === path
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeft /> : <Menu />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Hort Sistema
          </Typography>
          {nomeNegocio && (
            <Typography variant="body1" sx={{ mr: 2 }}>
              {nomeNegocio}
            </Typography>
          )}
          <IconButton color="inherit" onClick={() => navigate('/conta')}>
            <AccountCircle />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : drawerWidthClosed,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : drawerWidthClosed,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  selected={isSelected(item.path)}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': { color: 'white' },
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ opacity: open ? 1 : 0 }}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* Configurações - Collapsible */}
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                selected={isConfigActive}
                onClick={() => setConfigOpen(!configOpen)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <Settings />
                </ListItemIcon>
                <ListItemText 
                  primary="Configurações" 
                  sx={{ opacity: open ? 1 : 0 }}
                  primaryTypographyProps={{ noWrap: true }}
                />
                {open && (configOpen ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={configOpen && open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {configItems.map((item) => (
                  <ListItemButton
                    key={item.text}
                    sx={{ 
                      pl: 4,
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                    }}
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigate(item.path)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ fontSize: '0.875rem', noWrap: true }}
                      sx={{ opacity: open ? 1 : 0 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </List>
        </Box>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          marginLeft: 0,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
