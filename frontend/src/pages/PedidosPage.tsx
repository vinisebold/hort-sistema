import { useEffect, useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, Divider, Card, CardContent,
  Autocomplete, Alert, Snackbar
} from '@mui/material'
import { Add, Delete, Visibility, ShoppingCart, TrendingUp, TrendingDown } from '@mui/icons-material'
import { pedidosApi, produtosApi, clientesApi, naturezasApi, formasPagamentoApi } from '../services/api'

interface Pedido {
  id: number
  naturezaOperacao: string
  clienteNome: string
  formaPagamento: string
  documentoReferencia: string
  valorTotal: number
  statusPagamento: string
  dataEmissao: string
  itens: ItemPedido[]
}

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

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  
  const [open, setOpen] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
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
    loadPedidos()
    loadProdutos()
    loadClientes()
    loadNaturezas()
    loadFormasPagamento()
  }, [])

  const loadPedidos = async () => {
    try {
      const response = await pedidosApi.listar()
      setPedidos(response.data)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    }
  }

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

  const handleOpen = () => {
    setForm({
      naturezaOperacaoId: '',
      clienteId: null,
      formaPagamentoId: '',
      documentoReferencia: '',
      statusPagamento: 'PAGO',
      itens: []
    })
    setItemForm({ produtoId: '', quantidade: '', valorUnitario: '' })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
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

    try {
      await pedidosApi.criar({
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
      })
      
      setSnackbar({ open: true, message: 'Pedido criado com sucesso!', severity: 'success' })
      handleClose()
      loadPedidos()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erro ao criar pedido', severity: 'error' })
    }
  }

  const handleView = async (id: number) => {
    try {
      const response = await pedidosApi.buscar(id)
      setSelectedPedido(response.data)
      setOpenView(true)
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
    }
  }

  const getNaturezaChip = (tipo: string) => {
    const natureza = naturezas.find(n => n.descricao === tipo)
    if (natureza?.tipoMovimento === 'ENTRADA') {
      return <Chip icon={<TrendingUp />} label={tipo} color="success" size="small" />
    }
    return <Chip icon={<TrendingDown />} label={tipo} color="warning" size="small" />
  }

  const selectedFormaPgto = formasPagamento.find(f => f.id === Number(form.formaPagamentoId))

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Pedidos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
          Novo Pedido
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Natureza</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Forma Pgto</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell>#{pedido.id}</TableCell>
                <TableCell>{new Date(pedido.dataEmissao).toLocaleString('pt-BR')}</TableCell>
                <TableCell>{getNaturezaChip(pedido.naturezaOperacao)}</TableCell>
                <TableCell>{pedido.clienteNome}</TableCell>
                <TableCell>{pedido.formaPagamento}</TableCell>
                <TableCell align="right">R$ {pedido.valorTotal.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={pedido.statusPagamento} 
                    color={pedido.statusPagamento === 'PAGO' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleView(pedido.id)}>
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Novo Pedido */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>Novo Pedido</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
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

            <Autocomplete
              sx={{ minWidth: 250 }}
              options={clientes}
              getOptionLabel={(option) => option.razaoSocial}
              onChange={(_, value) => setForm({ ...form, clienteId: value?.id || null })}
              renderInput={(params) => (
                <TextField {...params} label="Cliente" size="medium" />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.razaoSocial} {option.documento && `(${option.documento})`}
                </li>
              )}
            />

            <FormControl sx={{ minWidth: 200 }}>
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

            <FormControl sx={{ minWidth: 150 }}>
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

            <TextField
              label="Documento Referência"
              value={form.documentoReferencia}
              onChange={(e) => setForm({ ...form, documentoReferencia: e.target.value })}
              sx={{ minWidth: 200 }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Itens do Pedido</Typography>

          {/* Adicionar Item */}
          <Card sx={{ mb: 2, bgcolor: '#f9f9f9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 300 }}>
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
                  sx={{ width: 120 }}
                  inputProps={{ min: 0, step: 0.001 }}
                />

                <TextField
                  label="Valor Unit."
                  type="number"
                  value={itemForm.valorUnitario}
                  onChange={(e) => setItemForm({ ...itemForm, valorUnitario: e.target.value })}
                  sx={{ width: 120 }}
                  inputProps={{ min: 0, step: 0.01 }}
                />

                <Button variant="contained" onClick={handleAddItem} startIcon={<Add />}>
                  Adicionar
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Lista de Itens */}
          {form.itens.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Qtd</TableCell>
                  <TableCell align="right">Valor Unit.</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.itens.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.produtoDescricao}</TableCell>
                    <TableCell align="right">{item.quantidade}</TableCell>
                    <TableCell align="right">R$ {item.valorUnitario.toFixed(2)}</TableCell>
                    <TableCell align="right">R$ {item.valorTotal.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right"><strong>TOTAL:</strong></TableCell>
                  <TableCell align="right"><strong>R$ {calcularTotal().toFixed(2)}</strong></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {form.itens.length === 0 && (
            <Alert severity="info">Adicione pelo menos um item ao pedido</Alert>
          )}

          {selectedFormaPgto?.exigeCliente && !form.clienteId && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Esta forma de pagamento exige que um cliente seja selecionado
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<ShoppingCart />}>
            Finalizar Pedido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualizar Pedido */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pedido #{selectedPedido?.id}</DialogTitle>
        <DialogContent>
          {selectedPedido && (
            <Box>
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Data</Typography>
                  <Typography>{new Date(selectedPedido.dataEmissao).toLocaleString('pt-BR')}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Natureza</Typography>
                  {getNaturezaChip(selectedPedido.naturezaOperacao)}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Cliente</Typography>
                  <Typography>{selectedPedido.clienteNome}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Forma de Pagamento</Typography>
                  <Typography>{selectedPedido.formaPagamento}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedPedido.statusPagamento} 
                    color={selectedPedido.statusPagamento === 'PAGO' ? 'success' : 'warning'} 
                  />
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>Itens</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell align="right">Qtd</TableCell>
                    <TableCell align="right">Valor Unit.</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPedido.itens?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.produtoDescricao}</TableCell>
                      <TableCell align="right">{item.quantidade}</TableCell>
                      <TableCell align="right">R$ {item.valorUnitario.toFixed(2)}</TableCell>
                      <TableCell align="right">R$ {item.valorTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right"><strong>TOTAL:</strong></TableCell>
                    <TableCell align="right"><strong>R$ {selectedPedido.valorTotal.toFixed(2)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

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
