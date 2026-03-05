import { useEffect, useState } from 'react'
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, Fab, CircularProgress, Card, CardContent, Typography, Chip } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { produtosApi, unidadesMedidaApi } from '../services/api'

interface Produto {
  id: number
  codigo: string
  descricao: string
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
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
   const [form, setForm] = useState({ descricao: '', unidadeMedidaId: '' })

  useEffect(() => {
    loadProdutos().catch(console.error)
    loadUnidades().catch(console.error)
  }, [])

  const loadProdutos = async () => {
    try {
      const response = await produtosApi.listar()
      const payload = response.data
      // support legacy array responses and new CursorResponse wrapper
      const data = Array.isArray(payload) ? payload : (payload.data ?? [])
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setProdutos(data)
      setNextCursor(nc ?? null)
      setHasNext(hn)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadMore = async () => {
    if (!hasNext || loadingMore || nextCursor == null) return
    setLoadingMore(true)
    try {
      const response = await produtosApi.listar(nextCursor)
      const payload = response.data
      const data = Array.isArray(payload) ? payload : (payload.data ?? [])
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setProdutos(prev => [...prev, ...data])
      setNextCursor(nc ?? null)
      setHasNext(hn)
    } catch (error) {
      console.error('Erro ao carregar mais produtos:', error)
    } finally {
      setLoadingMore(false)
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
         descricao: produto.descricao,
         unidadeMedidaId: String(produto.unidadeMedida.id),
       })
     } else {
       setEditingId(null)
       setForm({ descricao: '', unidadeMedidaId: '' })
     }
     setOpen(true)
   }

   const handleClose = () => {
     setOpen(false)
     setEditingId(null)
     setForm({ descricao: '', unidadeMedidaId: '' })
   }

   const handleSubmit = async () => {
     try {
       const data = {
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Produtos
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Cadastre e gerencie os produtos do seu estoque
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Produto
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 150 }}>
                    Unidade
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 120 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow 
                    key={produto.id}
                    sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
                          {produto.descricao}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          Código: {produto.codigo}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={produto.unidadeMedida.sigla} 
                        size="small" 
                        sx={{ 
                          fontSize: '0.75rem',
                          bgcolor: '#e0e0e0',
                          color: '#555',
                          border: 'none',
                          fontWeight: 500
                        }} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleOpen(produto)} size="small" title="Editar">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(produto.id)} size="small" title="Excluir">
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

      {hasNext && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button onClick={loadMore} disabled={loadingMore} variant="outlined">
            {loadingMore ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Carregar mais
          </Button>
        </Box>
      )}

      <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>

       <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
           <Typography variant="h6" sx={{ fontWeight: 300, color: '#333' }}>
             {editingId ? 'Editar Produto' : 'Novo Produto'}
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
               placeholder="Ex: Tomate, Alface, Cenoura"
               size="small"
               required
             />
           </Box>
           <Box>
             <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
               Unidade de Medida *
             </Typography>
             <FormControl fullWidth size="small">
               <Select
                 value={form.unidadeMedidaId}
                 onChange={(e) => setForm({ ...form, unidadeMedidaId: e.target.value })}
                 required
               >
                 {unidades.map((u) => (
                   <MenuItem key={u.id} value={u.id}>
                     {u.sigla} - {u.descricao}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Box>
         </DialogContent>
         <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2 }}>
           <Button onClick={handleClose}>Cancelar</Button>
           <Button onClick={handleSubmit} variant="contained">Salvar</Button>
         </DialogActions>
       </Dialog>
    </Box>
  )
}
