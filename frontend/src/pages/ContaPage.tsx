import { Box, Card, CardContent, Grid, Typography, Avatar, Button } from '@mui/material'
import { AccountCircle, Logout } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const cardSx = {
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  borderRadius: 2,
}

interface FieldProps {
  label: string
  value: string
}

function Field({ label, value }: FieldProps) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#667085', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: '#101828', fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  )
}

export default function ContaPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const formatarCnpj = (cnpj: string): string => {
    const n = cnpj.replace(/\D/g, '')
    return n.length === 14
      ? n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      : n
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Meus Dados
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Informações da sua conta e empresa
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 700 }}>

        {/* Card 1 — Perfil */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 4 }}>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 100, color: '#333', letterSpacing: 0.1, mb: 3 }}>
              Perfil
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <AccountCircle sx={{ fontSize: 34 }} />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#101828' }}>
                  {usuario?.nomeFantasia || 'Usuário'}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#667085', mt: 0.25 }}>
                  Administrador
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Card 2 — Dados da Empresa */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 4 }}>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 100, color: '#333', letterSpacing: 0.1, mb: 3 }}>
              Empresa
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Field label="Nome Fantasia" value={usuario?.nomeFantasia || '—'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Razão Social" value={usuario?.razaoSocial || '—'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="CNPJ" value={usuario?.cnpj ? formatarCnpj(usuario.cnpj) : '—'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Email" value={usuario?.email || '—'} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 3 — Sessão */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 4 }}>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 100, color: '#333', letterSpacing: 0.1, mb: 1 }}>
              Sessão
            </Typography>
            <Typography variant="body2" sx={{ color: '#667085', mb: 3 }}>
              Você está conectado como administrador desta conta.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout sx={{ fontSize: 18 }} />}
              onClick={handleLogout}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Sair da conta
            </Button>
          </CardContent>
        </Card>

      </Box>
    </Box>
  )
}
