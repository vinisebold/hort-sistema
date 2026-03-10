import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Fab, Card, CardContent, Typography
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { unidadesMedidaApi } from '../services/api'

interface UnidadeMedida {
  id: number
  sigla: string
  descricao: string
  isActive: boolean
}

export default function UnidadesMedidaPage() {
  const navigate = useNavigate()
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])

  useEffect(() => {
    loadUnidades().catch(console.error)
  }, [])

  const loadUnidades = async () => {
    try {
      const response = await unidadesMedidaApi.listar()
      setUnidades(response.data)
    } catch (error) {
      console.error('Erro ao carregar unidades de medida:', error)
    }
  }


  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta unidade de medida?')) {
      try {
        await unidadesMedidaApi.deletar(id)
        alert('Unidade de medida excluída!')
        await loadUnidades()
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erro ao excluir')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Unidades de Medida
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Gerencie as unidades de medida utilizadas nos produtos
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Unidade
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 120 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 120 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unidades.map((unidade) => (
                  <TableRow 
                    key={unidade.id}
                    sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
                          {unidade.descricao || 'Sem descrição'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          Sigla: {unidade.sigla}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={unidade.isActive ? 'Ativo' : 'Inativo'} 
                        color={unidade.isActive ? 'success' : 'error'}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => navigate(`/unidades-medida/${unidade.id}/editar`)} size="small" title="Editar">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(unidade.id)} size="small" title="Excluir">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ color: '#555', fontSize: '0.95rem' }}>
              Exibindo {unidades.length} de {unidades.length}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Fab color="primary" aria-label="add" onClick={() => navigate('/unidades-medida/novo')} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>
    </Box>
  )
}
