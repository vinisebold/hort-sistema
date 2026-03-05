import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, Fab, InputAdornment, CircularProgress, Card, CardContent, Typography, Chip } from '@mui/material'
import { Add, Edit, Delete, Search, Visibility } from '@mui/icons-material'
import { clientesApi } from '../services/api'

interface Cliente {
  id: number
  tipoPessoa: string
  documento: string
  razaoSocial: string
  nomeFantasia: string
  endereco: string
  contato: string
  isActive: boolean
}

export default function ClientesPage() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [open, setOpen] = useState(false)
  const [openCnpj, setOpenCnpj] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [cnpjBusca, setCnpjBusca] = useState('')
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
    loadClientes().catch(console.error)
  }, [])

  const loadClientes = async () => {
    try {
      const response = await clientesApi.listar()
      const payload = response.data
      const data = Array.isArray(payload) ? payload : (payload.data ?? [])
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setClientes(data)
      setNextCursor(nc ?? null)
      setHasNext(hn)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadMore = async () => {
    if (!hasNext || loadingMore || nextCursor == null) return
    setLoadingMore(true)
    try {
      const response = await clientesApi.listar(nextCursor)
      const payload = response.data
      const data = Array.isArray(payload) ? payload : (payload.data ?? [])
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setClientes((prev) => [...prev, ...data])
      setNextCursor(nc ?? null)
      setHasNext(hn)
    } catch (error) {
      console.error('Erro ao carregar mais clientes:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleOpen = (cliente?: Cliente) => {
    if (cliente) {
      setEditingId(cliente.id)
      // Formata documento para exibição no formulário
      const documentoFormatado = exibirDocumento(cliente.documento, cliente.tipoPessoa)
      setForm({
        tipoPessoa: cliente.tipoPessoa,
        documento: documentoFormatado === '-' ? '' : documentoFormatado,
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia || '',
        endereco: cliente.endereco || '',
        contato: cliente.contato || '',
      })
    } else {
      setEditingId(null)
      setForm({
        tipoPessoa: 'FISICA',
        documento: '',
        razaoSocial: '',
        nomeFantasia: '',
        endereco: '',
        contato: '',
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    try {
      // Remove formatação antes de enviar
      const documentoSemFormatacao = form.documento.replace(/\D/g, '')
      const data = { 
        ...form,
        documento: documentoSemFormatacao || null
      }
      if (editingId) {
        await clientesApi.atualizar(editingId, data)
      } else {
        await clientesApi.criar(data)
      }
      handleClose()
      await loadClientes()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao salvar cliente')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await clientesApi.deletar(id)
        await loadClientes()
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erro ao excluir cliente')
      }
    }
  }

  const handleVerDetalhes = (clienteId: number) => {
    navigate(`/clientes/${clienteId}`)
  }

   const handleBuscarCnpj = async () => {
     try {
       setLoadingCnpj(true)
       const response = await clientesApi.consultarCnpj(cnpjBusca)
       setForm({
         ...form,
         tipoPessoa: 'JURIDICA',
         documento: formatarCnpj(response.data.cnpj),
         razaoSocial: response.data.razaoSocial || '',
         nomeFantasia: response.data.nomeFantasia || '',
         endereco: response.data.endereco || '',
         contato: response.data.telefone || '',
       })
       setOpenCnpj(false)
     } catch (error: any) {
       alert(error.response?.data?.message || 'Erro ao consultar CNPJ')
     } finally {
       setLoadingCnpj(false)
     }
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
    
    // Se chegou aos 11 dígitos, formata automaticamente
    if (apenasNumeros.length === 11) {
      setForm({ ...form, documento: formatarCpf(valor) })
    } else {
      setForm({ ...form, documento: valor })
    }
  }

   const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const valor = e.target.value
     const apenasNumeros = valor.replace(/\D/g, '')
     
     // Formata em tempo real conforme digita
     let valorFormatado = apenasNumeros
     if (apenasNumeros.length >= 14) {
       valorFormatado = formatarCnpj(apenasNumeros.substring(0, 14))
       // Dispara busca automaticamente ao completar 14 dígitos
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

  const isCampoDocumentoObrigatorio = form.tipoPessoa === 'JURIDICA'
  const isCampoContatoObrigatorio = form.tipoPessoa === 'JURIDICA'

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Clientes
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Gerencie seus clientes e acompanhe o histórico financeiro
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Cliente
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 200 }}>
                    Tipo
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 180 }}>
                    Contato
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 150 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow 
                    key={cliente.id}
                    sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
                          {cliente.razaoSocial}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {cliente.nomeFantasia && (
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {cliente.nomeFantasia}
                            </Typography>
                          )}
                          {cliente.nomeFantasia && cliente.documento && (
                            <Typography variant="caption" sx={{ color: '#ddd' }}>•</Typography>
                          )}
                          {cliente.documento && (
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {exibirDocumento(cliente.documento, cliente.tipoPessoa)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.tipoPessoa === 'JURIDICA' ? 'Pessoa Jurídica' : 'Pessoa Física'} 
                        size="small" 
                        sx={{ 
                          fontSize: '0.75rem',
                          bgcolor: cliente.tipoPessoa === 'JURIDICA' ? '#e3f2fd' : '#f3e5f5',
                          color: cliente.tipoPessoa === 'JURIDICA' ? '#1565c0' : '#6a1b9a',
                          border: 'none'
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#555' }}>
                        {cliente.contato || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleVerDetalhes(cliente.id)} title="Ver detalhes e gerenciar dívida" size="small">
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={() => handleOpen(cliente)} title="Editar" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cliente.id)} title="Excluir" size="small">
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

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpen()}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <Add />
      </Fab>

      {/* Dialog Cliente */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 300, color: '#333' }}>
            {editingId ? 'Editar Cliente' : 'Novo Cliente'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Tipo de Pessoa *
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={form.tipoPessoa}
                onChange={(e) => setForm({ ...form, tipoPessoa: e.target.value })}
              >
                <MenuItem value="FISICA">Pessoa Física</MenuItem>
                <MenuItem value="JURIDICA">Pessoa Jurídica</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Campo Documento (CPF/CNPJ) */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
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
          </Box>

          {/* Campo Nome/Razão Social */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              {form.tipoPessoa === 'JURIDICA' ? 'Razão Social' : 'Nome'} *
            </Typography>
            <TextField
              fullWidth
              value={form.razaoSocial}
              onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
              required
              size="small"
            />
          </Box>

          {/* Campo Nome Fantasia - Apenas para PJ */}
          {form.tipoPessoa === 'JURIDICA' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                Nome Fantasia
              </Typography>
              <TextField
                fullWidth
                value={form.nomeFantasia}
                onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                size="small"
              />
            </Box>
          )}

          {/* Campo Endereço - Apenas para PJ */}
          {form.tipoPessoa === 'JURIDICA' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                Endereço
              </Typography>
              <TextField
                fullWidth
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                size="small"
              />
            </Box>
          )}

          {/* Campo Contato */}
          <Box>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              Contato {isCampoContatoObrigatorio && '*'}
            </Typography>
            <TextField
              fullWidth
              value={form.contato}
              onChange={(e) => setForm({ ...form, contato: e.target.value })}
              required={isCampoContatoObrigatorio}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Consultar CNPJ */}
      <Dialog open={openCnpj} onClose={() => setOpenCnpj(false)}>
        <DialogTitle>Consultar CNPJ</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="CNPJ"
            value={cnpjBusca}
            onChange={(e) => setCnpjBusca(e.target.value)}
            margin="normal"
            placeholder="00.000.000/0001-00"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCnpj(false)}>Cancelar</Button>
          <Button onClick={handleBuscarCnpj} variant="contained">
            Buscar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
