import { useEffect, useState } from 'react'
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Fab, InputAdornment, CircularProgress } from '@mui/material'
import { Add, Edit, Delete, Search } from '@mui/icons-material'
import { clientesApi } from '../services/api'

interface Cliente {
  id: number
  tipoPessoa: string
  documento: string
  razaoSocial: string
  nomeFantasia: string
  endereco: string
  telefone: string
  isActive: boolean
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [open, setOpen] = useState(false)
  const [openCnpj, setOpenCnpj] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [cnpjBusca, setCnpjBusca] = useState('')
  const [loadingCnpj, setLoadingCnpj] = useState(false)
  const [form, setForm] = useState({
    tipoPessoa: 'JURIDICA',
    documento: '',
    razaoSocial: '',
    nomeFantasia: '',
    endereco: '',
    telefone: '',
  })

  useEffect(() => {
    loadClientes().catch(console.error)
  }, [])

  const loadClientes = async () => {
    try {
      const response = await clientesApi.listar()
      setClientes(response.data)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleOpen = (cliente?: Cliente) => {
    if (cliente) {
      setEditingId(cliente.id)
      setForm({
        tipoPessoa: cliente.tipoPessoa,
        documento: cliente.documento || '',
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia || '',
        endereco: cliente.endereco || '',
        telefone: cliente.telefone || '',
      })
    } else {
      setEditingId(null)
      setForm({
        tipoPessoa: 'JURIDICA',
        documento: '',
        razaoSocial: '',
        nomeFantasia: '',
        endereco: '',
        telefone: '',
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
      const data = { ...form }
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

  const handleBuscarCnpj = async () => {
    try {
      setLoadingCnpj(true)
      const response = await clientesApi.consultarCnpj(cnpjBusca)
      setForm({
        ...form,
        tipoPessoa: 'JURIDICA',
        documento: response.data.cnpj,
        razaoSocial: response.data.razaoSocial || '',
        nomeFantasia: response.data.nomeFantasia || '',
        endereco: response.data.endereco || '',
        telefone: response.data.telefone || '',
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
          documento: response.data.cnpj,
          razaoSocial: response.data.razaoSocial || '',
          nomeFantasia: response.data.nomeFantasia || '',
          endereco: response.data.endereco || '',
          telefone: response.data.telefone || '',
        })
      } catch (error: any) {
        console.log('CNPJ não encontrado ou erro na consulta')
      } finally {
        setLoadingCnpj(false)
      }
    }
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome/Razão Social</TableCell>
              <TableCell>Nome Fantasia</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>{cliente.razaoSocial}</TableCell>
                <TableCell>{cliente.nomeFantasia || '-'}</TableCell>
                <TableCell>{cliente.documento || '-'}</TableCell>
                <TableCell>{cliente.telefone || '-'}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(cliente)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(cliente.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>

      {/* Dialog Cliente */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Pessoa</InputLabel>
            <Select
              value={form.tipoPessoa}
              label="Tipo de Pessoa"
              onChange={(e) => setForm({ ...form, tipoPessoa: e.target.value })}
            >
              <MenuItem value="FISICA">Pessoa Física</MenuItem>
              <MenuItem value="JURIDICA">Pessoa Jurídica</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            
            label={form.tipoPessoa === 'JURIDICA' ? 'CNPJ' : 'CPF'}
            value={form.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
            onBlur={(e) => form.tipoPessoa === 'JURIDICA' && handleBuscarCnpjInput(e.target.value)}
            margin="normal"
            disabled={loadingCnpj}
            InputProps={{
              endAdornment: form.tipoPessoa === 'JURIDICA' && (
                <InputAdornment position="end">
                  {loadingCnpj ? <CircularProgress size={24} /> : <IconButton onClick={() => handleBuscarCnpjInput(form.documento)}><Search /></IconButton>}
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            
            label={form.tipoPessoa === 'JURIDICA' ? 'Razão Social' : 'Nome'}
            value={form.razaoSocial}
            onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            
            label="Nome Fantasia"
            value={form.nomeFantasia}
            onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            
            label="Endereço"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
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
          <Button onClick={handleBuscarCnpj} variant="contained">Buscar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
