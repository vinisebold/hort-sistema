import { Box, Card, CardContent, Typography, Divider, Avatar, Button } from '@mui/material'
import { AccountCircle, Store, Logout } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ContaPage() {
  const { nomeNegocio, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Minha Conta
      </Typography>

      <Card sx={{ maxWidth: 500, mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
              <AccountCircle sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {nomeNegocio || 'Usuário'}
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
                  Nome do Negócio
                </Typography>
                <Typography variant="body1">
                  {nomeNegocio || 'Não definido'}
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
