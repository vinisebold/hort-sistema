import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Fab, CircularProgress, Card, CardContent, Typography, Chip } from '@mui/material'
import { Add, Edit, Delete, Visibility } from '@mui/icons-material'
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
  const [totalClientes, setTotalClientes] = useState(0)
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    loadClientes().catch(console.error)
  }, [])

  const loadClientes = async () => {
    try {
      const response = await clientesApi.listar()
      const payload = response.data
      const data = Array.isArray(payload) ? payload : (payload.data ?? [])
      const total = Array.isArray(payload) ? data.length : (payload.totalCount ?? data.length)
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setClientes(data)
      setTotalClientes(Number(total))
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
      const total = Array.isArray(payload) ? clientes.length + data.length : (payload.totalCount ?? clientes.length + data.length)
      const nc = Array.isArray(payload) ? null : payload.nextCursor
      const hn = Array.isArray(payload) ? false : payload.hasNext
      setClientes((prev) => [...prev, ...data])
      setTotalClientes(Number(total))
      setNextCursor(nc ?? null)
      setHasNext(hn)
    } catch (error) {
      console.error('Erro ao carregar mais clientes:', error)
    } finally {
      setLoadingMore(false)
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
                      <IconButton onClick={() => navigate(`/clientes/${cliente.id}/editar`)} title="Editar" size="small">
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
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ color: '#555', fontSize: '0.95rem' }}>
              Exibindo {clientes.length} de {totalClientes}
            </Typography>
          </Box>
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
        onClick={() => navigate('/clientes/novo')}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <Add />
      </Fab>
    </Box>
  )
}
