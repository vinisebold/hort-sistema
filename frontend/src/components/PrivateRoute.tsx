import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Box, Typography } from '@mui/material'

interface PrivateRouteProps {
  element: React.ReactElement
}

export default function PrivateRoute({ element }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />
}
