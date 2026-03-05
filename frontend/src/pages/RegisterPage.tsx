import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Business } from '@mui/icons-material'
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
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const handleCnpjBlur = () => {
    const apenasNumeros = cnpj.replace(/\D/g, '')
    if (apenasNumeros.length === 14) {
      handleCnpjLookup(apenasNumeros)
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
      const status = err.response?.status
      if (status === 404) {
        setError('CNPJ não encontrado na base de dados')
      } else if (status === 401 || status === 403) {
        setError('Consulta de CNPJ não autorizada')
      } else {
        setError('Erro ao consultar CNPJ. Verifique sua conexão')
      }
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

  const handleClickShowPassword = () => setShowPassword((show) => !show)
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show)

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Left Side - Register Form */}
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
              Crie sua conta
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              Junte-se a nós e transforme a gestão do seu agronegócio.
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
            
            <Box sx={{ position: 'relative', mb: 3 }}>
              <TextField
                fullWidth
                variant="filled"
                label="CNPJ"
                value={cnpj}
                onChange={handleCnpjChange}
                onBlur={handleCnpjBlur}
                placeholder="00.000.000/0000-00"
                required
                InputProps={{
                  disableUnderline: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      {cnpjLookupLoading ? (
                        <CircularProgress size={20} sx={{ color: '#2e7d32' }} />
                      ) : (
                        <Business sx={{ color: '#9ca3af' }} />
                      )}
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
              />
            </Box>

            {nomeFantasia && (
              <TextField
                fullWidth
                variant="filled"
                label="Nome Fantasia"
                value={nomeFantasia}
                disabled
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    borderRadius: 2,
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280'
                  }
                }}
                sx={{ mb: 3 }}
              />
            )}

            {razaoSocial && (
              <TextField
                fullWidth
                variant="filled"
                label="Razão Social"
                value={razaoSocial}
                disabled
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    borderRadius: 2,
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280'
                  }
                }}
                sx={{ mb: 3 }}
              />
            )}
            
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
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              variant="filled"
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirmar Senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              InputProps={{
                disableUnderline: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                      sx={{ color: '#9ca3af' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
              disabled={loading || cnpjLookupLoading}
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
                },
                '&.Mui-disabled': {
                  bgcolor: '#9ca3af',
                  color: '#f3f4f6'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrar conta'}
            </Button>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Já tem conta?{' '}
              <Link to="/login" style={{ color: '#2e7d32', textDecoration: 'none', fontWeight: 600 }}>
                Faça login
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
