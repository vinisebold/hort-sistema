import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { clientesApi } from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, register } = useAuth()
  const [email, setEmail] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated && !authLoading) {
    navigate('/inicio')
    return null
  }

  const formatarCnpj = (cnpj: string): string => {
    const apenasNumeros = cnpj.replace(/\D/g, '')
    if (apenasNumeros.length !== 14) {
      return apenasNumeros
    }
    return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const apenasNumeros = value.replace(/\D/g, '')
    
    // Limit to 14 digits
    if (apenasNumeros.length <= 14) {
      setCnpj(formatarCnpj(apenasNumeros))

      // Trigger lookup when 14 digits are reached
      if (apenasNumeros.length === 14) {
        handleCnpjLookup(apenasNumeros)
      }
    }
  }

  const handleCnpjLookup = async (cnpjDigits: string) => {
    if (cnpjDigits.length !== 14) return

    setCnpjLookupLoading(true)
    setError('')

    try {
      const response = await clientesApi.consultarCnpj(cnpjDigits)
      setNomeFantasia(response.data.nomeFantasia || '')
      setRazaoSocial(response.data.razaoSocial || '')
    } catch (err: any) {
      setError('CNPJ não encontrado na base de dados')
      setNomeFantasia('')
      setRazaoSocial('')
    } finally {
      setCnpjLookupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email) {
      setError('Email é obrigatório')
      return
    }

    if (cnpj.replace(/\D/g, '').length !== 14) {
      setError('CNPJ deve ter 14 dígitos')
      return
    }

    if (!senha || senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres')
      return
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não correspondem')
      return
    }

    if (!nomeFantasia || !razaoSocial) {
      setError('CNPJ não foi validado ou não encontrado')
      return
    }

    setLoading(true)

    try {
      const cnpjDigits = cnpj.replace(/\D/g, '')
      await register(email, cnpjDigits, senha)
      navigate('/inicio')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar conta')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Card sx={{ maxWidth: 450, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            🌱 Registrar
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Crie sua conta no Hort Sistema
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="CNPJ"
                value={cnpj}
                onChange={handleCnpjChange}
                margin="normal"
                placeholder="00.000.000/0000-00"
                required
              />
              {cnpjLookupLoading && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#2e7d32'
                  }}
                />
              )}
            </Box>

            {nomeFantasia && (
              <TextField
                fullWidth
                label="Nome Fantasia"
                value={nomeFantasia}
                margin="normal"
                disabled
              />
            )}

            {razaoSocial && (
              <TextField
                fullWidth
                label="Razão Social"
                value={razaoSocial}
                margin="normal"
                disabled
              />
            )}
            
            <TextField
              fullWidth
              type="password"
              label="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              type="password"
              label="Confirmar Senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              margin="normal"
              required
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading || cnpjLookupLoading}
            >
              {loading ? <CircularProgress size={24} /> : 'Registrar'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Já tem conta? <Link to="/login" style={{ color: '#2e7d32', textDecoration: 'none', fontWeight: 'bold' }}>Faça login</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
