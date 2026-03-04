import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'

interface UsuarioData {
  usuarioId: number
  email: string
  cnpj: string
  nomeFantasia: string
  razaoSocial: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  usuario: UsuarioData | null
  login: (email: string, senha: string) => Promise<void>
  register: (email: string, cnpj: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [usuario, setUsuario] = useState<UsuarioData | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const usuarioData = localStorage.getItem('usuario')
      if (token && usuarioData) {
        setIsAuthenticated(true)
        setUsuario(JSON.parse(usuarioData))
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, senha: string) => {
    const response = await authApi.login(email, senha)
    const usuarioData: UsuarioData = {
      usuarioId: response.data.usuarioId,
      email: response.data.email,
      cnpj: response.data.cnpj,
      nomeFantasia: response.data.nomeFantasia,
      razaoSocial: response.data.razaoSocial,
    }
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('usuario', JSON.stringify(usuarioData))
    setUsuario(usuarioData)
    setIsAuthenticated(true)
  }

  const register = async (email: string, cnpj: string, senha: string) => {
    const response = await authApi.register(email, cnpj, senha)
    const usuarioData: UsuarioData = {
      usuarioId: response.data.usuarioId,
      email: response.data.email,
      cnpj: response.data.cnpj,
      nomeFantasia: response.data.nomeFantasia,
      razaoSocial: response.data.razaoSocial,
    }
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('usuario', JSON.stringify(usuarioData))
    setUsuario(usuarioData)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, usuario, login, register, logout }}>
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
