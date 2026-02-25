import { useEffect, useState } from 'react'
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Fab } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { produtosApi, unidadesMedidaApi } from '../services/api'

interface Produto {
  id: number
  codigo: string
  descricao: string
  estoqueAtual: number
  unidadeMedida: { id: number; sigla: string }
  isActive: boolean
}

interface UnidadeMedida {
  id: number
  sigla: string
  descricao: string
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ codigo: '', descricao: '', unidadeMedidaId: '' })

  useEffect(() => {
    loadProdutos().catch(console.error)
    loadUnidades().catch(console.error)
  }, [])

  const loadProdutos = async () => {
    try {
      const response = await produtosApi.listar()
      setProdutos(response.data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadUnidades = async () => {
    try {
      const response = await unidadesMedidaApi.listar()
      setUnidades(response.data)
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const handleOpen = (produto?: Produto) => {
    if (produto) {
      setEditingId(produto.id)
      setForm({
        codigo: produto.codigo,
        descricao: produto.descricao,
        unidadeMedidaId: String(produto.unidadeMedida.id),
      })
    } else {
      setEditingId(null)
      setForm({ codigo: '', descricao: '', unidadeMedidaId: '' })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
    setForm({ codigo: '', descricao: '', unidadeMedidaId: '' })
  }

  const handleSubmit = async () => {
    try {
      const data = {
        codigo: form.codigo,
        descricao: form.descricao,
        unidadeMedidaId: Number(form.unidadeMedidaId),
      }
      
      if (editingId) {
        await produtosApi.atualizar(editingId, data)
      } else {
        await produtosApi.criar(data)
      }
      
      handleClose()
      await loadProdutos()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao salvar produto')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await produtosApi.deletar(id)
        await loadProdutos()
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erro ao excluir produto')
      }
    }
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Un. de estoque</TableCell>
              <TableCell align="right">Estoque</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produtos.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>{produto.codigo}</TableCell>
                <TableCell>{produto.descricao}</TableCell>
                <TableCell>{produto.unidadeMedida?.sigla}</TableCell>
                <TableCell align="right">{produto.estoqueAtual}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(produto)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(produto.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="standard"
            label="Código"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            variant="standard"
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Unidade de Medida</InputLabel>
            <Select
              value={form.unidadeMedidaId}
              label="Unidade de Medida"
              onChange={(e) => setForm({ ...form, unidadeMedidaId: e.target.value })}
            >
              {unidades.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.sigla} - {u.descricao}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
