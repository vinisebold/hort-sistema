import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Button, TextField, Card, CardContent,
  CircularProgress, Fab, Grid, FormControl, Select, MenuItem
} from '@mui/material'
import { ArrowBack, Check } from '@mui/icons-material'
import { produtosApi, unidadesMedidaApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'

interface UnidadeMedida {
  id: number
  sigla: string
  descricao: string
}

export default function NovoProdutoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { showToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])

  const [form, setForm] = useState({
    descricao: '',
    unidadeMedidaId: '',
  })

  useEffect(() => {
    loadUnidades()
    if (isEditing) {
      loadProduto()
    }
  }, [id])

  const loadUnidades = async () => {
    try {
      const response = await unidadesMedidaApi.listar()
      setUnidades(response.data)
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const loadProduto = async () => {
    try {
      const response = await produtosApi.buscar(Number(id))
      const produto = response.data
      setForm({
        descricao: produto.descricao,
        unidadeMedidaId: String(produto.unidadeMedida?.id ?? ''),
      })
    } catch (error) {
      console.error('Erro ao carregar produto:', error)
      showToast('Erro ao carregar produto', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!form.descricao || !form.unidadeMedidaId) {
      showToast('Preencha todos os campos obrigatórios', 'error')
      return
    }

    setLoading(true)
    try {
      const data = {
        descricao: form.descricao,
        unidadeMedidaId: Number(form.unidadeMedidaId),
      }

      if (isEditing) {
        await produtosApi.atualizar(Number(id), data)
        showToast('Produto atualizado com sucesso!', 'success')
      } else {
        await produtosApi.criar(data)
        showToast('Produto criado com sucesso!', 'success')
      }

      navigate('/produtos')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao salvar produto', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
            Produto
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
            {isEditing ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }} alignItems="flex-end">
            <Grid item xs={12} md={7}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                DESCRICAO *
              </Typography>
              <TextField
                fullWidth
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Tomate, Alface, Cenoura"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                UNIDADE DE MEDIDA *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.unidadeMedidaId}
                  onChange={(e) => setForm({ ...form, unidadeMedidaId: e.target.value })}
                  required
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Selecione a unidade
                  </MenuItem>
                  {unidades.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.sigla} - {u.descricao}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, py: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/produtos')}
        >
          Voltar
        </Button>
      </Box>

      <Fab
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          width: 56,
          height: 56,
          boxShadow: 4,
          '& .MuiSvgIcon-root': {
            fontSize: 28
          }
        }}
      >
        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <Check />}
      </Fab>
    </Box>
  )
}
