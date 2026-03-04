import { Box, Card, CardContent, Typography, Divider, Avatar, Button } from '@mui/material'
import { AccountCircle, Store, Logout, Email } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ContaPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const formatarCnpj = (cnpj: string): string => {
    const apenasNumeros = cnpj.replace(/\D/g, '')
    if (apenasNumeros.length !== 14) {
      return apenasNumeros
    }
    return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box>
      <Card sx={{ maxWidth: 500, mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
              <AccountCircle sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {usuario?.nomeFantasia || 'Usuário'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrador
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Store color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Nome Fantasia
                </Typography>
                <Typography variant="body1">
                  {usuario?.nomeFantasia || 'Não definido'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Store color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Razão Social
                </Typography>
                <Typography variant="body1">
                  {usuario?.razaoSocial || 'Não definido'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Store color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  CNPJ
                </Typography>
                <Typography variant="body1">
                  {usuario?.cnpj ? formatarCnpj(usuario.cnpj) : 'Não definido'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Email color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {usuario?.email || 'Não definido'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
