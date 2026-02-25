import { useEffect, useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Checkbox, Chip, Snackbar, Alert
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { formasPagamentoApi } from '../services/api'

interface FormaPagamento {
  id: number
  descricao: string
  exigeCliente: boolean
  exigeDocumentoReferencia: boolean
  isActive: boolean
}

export default function FormasPagamentoPage() {
  const [formas, setFormas] = useState<FormaPagamento[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  const [form, setForm] = useState({
    descricao: '',
    exigeCliente: false,
    exigeDocumentoReferencia: false
  })

  useEffect(() => {
    loadFormas()
  }, [])

  const loadFormas = async () => {
    try {
      const response = await formasPagamentoApi.listar()
      setFormas(response.data)
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error)
    }
  }

  const handleOpen = (forma?: FormaPagamento) => {
    if (forma) {
      setEditingId(forma.id)
      setForm({
        descricao: forma.descricao,
        exigeCliente: forma.exigeCliente,
        exigeDocumentoReferencia: forma.exigeDocumentoReferencia
      })
    } else {
      setEditingId(null)
      setForm({
        descricao: '',
        exigeCliente: false,
        exigeDocumentoReferencia: false
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!form.descricao.trim()) {
      setSnackbar({ open: true, message: 'A descrição é obrigatória', severity: 'error' })
      return
    }

    try {
      if (editingId) {
        await formasPagamentoApi.atualizar(editingId, form)
        setSnackbar({ open: true, message: 'Forma de pagamento atualizada!', severity: 'success' })
      } else {
        await formasPagamentoApi.criar(form)
        setSnackbar({ open: true, message: 'Forma de pagamento criada!', severity: 'success' })
      }
      handleClose()
      loadFormas()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao salvar', severity: 'error' })
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
      try {
        await formasPagamentoApi.deletar(id)
        setSnackbar({ open: true, message: 'Forma de pagamento excluída!', severity: 'success' })
        loadFormas()
      } catch (error: any) {
        setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao excluir', severity: 'error' })
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Formas de Pagamento</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Nova Forma de Pagamento
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell align="center">Exige Cliente</TableCell>
              <TableCell align="center">Exige Doc. Referência</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formas.map((forma) => (
              <TableRow key={forma.id}>
                <TableCell>{forma.descricao}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={forma.exigeCliente ? 'Sim' : 'Não'} 
                    color={forma.exigeCliente ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={forma.exigeDocumentoReferencia ? 'Sim' : 'Não'} 
                    color={forma.exigeDocumentoReferencia ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={forma.isActive ? 'Ativo' : 'Inativo'} 
                    color={forma.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(forma)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(forma.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            margin="normal"
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.exigeCliente}
                onChange={(e) => setForm({ ...form, exigeCliente: e.target.checked })}
              />
            }
            label="Exige Cliente"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.exigeDocumentoReferencia}
                onChange={(e) => setForm({ ...form, exigeDocumentoReferencia: e.target.checked })}
              />
            }
            label="Exige Documento de Referência"
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
