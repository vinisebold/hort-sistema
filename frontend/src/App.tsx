import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import ProdutosPage from './pages/ProdutosPage'
import NovoProdutoPage from './pages/NovoProdutoPage'
import ClientesPage from './pages/ClientesPage'
import NovoClientePage from './pages/NovoClientePage'
import ClienteDetalhePage from './pages/ClienteDetalhePage'
import PedidosPage from './pages/PedidosPage'
import NovoPedidoPage from './pages/NovoPedidoPage'
import EstoquePage from './pages/EstoquePage'
import NaturezasOperacaoPage from './pages/NaturezasOperacaoPage'
import NovoNaturezaOperacaoPage from './pages/NovoNaturezaOperacaoPage'
import UnidadesMedidaPage from './pages/UnidadesMedidaPage'
import NovoUnidadeMedidaPage from './pages/NovoUnidadeMedidaPage'
import ContaPage from './pages/ContaPage'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { SelectionProvider } from './contexts/SelectionContext'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
          <Routes>
            {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rotas protegidas com Layout */}
          <Route path="/" element={<PrivateRoute element={<SelectionProvider><Layout /></SelectionProvider>} />}>
            <Route index element={<HomePage />} />
            <Route path="inicio" element={<HomePage />} />
            <Route path="financeiro" element={<DashboardPage />} />
            <Route path="produtos" element={<ProdutosPage />} />
            <Route path="produtos/novo" element={<NovoProdutoPage />} />
            <Route path="produtos/:id/editar" element={<NovoProdutoPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="clientes/novo" element={<NovoClientePage />} />
            <Route path="clientes/:id/editar" element={<NovoClientePage />} />
            <Route path="clientes/:id" element={<ClienteDetalhePage />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="pedidos/novo" element={<NovoPedidoPage />} />
            <Route path="pedidos/:id" element={<NovoPedidoPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="naturezas-operacao" element={<NaturezasOperacaoPage />} />
            <Route path="naturezas-operacao/novo" element={<NovoNaturezaOperacaoPage />} />
            <Route path="naturezas-operacao/:id/editar" element={<NovoNaturezaOperacaoPage />} />
            <Route path="unidades-medida" element={<UnidadesMedidaPage />} />
            <Route path="unidades-medida/novo" element={<NovoUnidadeMedidaPage />} />
            <Route path="unidades-medida/:id/editar" element={<NovoUnidadeMedidaPage />} />
            <Route path="conta" element={<ContaPage />} />
          </Route>
          
          {/* Rota fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </AuthProvider>
    </ToastProvider>
  )
}

export default App
