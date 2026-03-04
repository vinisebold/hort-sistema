import { useEffect, useState } from 'react'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox, Chip, Snackbar, Alert, Fab
} from '@mui/material'
import { Add, Edit, TrendingUp, TrendingDown, CheckCircle, Cancel } from '@mui/icons-material'
import { naturezasApi } from '../services/api'
import { NaturezaOperacao } from '../types'

export default function NaturezasOperacaoPage() {
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  const [form, setForm] = useState({
    descricao: '',
    tipoMovimento: 'SAIDA' as 'ENTRADA' | 'SAIDA',
    exigeCliente: true,
    exigeValorUnitario: true,
    exigeStatus: true
  })

  useEffect(() => {
    loadNaturezas().catch(console.error)
  }, [])

  const loadNaturezas = async () => {
    try {
      const response = await naturezasApi.listar()
      setNaturezas(response.data)
    } catch (error) {
      console.error('Erro ao carregar naturezas:', error)
    }
  }

  const handleOpen = (natureza?: NaturezaOperacao) => {
    if (natureza) {
      setEditingId(natureza.id)
      setForm({
        descricao: natureza.descricao,
        tipoMovimento: natureza.tipoMovimento,
        exigeCliente: natureza.exigeCliente,
        exigeValorUnitario: natureza.exigeValorUnitario,
        exigeStatus: natureza.exigeStatus
      })
    } else {
      setEditingId(null)
      setForm({
        descricao: '',
        tipoMovimento: 'SAIDA',
        exigeCliente: true,
        exigeValorUnitario: true,
        exigeStatus: true
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
        await naturezasApi.atualizar(editingId, form)
        setSnackbar({ open: true, message: 'Natureza de operação atualizada!', severity: 'success' })
      } else {
        await naturezasApi.criar(form)
        setSnackbar({ open: true, message: 'Natureza de operação criada!', severity: 'success' })
      }
      handleClose()
      await loadNaturezas()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao salvar', severity: 'error' })
    }
  }

  const getTipoChip = (tipo: string) => {
    if (tipo === 'ENTRADA') {
      return <Chip icon={<TrendingUp />} label="Entrada" color="success" size="small" />
    }
    return <Chip icon={<TrendingDown />} label="Saída" color="warning" size="small" />
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Tipo de Movimento</TableCell>
              <TableCell align="center">Exige Cliente</TableCell>
              <TableCell align="center">Exige Valor Unit.</TableCell>
              <TableCell align="center">Exige Status</TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {naturezas.map((natureza) => (
              <TableRow key={natureza.id}>
                <TableCell>{natureza.id}</TableCell>
                <TableCell>{natureza.descricao}</TableCell>
                <TableCell>{getTipoChip(natureza.tipoMovimento)}</TableCell>
                <TableCell align="center">
                  {natureza.exigeCliente ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="disabled" />
                  )}
                </TableCell>
                <TableCell align="center">
                  {natureza.exigeValorUnitario ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="disabled" />
                  )}
                </TableCell>
                <TableCell align="center">
                  {natureza.exigeStatus ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="disabled" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(natureza)}><Edit /></IconButton>
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
        <DialogTitle>{editingId ? 'Editar Natureza de Operação' : 'Nova Natureza de Operação'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Movimento</InputLabel>
            <Select
              value={form.tipoMovimento}
              label="Tipo de Movimento"
              onChange={(e) => setForm({ ...form, tipoMovimento: e.target.value as 'ENTRADA' | 'SAIDA' })}
            >
              <MenuItem value="ENTRADA">📥 Entrada</MenuItem>
              <MenuItem value="SAIDA">📤 Saída</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
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
                  checked={form.exigeValorUnitario}
                  onChange={(e) => setForm({ ...form, exigeValorUnitario: e.target.checked })}
                />
              }
              label="Exige Valor Unitário"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.exigeStatus}
                  onChange={(e) => setForm({ ...form, exigeStatus: e.target.checked })}
                />
              }
              label="Exige Status"
            />
          </Box>
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
