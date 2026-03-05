import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Button, TextField, Card, CardContent,
  CircularProgress, Fab, Grid, ToggleButton, ToggleButtonGroup,
  FormControlLabel, Checkbox
} from '@mui/material'
import { ArrowBack, Check } from '@mui/icons-material'
import { naturezasApi } from '../services/api'
import { NaturezaOperacao } from '../types'
import { useToast } from '../contexts/ToastContext'

export default function NovoNaturezaOperacaoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { showToast } = useToast()

  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    descricao: '',
    tipoMovimento: 'SAIDA' as 'ENTRADA' | 'SAIDA',
    exigeCliente: true,
    exigeValorUnitario: true,
    exigeStatus: true
  })

  useEffect(() => {
    if (isEditing) {
      loadNatureza()
    }
  }, [id])

  const loadNatureza = async () => {
    try {
      const response = await naturezasApi.buscar(Number(id))
      const natureza: NaturezaOperacao = response.data
      setForm({
        descricao: natureza.descricao,
        tipoMovimento: natureza.tipoMovimento,
        exigeCliente: natureza.exigeCliente,
        exigeValorUnitario: natureza.exigeValorUnitario,
        exigeStatus: natureza.exigeStatus
      })
    } catch (error) {
      console.error('Erro ao carregar natureza:', error)
      showToast('Erro ao carregar natureza de operação', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!form.descricao.trim()) {
      showToast('A descrição é obrigatória', 'error')
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        await naturezasApi.atualizar(Number(id), form)
        showToast('Natureza de operação atualizada!', 'success')
      } else {
        await naturezasApi.criar(form)
        showToast('Natureza de operação criada!', 'success')
      }

      navigate('/naturezas-operacao')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao salvar', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
            Natureza de Operacao
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
            {isEditing ? 'Atualize as regras da natureza de operação' : 'Defina as regras da nova natureza de operação'}
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
                required
                placeholder="Ex: Venda, Compra, Devolução"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                TIPO DE MOVIMENTO
              </Typography>
              <ToggleButtonGroup
                value={form.tipoMovimento}
                exclusive
                onChange={(_, value) => value && setForm({ ...form, tipoMovimento: value })}
                fullWidth
                size="small"
                sx={{
                  height: 40,
                  '& .MuiToggleButton-root': {
                    border: '1px solid #ddd',
                    '&.Mui-selected': {
                      bgcolor: form.tipoMovimento === 'ENTRADA' ? '#e8f5e9' : '#fff3e0',
                      color: form.tipoMovimento === 'ENTRADA' ? '#2e7d32' : '#ed6c02',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: form.tipoMovimento === 'ENTRADA' ? '#c8e6c9' : '#ffe0b2',
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="ENTRADA">ENTRADA</ToggleButton>
                <ToggleButton value="SAIDA">SAIDA</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
              CAMPOS OBRIGATORIOS
            </Typography>
            <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1.5, fontStyle: 'italic', ml: 0.5 }}>
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
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, py: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/naturezas-operacao')}
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
