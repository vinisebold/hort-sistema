import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent,
  Autocomplete, Alert, Snackbar, Grid
} from '@mui/material'
import { ArrowBack, Close, InfoOutlined, EditOutlined } from '@mui/icons-material'
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
    itens: [{ produtoId: 0, produtoDescricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }] as ItemPedido[]
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
        itens: pedido.itens.length > 0 ? pedido.itens : [{ produtoId: 0, produtoDescricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]
      })
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      setSnackbar({ open: true, message: 'Erro ao carregar pedido', severity: 'error' })
    }
  }

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      itens: [...prev.itens, {
        produtoId: 0,
        produtoDescricao: '',
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0
      }]
    }))
    
    // Focus the new product field
    setTimeout(() => {
      const productInputs = document.querySelectorAll('.product-autocomplete input')
      const lastInput = productInputs[productInputs.length - 1] as HTMLInputElement
      if (lastInput) lastInput.focus()
    }, 50)
  }

  const handleUpdateItem = (index: number, field: keyof ItemPedido, value: any) => {
    const newItens = [...form.itens]
    const item = { ...newItens[index] }

    if (field === 'produtoId') {
      const produto = produtos.find(p => p.id === value)
      item.produtoId = value
      item.produtoDescricao = produto?.descricao || ''
      // if (item.valorUnitario === 0) { // Opcional: preencher valor unitário se estiver zerado
      //   item.valorUnitario = 0 
      // }
      
      // Auto-focus quantity field after product selection
      setTimeout(() => {
        const qtyInputs = document.querySelectorAll('input[type="number"]')
        const targetInput = qtyInputs[index * 2] as HTMLInputElement // index * 2 because we have Qty and Price
        if (targetInput) targetInput.focus()
      }, 50)
    } else {
      (item as any)[field] = value
    }

    item.valorTotal = (item.quantidade || 0) * (item.valorUnitario || 0)
    newItens[index] = item
    setForm({ ...form, itens: newItens })
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
        itens: form.itens
          .filter(item => item.produtoId !== 0 && item.quantidade > 0)
          .map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario
          }))
      }

      if (payload.itens.length === 0) {
        setSnackbar({ open: true, message: 'Adicione pelo menos um produto válido', severity: 'error' })
        setLoading(false)
        return
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
          R$ {calcularTotal().toFixed(2).replace('.', ',')}
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
                    <TextField {...params}  label="Cliente" fullWidth />
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

        {/* Seção 2: Itens do Pedido */}
        <Card sx={{ mb: 3 }}><CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, color: '#333' }}>
            Produtos
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, color: '#888' }}>
            <InfoOutlined fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">
              Para a correta leitura do código de barras, certifique-se de que nenhum campo esteja selecionado.
            </Typography>
          </Box>

          <TableContainer sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: '1px solid #ddd' } }}>
                  <TableCell width="5%" align="center" sx={{ borderBottom: '1px solid #ddd' }}></TableCell>
                  <TableCell width="45%" sx={{ fontWeight: 600, color: '#333', borderBottom: '1px solid #ddd' }}>Produto</TableCell>
                  <TableCell width="15%" align="right" sx={{ fontWeight: 600, color: '#333', borderBottom: '1px solid #ddd' }}>Quantidade</TableCell>
                  <TableCell width="15%" align="right" sx={{ fontWeight: 600, color: '#333', borderBottom: '1px solid #ddd' }}>Preço</TableCell>
                  <TableCell width="15%" align="right" sx={{ fontWeight: 600, color: '#333', borderBottom: '1px solid #ddd' }}>Total</TableCell>
                  <TableCell width="5%" align="center" sx={{ borderBottom: '1px solid #ddd' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.itens.map((item, index) => {
                  const produto = produtos.find(p => p.id === item.produtoId);
                  return (
                    <TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    position: 'relative',
    '&:hover': { 
      bgcolor: '#e8eceb',
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd', position: 'relative', p: 0, height: '64px' } 
  }}>
                      <TableCell align="center" sx={{ color: '#555', px: 2 }}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        {item.produtoId === 0 ? (
                          <Box className="hover-input" sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      transition: 'all 0.2s', 
      px: 2,
      py: 1,
      height: '100%',
      ml: 0,
      borderBottom: '2px solid transparent',
      '&:focus-within': {
        position: 'absolute',
        top: 0,
        bottom: '-1px', // Cover the border
        left: 0,
        right: 0,
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 0,
        '& .edit-icon': { opacity: '0 !important' },
      }
    }}>
                            <Autocomplete
                              className="product-autocomplete"
                              options={produtos}
                              getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
                              value={null}
                              onChange={(_, value) => handleUpdateItem(index, 'produtoId', value?.id || 0)}
                              renderInput={(params) => (
                                <TextField 
                                  {...params} 
                                  placeholder="Pesquise por código ou nome" 
                                  fullWidth 
                                  variant="standard"
                                  InputProps={{ ...params.InputProps, disableUnderline: true }}
                                  sx={{ '& .MuiInputBase-input::placeholder': { color: '#999', opacity: 1 } }}
                                />
                              )}
                              sx={{ flex: 1, '& .MuiInputBase-root': { padding: 0 } }}
                            />
                            <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa', transition: 'opacity 0.2s' }} />
                          </Box>
                        ) : (
                          <Box className="hover-input" sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      transition: 'all 0.2s', 
      px: 2,
      py: 1,
      height: '100%',
      ml: 0,
      borderBottom: '2px solid transparent',
      '&:focus-within': {
        position: 'absolute',
        top: 0,
        bottom: '-1px', // Cover the border
        left: 0,
        right: 0,
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 0,
        '& .edit-icon': { opacity: '0 !important' },
      }
    }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ color: '#333', mb: 0.5 }}>
                                {produto?.codigo} - {produto?.descricao}
                              </Typography>
                            </Box>
                            <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa', transition: 'opacity 0.2s' }} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.produtoId === 0 ? (
                          <Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 2,
      py: 1,
      height: '100%',
      mr: 0, borderBottom: '2px solid transparent' }}>
    <Typography sx={{ color: '#333' }}>0,00</Typography>
    <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa' }} />
  </Box>
                        ) : (
                          <Box className="hover-input" sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-end', 
      transition: 'all 0.2s', 
      px: 2,
      py: 1,
      height: '100%',
      mr: 0,
      borderBottom: '2px solid transparent',
      '&:focus-within': {
        position: 'absolute',
        top: 0,
        bottom: '-1px',
        left: 0,
        right: 0,
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderRadius: 0,
        '& .edit-icon': { opacity: '0 !important' },
      }
    }}>
                            <TextField
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => handleUpdateItem(index, 'quantidade', Number(e.target.value))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddItem()
                              }
                            }}
                            variant="standard"
                            sx={{
                              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { 
                                display: 'none', 
                                WebkitAppearance: 'none', 
                                margin: 0 
                              }, 
                              '& input[type=number]': { 
                                MozAppearance: 'textfield' 
                              }
                            }}
                            InputProps={{ 
                              disableUnderline: true,
                              endAdornment: <Typography sx={{ ml: 0.5, color: '#555' }}>{produto?.unidadeMedida?.sigla || 'Un'}</Typography>
                            }}
                            inputProps={{ min: 0.001, step: 0.001, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                          <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa', transition: 'opacity 0.2s' }} />
                        </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.produtoId === 0 ? (
                          <Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 2,
      py: 1,
      height: '100%',
      mr: 0, borderBottom: '2px solid transparent' }}>
    <Typography sx={{ color: '#333' }}>0,00</Typography>
    <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa' }} />
  </Box>
                        ) : (
                          <Box className="hover-input" sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-end', 
      transition: 'all 0.2s', 
      px: 2,
      py: 1,
      height: '100%',
      mr: 0,
      borderBottom: '2px solid transparent',
      '&:focus-within': {
        position: 'absolute',
        top: 0,
        bottom: '-1px',
        left: 0,
        right: 0,
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderRadius: 0,
        '& .edit-icon': { opacity: '0 !important' },
      }
    }}>
                            <TextField
                            type="number"
                            value={item.valorUnitario}
                            onChange={(e) => handleUpdateItem(index, 'valorUnitario', Number(e.target.value))}
                            variant="standard"
                            sx={{
                              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { 
                                display: 'none', 
                                WebkitAppearance: 'none', 
                                margin: 0 
                              }, 
                              '& input[type=number]': { 
                                MozAppearance: 'textfield' 
                              }
                            }}
                            InputProps={{ disableUnderline: true }}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                          <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa', transition: 'opacity 0.2s' }} />
                        </Box>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ px: 2 }}>
                        <Typography sx={{ fontWeight: 500, color: '#333' }}>
                          {item.produtoId === 0 ? '0,00' : item.valorTotal.toFixed(2).replace('.', ',')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 2 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveItem(index)} 
                          disabled={form.itens.length === 1 && index === 0}
                          sx={{ color: '#888', '&:hover': { color: '#333' } }}
                        >
                          <Close />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Total Row */}
                <TableRow>
                  <TableCell colSpan={4} sx={{ borderBottom: 'none' }}></TableCell>
                  <TableCell align="right" sx={{ borderBottom: 'none', pt: 3 }}>
                    <Typography sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                      {calcularTotal().toFixed(2).replace('.', ',')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none' }}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleAddItem}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 1,
                fontWeight: 600,
                boxShadow: 'none',
              }}
            >
              ADICIONAR MAIS UM PRODUTO
            </Button>
          </Box>

        </CardContent></Card>

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
