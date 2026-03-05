import { useEffect, useState } from 'react'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Snackbar, Alert, Fab, Card, CardContent, Typography
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
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  const [form, setForm] = useState({
    sigla: '',
    descricao: ''
  })

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

  const handleOpen = (unidade?: UnidadeMedida) => {
    if (unidade) {
      setEditingId(unidade.id)
      setForm({
        sigla: unidade.sigla,
        descricao: unidade.descricao || ''
      })
    } else {
      setEditingId(null)
      setForm({
        sigla: '',
        descricao: ''
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!form.sigla.trim()) {
      setSnackbar({ open: true, message: 'A sigla é obrigatória', severity: 'error' })
      return
    }

    try {
      if (editingId) {
        await unidadesMedidaApi.atualizar(editingId, form)
        setSnackbar({ open: true, message: 'Unidade de medida atualizada!', severity: 'success' })
      } else {
        await unidadesMedidaApi.criar(form)
        setSnackbar({ open: true, message: 'Unidade de medida criada!', severity: 'success' })
      }
      handleClose()
      await loadUnidades()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao salvar', severity: 'error' })
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta unidade de medida?')) {
      try {
        await unidadesMedidaApi.deletar(id)
        setSnackbar({ open: true, message: 'Unidade de medida excluída!', severity: 'success' })
        await loadUnidades()
      } catch (error: any) {
        setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao excluir', severity: 'error' })
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
                      <IconButton onClick={() => handleOpen(unidade)} size="small" title="Editar">
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
        </CardContent>
      </Card>

      <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 300, color: '#333' }}>
            {editingId ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Sigla *
            </Typography>
            <TextField
              fullWidth
              value={form.sigla}
              onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
              required
              placeholder="Ex: KG, UN, CX"
              inputProps={{ maxLength: 10 }}
              size="small"
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Descrição
            </Typography>
            <TextField
              fullWidth
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: Quilograma, Unidade, Caixa"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
