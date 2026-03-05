import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Button, TextField, Card, CardContent,
  Alert, Snackbar, InputAdornment, IconButton, CircularProgress, Fab, ToggleButton, ToggleButtonGroup, Grid
} from '@mui/material'
import { ArrowBack, Search, Check } from '@mui/icons-material'
import { clientesApi } from '../services/api'

export default function NovoClientePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [loading, setLoading] = useState(false)
  const [loadingCnpj, setLoadingCnpj] = useState(false)

  const [form, setForm] = useState({
    tipoPessoa: 'FISICA',
    documento: '',
    razaoSocial: '',
    nomeFantasia: '',
    endereco: '',
    contato: '',
  })

  useEffect(() => {
    if (isEditing) {
      loadCliente()
    }
  }, [id])

  const loadCliente = async () => {
    try {
      const response = await clientesApi.buscar(Number(id))
      const cliente = response.data
      const documentoFormatado = exibirDocumento(cliente.documento, cliente.tipoPessoa)
      setForm({
        tipoPessoa: cliente.tipoPessoa,
        documento: documentoFormatado === '-' ? '' : documentoFormatado,
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia || '',
        endereco: cliente.endereco || '',
        contato: cliente.contato || '',
      })
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      setSnackbar({ open: true, message: 'Erro ao carregar cliente', severity: 'error' })
    }
  }

  const formatarCpf = (cpf: string): string => {
    const apenasNumeros = cpf.replace(/\D/g, '')
    if (apenasNumeros.length !== 11) {
      return apenasNumeros
    }
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatarCnpj = (cnpj: string): string => {
    const apenasNumeros = cnpj.replace(/\D/g, '')
    if (apenasNumeros.length !== 14) {
      return apenasNumeros
    }
    return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const exibirDocumento = (documento: string, tipoPessoa: string): string => {
    if (!documento) return '-'
    if (tipoPessoa === 'JURIDICA') {
      return formatarCnpj(documento)
    }
    return formatarCpf(documento)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const apenasNumeros = valor.replace(/\D/g, '')
    
    if (apenasNumeros.length === 11) {
      setForm({ ...form, documento: formatarCpf(valor) })
    } else {
      setForm({ ...form, documento: valor })
    }
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const apenasNumeros = valor.replace(/\D/g, '')
    
    let valorFormatado = apenasNumeros
    if (apenasNumeros.length >= 14) {
      valorFormatado = formatarCnpj(apenasNumeros.substring(0, 14))
      handleBuscarCnpjInput(apenasNumeros.substring(0, 14))
    } else if (apenasNumeros.length > 12) {
      valorFormatado = apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
    } else if (apenasNumeros.length > 8) {
      valorFormatado = apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
    } else if (apenasNumeros.length > 5) {
      valorFormatado = apenasNumeros.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
    } else if (apenasNumeros.length > 2) {
      valorFormatado = apenasNumeros.replace(/(\d{2})(\d{0,3})/, '$1.$2')
    }
    
    setForm({ ...form, documento: valorFormatado })
  }

  const handleBuscarCnpjInput = async (documento: string) => {
    const cnpjOnly = documento.replace(/\D/g, '')
    if (cnpjOnly.length === 14) {
      try {
        setLoadingCnpj(true)
        const response = await clientesApi.consultarCnpj(cnpjOnly)
        setForm({
          ...form,
          tipoPessoa: 'JURIDICA',
          documento: formatarCnpj(response.data.cnpj),
          razaoSocial: response.data.razaoSocial || '',
          nomeFantasia: response.data.nomeFantasia || '',
          endereco: response.data.endereco || '',
          contato: response.data.telefone || '',
        })
      } catch (error: any) {
        console.log('CNPJ não encontrado ou erro na consulta')
      } finally {
        setLoadingCnpj(false)
      }
    }
  }

  const handleSubmit = async () => {
    if (!form.razaoSocial) {
      setSnackbar({ open: true, message: 'Preencha o campo Nome/Razão Social', severity: 'error' })
      return
    }

    if (form.tipoPessoa === 'JURIDICA' && !form.documento) {
      setSnackbar({ open: true, message: 'CNPJ é obrigatório para Pessoa Jurídica', severity: 'error' })
      return
    }

    if (form.tipoPessoa === 'JURIDICA' && !form.contato) {
      setSnackbar({ open: true, message: 'Contato é obrigatório para Pessoa Jurídica', severity: 'error' })
      return
    }

    setLoading(true)
    try {
      const documentoSemFormatacao = form.documento.replace(/\D/g, '')
      const data = { 
        ...form,
        documento: documentoSemFormatacao || null
      }

      if (isEditing) {
        await clientesApi.atualizar(Number(id), data)
      } else {
        await clientesApi.criar(data)
      }

      navigate('/clientes')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao salvar cliente', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const isCampoDocumentoObrigatorio = form.tipoPessoa === 'JURIDICA'
  const isCampoContatoObrigatorio = form.tipoPessoa === 'JURIDICA'

  return (
    <Box>

      {/* Card do Formulário */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
            Cliente
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
            {isEditing ? 'Atualize as informações do cliente' : 'Preencha os dados do novo cliente'}
          </Typography>

          {/* Documento (CPF/CNPJ) + Tipo de Pessoa */}
          <Grid container spacing={3} sx={{ mb: 3 }} alignItems="flex-end">
            <Grid item xs={12} md={7}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                {form.tipoPessoa === 'JURIDICA' ? 'CNPJ' : 'CPF'} {isCampoDocumentoObrigatorio && '*'}
              </Typography>
              <TextField
                fullWidth
                value={form.documento}
                onChange={form.tipoPessoa === 'FISICA' ? handleCpfChange : handleCnpjChange}
                onBlur={(e) => form.tipoPessoa === 'JURIDICA' && handleBuscarCnpjInput(e.target.value)}
                disabled={loadingCnpj}
                required={isCampoDocumentoObrigatorio}
                placeholder={form.tipoPessoa === 'JURIDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                size="small"
                InputProps={{
                  endAdornment:
                    form.tipoPessoa === 'JURIDICA' ? (
                      <InputAdornment position="end">
                        {loadingCnpj ? (
                          <CircularProgress size={24} />
                        ) : (
                          <IconButton onClick={() => handleBuscarCnpjInput(form.documento)}>
                            <Search />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                  TIPO DE PESSOA
                </Typography>
                <ToggleButtonGroup
                  value={form.tipoPessoa}
                  exclusive
                  onChange={(_, value) => value && setForm({ ...form, tipoPessoa: value })}
                  fullWidth
                  size="small"
                  sx={{
                    height: 40,
                    '& .MuiToggleButton-root': {
                      border: '1px solid #ddd',
                      '&.Mui-selected': {
                        bgcolor: form.tipoPessoa === 'JURIDICA' ? '#e3f2fd' : '#f3e5f5',
                        color: form.tipoPessoa === 'JURIDICA' ? '#1565c0' : '#6a1b9a',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: form.tipoPessoa === 'JURIDICA' ? '#cfe3fb' : '#e8d7f2',
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton value="FISICA">FISICA</ToggleButton>
                  <ToggleButton value="JURIDICA">JURIDICA</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>

          {/* Nome/Razão Social */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
              {form.tipoPessoa === 'JURIDICA' ? 'Razão Social' : 'Nome'} *
            </Typography>
            <TextField
              fullWidth
              value={form.razaoSocial}
              onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
              required
              size="small"
              placeholder={form.tipoPessoa === 'JURIDICA' ? 'Ex: Empresa LTDA' : 'Ex: João da Silva'}
            />
          </Box>

          {/* Nome Fantasia - Apenas para PJ */}
          {form.tipoPessoa === 'JURIDICA' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                Nome Fantasia
              </Typography>
              <TextField
                fullWidth
                value={form.nomeFantasia}
                onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                size="small"
                placeholder="Ex: Loja XYZ"
              />
            </Box>
          )}

          {/* Endereço - Apenas para PJ */}
          {form.tipoPessoa === 'JURIDICA' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
                Endereço
              </Typography>
              <TextField
                fullWidth
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                size="small"
                placeholder="Ex: Rua ABC, 123 - Centro"
              />
            </Box>
          )}

          {/* Contato */}
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5 }}>
              Contato {isCampoContatoObrigatorio && '*'}
            </Typography>
            <TextField
              fullWidth
              value={form.contato}
              onChange={(e) => setForm({ ...form, contato: e.target.value })}
              required={isCampoContatoObrigatorio}
              size="small"
              placeholder="Ex: (11) 98765-4321"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Footer: Ações Finais */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, py: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/clientes')}
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

      {/* Snackbar de feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
