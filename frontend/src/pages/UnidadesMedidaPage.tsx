import { useEffect, useState } from 'react'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Snackbar, Alert, Fab
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sigla</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {unidades.map((unidade) => (
              <TableRow key={unidade.id}>
                <TableCell>
                  <Chip label={unidade.sigla} color="primary" size="small" />
                </TableCell>
                <TableCell>{unidade.descricao || '-'}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={unidade.isActive ? 'Ativo' : 'Inativo'} 
                    color={unidade.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(unidade)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(unidade.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            
            label="Sigla"
            value={form.sigla}
            onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
            margin="normal"
            required
            placeholder="Ex: KG, UN, CX"
            inputProps={{ maxLength: 10 }}
          />
          <TextField
            fullWidth
            
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            margin="normal"
            placeholder="Ex: Quilograma, Unidade, Caixa"
          />
        </DialogContent>
        <DialogActions>
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
