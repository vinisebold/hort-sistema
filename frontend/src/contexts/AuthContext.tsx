import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  isSetup: boolean
  nomeNegocio: string
  login: (senha: string) => Promise<void>
  setup: (senha: string, nomeNegocio: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSetup, setIsSetup] = useState(false)
  const [nomeNegocio, setNomeNegocio] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const nome = localStorage.getItem('nomeNegocio')
      if (token) {
        setIsAuthenticated(true)
        if (nome) setNomeNegocio(nome)
      }
      
      // Verificar se precisa de setup
      const response = await authApi.status()
      setIsSetup(response.data.primeiroAcesso)
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (senha: string) => {
    const response = await authApi.login(senha)
    localStorage.setItem('token', response.data.token)
    setIsAuthenticated(true)
  }

  const setup = async (senha: string, nomeNegocio: string) => {
    const response = await authApi.setup(senha, nomeNegocio)
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('nomeNegocio', nomeNegocio)
    setNomeNegocio(nomeNegocio)
    setIsAuthenticated(true)
    setIsSetup(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nomeNegocio')
    setNomeNegocio('')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, isSetup, nomeNegocio, login, setup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
