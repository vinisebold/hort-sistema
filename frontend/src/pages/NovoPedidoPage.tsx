import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent,
  Autocomplete, Alert, Snackbar, Grid, Fab
} from '@mui/material'
import { ArrowBack, Close, InfoOutlined, Edit, Search, Check } from '@mui/icons-material'
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
  const [activeInput, setActiveInput] = useState<{ index: number, field: string, value: string } | null>(null)

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
    <Box>
      {/* Totalizer Header - full width, flush under AppBar */}
      <Box
        sx={(theme) => ({
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          height: 42,
          bgcolor: (theme as any).palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // shadow applied to this header so visual continuity with AppBar when AppBar has no shadow
          boxShadow: (theme as any).shadows[4],
          zIndex: (theme as any).zIndex.appBar - 1,
        })}
      >
        <Typography variant="h5" sx={{ fontWeight: 300, color: 'white', fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
          <Box component="span" sx={{ fontWeight: 600 }}>Venda</Box> no valor de <Box component="span" sx={{ fontWeight: 600 }}>R$ {calcularTotal().toFixed(2).replace('.', ',')}</Box>
        </Typography>
      </Box>

      {/* spacer so page content sits below the fixed header */}
      <Box sx={{ height: 42, mb: 3 }} />

      <Box>
        {/* Seção 1: Dados Fiscais/Cliente */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
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
          <Typography variant="h6" sx={{ mb: 1, fontSize: '1.5rem', fontWeight: 300, color: '#333', letterSpacing: 0.2 }}>
            Produtos
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, color: '#888' }}>
            <InfoOutlined sx={{ mr: 1, fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              Para a correta leitura do código de barras, certifique-se de que nenhum campo esteja selecionado.
            </Typography>
          </Box>

          <TableContainer sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: '1px solid #ddd' } }}>
                  <TableCell width="5%" align="center" sx={{ borderBottom: '1px solid #ddd', fontSize: '0.875rem' }}></TableCell>
                  <TableCell width="45%" sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                    <Box sx={{ px: 4, pb: 1.5 }}>Produto</Box>
                  </TableCell>
                   <TableCell width="15%" align="right" sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                    <Box sx={{ px: 4, pb: 1.5 }}>Quantidade</Box>
                   </TableCell>
                   <TableCell width="15%" align="right" sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                    <Box sx={{ px: 4, pb: 1.5 }}>Preço</Box>
                   </TableCell>
                   <TableCell width="15%" align="right" sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                    <Box sx={{ px: 4, pb: 1.5 }}>Total</Box>
                   </TableCell>
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
    '& td': { borderBottom: '1px solid #ddd', position: 'relative', p: 0, height: '56px' }
  }}>
                      <TableCell align="center" sx={{ color: '#555', px: 2 }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ position: 'relative' }}>
                        <Edit className="edit-icon" sx={{ opacity: 0, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#aaa', transition: 'opacity 0.2s', zIndex: 1, pointerEvents: 'none' }} />
                        <Box className="hover-input" 
                          onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input) input.focus();
                          }}
                          sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          transition: 'all 0.2s', 
                          px: 4,
                          py: 0,
                          height: '100%',
                          ml: 0,
                          position: 'relative',
                          cursor: 'pointer',
                          borderBottom: '2px solid transparent',
                          '&:focus-within': {
                            position: 'absolute',
                            top: 0,
                            bottom: '-1px',
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            bgcolor: '#fff',
                            boxShadow: '0 4px 4px rgba(0,0,0,0.25)',
                            borderBottom: '2px solid #209b8e',
                            px: 4,
                            py: 0,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 0,
                            '& .edit-icon': { opacity: '0 !important' },
                            '& .search-icon': { display: 'flex !important' },
                          }
                        }}>
                          <Autocomplete
                            className="product-autocomplete"
                            options={produtos}
                            getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
                            value={produtos.find(p => p.id === item.produtoId)}
                            onChange={(_, value) => handleUpdateItem(index, 'produtoId', value?.id || 0)}
                            disableClearable
                            forcePopupIcon={false}
                            autoHighlight
                            openOnFocus
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                placeholder="Pesquise por código ou nome" 
                                fullWidth 
                                variant="standard"
                                InputProps={{ 
                                  ...params.InputProps, 
                                  disableUnderline: true,
                                  startAdornment: (
                                    <Box className="search-icon" sx={{ color: '#209b8e', mr: 1, display: 'none', alignItems: 'center' }}>
                                      <Search fontSize="small" />
                                    </Box>
                                  )
                                }}
                                sx={{ 
                                  '& .MuiInputBase-input': { fontSize: '0.875rem', cursor: 'pointer' },
                                  '& .MuiInputBase-input::placeholder': { color: '#999', opacity: 1, fontSize: '0.875rem' } 
                                }}
                              />
                            )}
                            sx={{ flex: 1, '& .MuiInputBase-root': { padding: 0 } }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ position: 'relative' }}>
                        <Edit className="edit-icon" sx={{ opacity: 0, position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: '#aaa', transition: 'opacity 0.2s', zIndex: 1, pointerEvents: 'none' }} />
                        <Box className="hover-input" 
                          onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input) input.focus();
                          }}
                          sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end', 
                          transition: 'all 0.2s', 
                          px: 4,
                          py: 0,
                          height: '100%',
                          mr: 0,
                          cursor: 'pointer',
                          borderBottom: '2px solid transparent',
                          '&:focus-within': {
                            position: 'absolute',
                            top: 0,
                            bottom: '-1px',
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            bgcolor: '#fff',
                            boxShadow: '0 4px 4px rgba(0,0,0,0.25)',
                            borderBottom: '2px solid #209b8e',
                            px: 4,
                            py: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            borderRadius: 0,
                            '& .edit-icon': { opacity: '0 !important' },
                          }
                        }}>
                          <TextField
                            type="text"
                            placeholder={activeInput?.index === index && activeInput?.field === 'quantidade' ? (produto?.unidadeMedida?.sigla || 'Un') : '0,00'}
                            value={activeInput?.index === index && activeInput?.field === 'quantidade' 
                              ? activeInput.value 
                              : (item.quantidade === 0 ? '' : item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                            onFocus={(e) => {
                              setActiveInput({ 
                                index, 
                                field: 'quantidade', 
                                value: item.quantidade === 0 ? '' : item.quantidade.toString().replace('.', ',') 
                              })
                              e.target.select()
                            }}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9,]/g, '')
                              setActiveInput(prev => prev ? { ...prev, value: val } : null)
                              const num = Number(val.replace(',', '.'))
                              if (!isNaN(num)) {
                                handleUpdateItem(index, 'quantidade', num)
                              }
                            }}
                            onBlur={() => setActiveInput(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                setActiveInput(null)
                                handleAddItem()
                              }
                            }}
                            variant="standard"
                            InputProps={{ 
                              disableUnderline: true,
                            }}
                            inputProps={{ 
                              style: { textAlign: 'right', color: '#333', fontSize: '0.875rem', cursor: 'pointer' },
                              onClick: (e: any) => e.target.select()
                            }}
                            sx={{ 
                              flex: 1,
                              '& .MuiInputBase-input::placeholder': { 
                                color: (activeInput?.index === index && activeInput?.field === 'quantidade') ? '#999' : '#333', 
                                opacity: 1, 
                                fontSize: '0.875rem' 
                              } 
                            }}
                            fullWidth
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ position: 'relative' }}>
                        <Edit className="edit-icon" sx={{ opacity: 0, position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: '#aaa', transition: 'opacity 0.2s', zIndex: 1, pointerEvents: 'none' }} />
                        <Box className="hover-input" 
                          onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input) input.focus();
                          }}
                          sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end', 
                          transition: 'all 0.2s', 
                          px: 4,
                          py: 0,
                          height: '100%',
                          mr: 0,
                          cursor: 'pointer',
                          borderBottom: '2px solid transparent',
                          '&:focus-within': {
                            position: 'absolute',
                            top: 0,
                            bottom: '-1px',
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            bgcolor: '#fff',
                            boxShadow: '0 4px 4px rgba(0,0,0,0.25)',
                            borderBottom: '2px solid #209b8e',
                            px: 4,
                            py: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            borderRadius: 0,
                            '& .edit-icon': { opacity: '0 !important' },
                          }
                        }}>
                          <TextField
                            type="text"
                            placeholder={activeInput?.index === index && activeInput?.field === 'valorUnitario' ? 'R$' : '0,00'}
                            value={activeInput?.index === index && activeInput?.field === 'valorUnitario' 
                              ? activeInput.value 
                              : (item.valorUnitario === 0 ? '' : item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                            onFocus={(e) => {
                              setActiveInput({ 
                                index, 
                                field: 'valorUnitario', 
                                value: item.valorUnitario === 0 ? '' : item.valorUnitario.toString().replace('.', ',') 
                              })
                              e.target.select()
                            }}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9,]/g, '')
                              setActiveInput(prev => prev ? { ...prev, value: val } : null)
                              const num = Number(val.replace(',', '.'))
                              if (!isNaN(num)) {
                                handleUpdateItem(index, 'valorUnitario', num)
                              }
                            }}
                            onBlur={() => setActiveInput(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                setActiveInput(null)
                              }
                            }}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            inputProps={{ 
                              style: { textAlign: 'right', color: '#333', fontSize: '0.875rem', cursor: 'pointer' },
                              onClick: (e: any) => e.target.select()
                            }}
                            sx={{ 
                              flex: 1,
                              '& .MuiInputBase-input::placeholder': { 
                                color: (activeInput?.index === index && activeInput?.field === 'valorUnitario') ? '#999' : '#333', 
                                opacity: 1, 
                                fontSize: '0.875rem' 
                              } 
                            }}
                            fullWidth
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ px: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                          <span style={{ fontWeight: 500, color: '#333', fontSize: '0.875rem' }}>
                            {item.produtoId === 0 ? '0,00' : item.valorTotal.toFixed(2).replace('.', ',')}
                          </span>
                        </Box>
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
                  <TableCell align="right" sx={{ borderBottom: 'none', p: 0 }}>
                    <Box sx={{ px: 4, mt: 2 }}>
                      <span style={{ fontWeight: 600, color: '#333', fontSize: '0.875rem' }}>
                        {calcularTotal().toFixed(2).replace('.', ',')}
                      </span>
                    </Box>
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
                fontWeight: 500,
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
          justifyContent: 'flex-start', 
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
        </Box>
      </Box>

      <Fab
        color="primary"
        onClick={handleSubmit}
        disabled={loading || form.itens.length === 0}
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
        <Check />
      </Fab>

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
