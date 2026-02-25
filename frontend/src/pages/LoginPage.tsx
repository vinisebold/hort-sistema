import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, isSetup, login, setup } = useAuth()
  const [senha, setSenha] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [error, setError] = useState('')

  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    navigate('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (isSetup) {
        await setup(senha, nomeNegocio)
      } else {
        await login(senha)
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao autenticar')
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            🌱 Hort Sistema
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            {isSetup ? 'Primeiro acesso - Configure sua senha' : 'Digite sua senha para acessar'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            {isSetup && (
              <TextField
                fullWidth
                label="Nome do Negócio"
                value={nomeNegocio}
                onChange={(e) => setNomeNegocio(e.target.value)}
                margin="normal"
                required
              />
            )}
            
               <TextField
                 fullWidth
                 variant="standard"
                 type="password"
                 label="Senha"
                 value={senha}
                 onChange={(e) => setSenha(e.target.value)}
                 margin="normal"
                 required
               />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              {isSetup ? 'Configurar' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
