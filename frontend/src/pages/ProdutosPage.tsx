import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Fab, CircularProgress, Card, CardContent, Typography, Chip } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { produtosApi, unidadesMedidaApi } from '../services/api'

interface Produto {
  id: number
  codigo: string
  descricao: string
  unidadeMedida: { id: number; sigla: string }
  isActive: boolean
}

export default function ProdutosPage() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

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
      await unidadesMedidaApi.listar()
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
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
                      <IconButton onClick={() => navigate(`/produtos/${produto.id}/editar`)} size="small" title="Editar">
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

      <Fab color="primary" aria-label="add" onClick={() => navigate('/produtos/novo')} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>
    </Box>
  )
}
