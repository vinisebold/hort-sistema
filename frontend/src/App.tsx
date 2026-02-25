import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, ThemeProvider, createTheme } from '@mui/material'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import ProdutosPage from './pages/ProdutosPage'
import ClientesPage from './pages/ClientesPage'
import PedidosPage from './pages/PedidosPage'
import EstoquePage from './pages/EstoquePage'
import FormasPagamentoPage from './pages/FormasPagamentoPage'
import NaturezasOperacaoPage from './pages/NaturezasOperacaoPage'
import UnidadesMedidaPage from './pages/UnidadesMedidaPage'
import ContaPage from './pages/ContaPage'
import { AuthProvider } from './contexts/AuthContext'

const theme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
  },
})

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
          <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rotas protegidas com Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="inicio" element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="produtos" element={<ProdutosPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="configuracoes">
              <Route path="formas-pagamento" element={<FormasPagamentoPage />} />
              <Route path="naturezas-operacao" element={<NaturezasOperacaoPage />} />
              <Route path="unidades-medida" element={<UnidadesMedidaPage />} />
            </Route>
            <Route path="conta" element={<ContaPage />} />
          </Route>
          
          {/* Rota fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Box>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
