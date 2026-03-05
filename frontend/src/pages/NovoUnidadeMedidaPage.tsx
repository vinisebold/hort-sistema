import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Button, TextField, Card, CardContent,
  Alert, Snackbar, CircularProgress, Fab, Grid
} from '@mui/material'
import { ArrowBack, Check } from '@mui/icons-material'
import { unidadesMedidaApi } from '../services/api'

export default function NovoUnidadeMedidaPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    sigla: '',
    descricao: ''
  })

  useEffect(() => {
    if (isEditing) {
      loadUnidade()
    }
  }, [id])

  const loadUnidade = async () => {
    try {
      const response = await unidadesMedidaApi.buscar(Number(id))
      const unidade = response.data
      setForm({
        sigla: unidade.sigla,
        descricao: unidade.descricao || ''
      })
    } catch (error) {
      console.error('Erro ao carregar unidade:', error)
      setSnackbar({ open: true, message: 'Erro ao carregar unidade de medida', severity: 'error' })
    }
  }

  const handleSubmit = async () => {
    if (!form.sigla.trim()) {
      setSnackbar({ open: true, message: 'A sigla é obrigatória', severity: 'error' })
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        await unidadesMedidaApi.atualizar(Number(id), form)
        setSnackbar({ open: true, message: 'Unidade de medida atualizada!', severity: 'success' })
      } else {
        await unidadesMedidaApi.criar(form)
        setSnackbar({ open: true, message: 'Unidade de medida criada!', severity: 'success' })
      }

      setTimeout(() => navigate('/unidades-medida'), 1500)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao salvar', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
            Unidade de Medida
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
            {isEditing ? 'Atualize as informações da unidade' : 'Preencha os dados da nova unidade de medida'}
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                SIGLA *
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
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                DESCRICAO
              </Typography>
              <TextField
                fullWidth
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Quilograma, Unidade, Caixa"
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, py: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/unidades-medida')}
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
