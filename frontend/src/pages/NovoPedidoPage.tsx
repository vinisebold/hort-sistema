import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent,
  Autocomplete, Alert, Snackbar, Grid
} from '@mui/material'
import { Add, Delete, ArrowBack } from '@mui/icons-material'
import { pedidosApi, produtosApi, clientesApi, naturezasApi, formasPagamentoApi } from '../services/api'

interface ItemPedido {
  id?: number
  produtoId: number
  produtoDescricao?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

interface Produto {
  id: number
  codigo: string
  descricao: string
  unidadeMedida: { sigla: string }
  estoqueAtual: number
}

interface Cliente {
  id: number
  razaoSocial: string
  documento: string
}

interface NaturezaOperacao {
  id: number
  descricao: string
  tipoMovimento: string
}

interface FormaPagamento {
  id: number
  descricao: string
  exigeCliente: boolean
}

export default function NovoPedidoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    naturezaOperacaoId: '',
    clienteId: null as number | null,
    formaPagamentoId: '',
    documentoReferencia: '',
    statusPagamento: 'PAGO',
    itens: [] as ItemPedido[]
  })

  const [itemForm, setItemForm] = useState({
    produtoId: '',
    quantidade: '',
    valorUnitario: ''
  })

  useEffect(() => {
    Promise.all([
      loadProdutos(),
      loadClientes(),
      loadNaturezas(),
      loadFormasPagamento()
    ])
    if (isEditing) {
      loadPedido()
    }
  }, [id])

  const loadProdutos = async () => {
    try {
      const response = await produtosApi.listar()
      setProdutos(response.data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadClientes = async () => {
    try {
      const response = await clientesApi.listar()
      setClientes(response.data)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadNaturezas = async () => {
    try {
      const response = await naturezasApi.listar()
      setNaturezas(response.data)
    } catch (error) {
      console.error('Erro ao carregar naturezas:', error)
    }
  }

  const loadFormasPagamento = async () => {
    try {
      const response = await formasPagamentoApi.listar()
      setFormasPagamento(response.data)
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error)
    }
  }

  const loadPedido = async () => {
    try {
      const response = await pedidosApi.buscar(Number(id))
      const pedido = response.data
      setForm({
        naturezaOperacaoId: String(pedido.naturezaOperacaoId || pedido.naturezaOperacao?.id || ''),
        clienteId: pedido.clienteId,
        formaPagamentoId: String(pedido.formaPagamentoId || pedido.formaPagamento?.id || ''),
        documentoReferencia: pedido.documentoReferencia || '',
        statusPagamento: pedido.statusPagamento,
        itens: pedido.itens || []
      })
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      setSnackbar({ open: true, message: 'Erro ao carregar pedido', severity: 'error' })
    }
  }

  const handleAddItem = () => {
    if (!itemForm.produtoId || !itemForm.quantidade || !itemForm.valorUnitario) {
      setSnackbar({ open: true, message: 'Preencha todos os campos do item', severity: 'error' })
      return
    }

    const produto = produtos.find(p => p.id === Number(itemForm.produtoId))
    const quantidade = Number(itemForm.quantidade)
    const valorUnitario = Number(itemForm.valorUnitario)

    setForm(prev => ({
      ...prev,
      itens: [...prev.itens, {
        produtoId: Number(itemForm.produtoId),
        produtoDescricao: produto?.descricao,
        quantidade,
        valorUnitario,
        valorTotal: quantidade * valorUnitario
      }]
    }))

    setItemForm({ produtoId: '', quantidade: '', valorUnitario: '' })
  }

  const handleRemoveItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const calcularTotal = () => {
    return form.itens.reduce((sum, item) => sum + item.valorTotal, 0)
  }

  const handleSubmit = async () => {
    if (!form.naturezaOperacaoId || !form.formaPagamentoId || form.itens.length === 0) {
      setSnackbar({ open: true, message: 'Preencha todos os campos obrigatórios', severity: 'error' })
      return
    }

    const formaPgto = formasPagamento.find(f => f.id === Number(form.formaPagamentoId))
    if (formaPgto?.exigeCliente && !form.clienteId) {
      setSnackbar({ open: true, message: 'Esta forma de pagamento exige um cliente', severity: 'error' })
      return
    }

    setLoading(true)
    try {
      const payload = {
        naturezaOperacaoId: Number(form.naturezaOperacaoId),
        clienteId: form.clienteId,
        formaPagamentoId: Number(form.formaPagamentoId),
        documentoReferencia: form.documentoReferencia || null,
        statusPagamento: form.statusPagamento,
        itens: form.itens.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario
        }))
      }

      if (isEditing) {
        await pedidosApi.atualizar(Number(id), payload)
        setSnackbar({ open: true, message: 'Pedido atualizado com sucesso!', severity: 'success' })
      } else {
        await pedidosApi.criar(payload)
        setSnackbar({ open: true, message: 'Pedido criado com sucesso!', severity: 'success' })
      }

      setTimeout(() => navigate('/pedidos'), 1000)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao salvar pedido', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const selectedFormaPgto = formasPagamento.find(f => f.id === Number(form.formaPagamentoId))

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Totalizer Header - full width, flush under AppBar */}
      <Box
        sx={(theme) => ({
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          height: 120,
          bgcolor: (theme as any).palette.primary.main,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // shadow applied to this header so visual continuity with AppBar when AppBar has no shadow
          boxShadow: (theme as any).shadows[4],
          zIndex: (theme as any).zIndex.appBar - 1,
        })}
      >
        <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
          Total do Pedido
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
          R$ {calcularTotal().toFixed(2)}
        </Typography>
      </Box>

      {/* spacer so page content sits below the fixed header */}
      <Box sx={{ height: 120 }} />

      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Botão Voltar */}
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/pedidos')}
          sx={{ mb: 2 }}
        >
          Voltar
        </Button>

        {/* Seção 1: Dados Fiscais/Cliente */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dados do Pedido
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(option) => option.razaoSocial}
                  value={clientes.find(c => c.id === form.clienteId) || null}
                  onChange={(_, value) => setForm({ ...form, clienteId: value?.id || null })}
                  renderInput={(params) => (
                    <TextField {...params} label="Cliente" fullWidth />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.razaoSocial} {option.documento && `(${option.documento})`}
                    </li>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Natureza *</InputLabel>
                  <Select
                    value={form.naturezaOperacaoId}
                    label="Natureza *"
                    onChange={(e) => setForm({ ...form, naturezaOperacaoId: e.target.value })}
                  >
                    {naturezas.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.tipoMovimento === 'ENTRADA' ? '📥' : '📤'} {n.descricao}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status *</InputLabel>
                  <Select
                    value={form.statusPagamento}
                    label="Status *"
                    onChange={(e) => setForm({ ...form, statusPagamento: e.target.value })}
                  >
                    <MenuItem value="PAGO">Pago</MenuItem>
                    <MenuItem value="PENDENTE">Pendente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Forma de Pagamento *</InputLabel>
                  <Select
                    value={form.formaPagamentoId}
                    label="Forma de Pagamento *"
                    onChange={(e) => setForm({ ...form, formaPagamentoId: e.target.value })}
                  >
                    {formasPagamento.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.descricao} {f.exigeCliente && '(Exige cliente)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Documento Referência"
                  value={form.documentoReferencia}
                  onChange={(e) => setForm({ ...form, documentoReferencia: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Data de Emissão"
                  value={new Date().toLocaleDateString('pt-BR')}
                  fullWidth
                  disabled
                />
              </Grid>
            </Grid>

            {selectedFormaPgto?.exigeCliente && !form.clienteId && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Esta forma de pagamento exige um cliente
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Seção 2: Inserção de Itens */}
        <Card sx={{ mb: 3, bgcolor: '#f9f9f9' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Adicionar Itens
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 300, flex: 1 }}>
                <InputLabel>Produto</InputLabel>
                <Select
                  value={itemForm.produtoId}
                  label="Produto"
                  onChange={(e) => setItemForm({ ...itemForm, produtoId: e.target.value })}
                >
                  {produtos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.codigo} - {p.descricao} (Est: {p.estoqueAtual} {p.unidadeMedida?.sigla})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Quantidade"
                type="number"
                value={itemForm.quantidade}
                onChange={(e) => setItemForm({ ...itemForm, quantidade: e.target.value })}
                sx={{ width: 140 }}
                inputProps={{ min: 0, step: 0.001 }}
              />

              <TextField
                label="Valor Unit."
                type="number"
                value={itemForm.valorUnitario}
                onChange={(e) => setItemForm({ ...itemForm, valorUnitario: e.target.value })}
                sx={{ width: 140 }}
                inputProps={{ min: 0, step: 0.01 }}
              />

              <Button 
                variant="contained" 
                onClick={handleAddItem} 
                startIcon={<Add />}
                sx={{ minWidth: 140 }}
              >
                Adicionar
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Seção 3: Lista de Itens */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Itens do Pedido
            </Typography>

            {form.itens.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Qtd</TableCell>
                      <TableCell align="right">Vl. Unit</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.produtoDescricao}</TableCell>
                        <TableCell align="right">{item.quantidade}</TableCell>
                        <TableCell align="right">R$ {item.valorUnitario.toFixed(2)}</TableCell>
                        <TableCell align="right">R$ {item.valorTotal.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleRemoveItem(index)} color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right"><strong>TOTAL:</strong></TableCell>
                      <TableCell align="right"><strong>R$ {calcularTotal().toFixed(2)}</strong></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                Adicione pelo menos um item ao pedido
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Footer: Ações Finais */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 3, 
          py: 2,
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate('/pedidos')}
          >
            Voltar
          </Button>
          <Button 
            variant="contained" 
            size="large"
            onClick={handleSubmit}
            disabled={loading || form.itens.length === 0}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Pedido' : 'Finalizar Pedido'}
          </Button>
        </Box>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
