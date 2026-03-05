import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  InputAdornment,
  IconButton
} from '@mui/material'
import { Visibility, VisibilityOff, Email } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    navigate('/inicio')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, senha)
      navigate('/inicio')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou senha incorretos')
    }
  }

  const handleClickShowPassword = () => setShowPassword((show) => !show)

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Left Side - Login Form */}
      <Grid
        item
        xs={12}
        md={5}
        lg={4}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          px: { xs: 4, sm: 8, md: 6, lg: 8 },
          py: 6,
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4, width: '100%' }}>
            <img 
              src="/assets/logo-hort-sistema.png" 
              alt="Hort Sistema" 
              style={{ width: '100%', maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }} 
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#111827' }}>
              Acesse sua conta
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              Bem-vindo de volta! Por favor, insira seus dados.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              variant="filled"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              InputProps={{
                disableUnderline: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Email sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: '#f3f4f6',
                  '&:hover': { backgroundColor: '#e5e7eb' },
                  '&.Mui-focused': {
                    backgroundColor: '#f3f4f6',
                    boxShadow: '0 0 0 2px #2e7d32 inset',
                  }
                }
              }}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              variant="filled"
              type={showPassword ? 'text' : 'password'}
              label="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              InputProps={{
                disableUnderline: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      sx={{ color: '#9ca3af' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: '#f3f4f6',
                  '&:hover': { backgroundColor: '#e5e7eb' },
                  '&.Mui-focused': {
                    backgroundColor: '#f3f4f6',
                    boxShadow: '0 0 0 2px #2e7d32 inset',
                  }
                }
              }}
              sx={{ mb: 4 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                bgcolor: '#2e7d32',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 6px -1px rgba(46, 125, 50, 0.2), 0 2px 4px -1px rgba(46, 125, 50, 0.1)',
                '&:hover': {
                  bgcolor: '#1b5e20',
                  boxShadow: '0 10px 15px -3px rgba(46, 125, 50, 0.3), 0 4px 6px -2px rgba(46, 125, 50, 0.1)',
                }
              }}
            >
              Entrar no sistema
            </Button>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Não possui uma conta?{' '}
              <Link to="/register" style={{ color: '#2e7d32', textDecoration: 'none', fontWeight: 600 }}>
                Crie uma agora
              </Link>
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* Right Side - Brand Area */}
      <Grid
        item
        xs={false}
        md={7}
        lg={8}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
          position: 'relative',
          overflow: 'hidden',
          p: 8,
          color: 'white'
        }}
      >
        {/* Decorative Circles */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.03)',
            zIndex: 1
          }}
        />
        
        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 600, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.02em' }}>
            Gestão inteligente para o seu agronegócio
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, lineHeight: 1.6 }}>
            Tenha controle total sobre suas vendas, clientes e produtos. Tudo em uma plataforma moderna, rápida e fácil de usar, feita sob medida para atacadistas de hortifrúti.
          </Typography>
          
          <Box sx={{ mt: 8, display: 'flex', gap: 4, justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>100%</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Seguro</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>24/7</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Disponível</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>+Rápido</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>No faturamento</Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
    </Grid>
  )
}
