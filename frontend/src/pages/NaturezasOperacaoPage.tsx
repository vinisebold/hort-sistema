import { useEffect, useState } from 'react'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, FormControlLabel, Checkbox, Chip, Snackbar, Alert, Fab, Card, CardContent, Typography
} from '@mui/material'
import { Add, Edit, TrendingUp, TrendingDown } from '@mui/icons-material'
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
      return <Chip icon={<TrendingUp />} label="Entrada" color="success" size="small" sx={{ fontSize: '0.75rem' }} />
    }
    return <Chip icon={<TrendingDown />} label="Saída" color="warning" size="small" sx={{ fontSize: '0.75rem' }} />
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Naturezas de Operação
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Configure os tipos de operações e suas regras de movimentação
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Operação
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 150 }}>
                    Tipo
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 280 }}>
                    Campos Obrigatórios
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 80 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {naturezas.map((natureza) => (
                  <TableRow 
                    key={natureza.id}
                    sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
                          {natureza.descricao}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          ID: {natureza.id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getTipoChip(natureza.tipoMovimento)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        {natureza.exigeCliente && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2e7d32' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.813rem', color: '#555' }}>
                              Cliente
                            </Typography>
                          </Box>
                        )}
                        {natureza.exigeValorUnitario && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2e7d32' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.813rem', color: '#555' }}>
                              Valor Unitário
                            </Typography>
                          </Box>
                        )}
                        {natureza.exigeStatus && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2e7d32' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.813rem', color: '#555' }}>
                              Status Pagamento
                            </Typography>
                          </Box>
                        )}
                        {!natureza.exigeCliente && !natureza.exigeValorUnitario && !natureza.exigeStatus && (
                          <Typography variant="body2" sx={{ fontSize: '0.813rem', color: '#aaa', fontStyle: 'italic' }}>
                            Nenhum campo obrigatório
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleOpen(natureza)} size="small" title="Editar">
                        <Edit />
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
            {editingId ? 'Editar Natureza de Operação' : 'Nova Natureza de Operação'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Descrição *
            </Typography>
            <TextField
              fullWidth
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
              placeholder="Ex: Venda, Compra, Devolução"
              size="small"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Tipo de Movimento *
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={form.tipoMovimento}
                onChange={(e) => setForm({ ...form, tipoMovimento: e.target.value as 'ENTRADA' | 'SAIDA' })}
              >
                <MenuItem value="ENTRADA">📥 Entrada</MenuItem>
                <MenuItem value="SAIDA">📤 Saída</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Campos Obrigatórios
            </Typography>
            <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1.5, fontStyle: 'italic' }}>
              Marque os campos que serão obrigatórios ao criar pedidos com esta natureza
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.exigeCliente}
                    onChange={(e) => setForm({ ...form, exigeCliente: e.target.checked })}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Exigir Cliente</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.exigeValorUnitario}
                    onChange={(e) => setForm({ ...form, exigeValorUnitario: e.target.checked })}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Exigir Valor Unitário</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.exigeStatus}
                    onChange={(e) => setForm({ ...form, exigeStatus: e.target.checked })}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Exigir Status de Pagamento</Typography>}
              />
            </Box>
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
