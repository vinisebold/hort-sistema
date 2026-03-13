import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, Card, CardContent,
  Autocomplete, Grid, Fab, ToggleButton, ToggleButtonGroup, InputAdornment, Collapse
} from '@mui/material'
import { ArrowBack, Close, InfoOutlined, Edit, Search, Check } from '@mui/icons-material'
import { pedidosApi, produtosApi, clientesApi, naturezasApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { NaturezaOperacao, Produto, Cliente, ItemPedido } from '../types'
import { getPersonNameValidationMessage, normalizePersonNameInput } from '../utils/personNameValidation'

export default function NovoPedidoPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const initialNaturezaId = searchParams.get('naturezaId')
  const isEditing = Boolean(id)

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>([])
  const [loading, setLoading] = useState(false)
  const [activeInput, setActiveInput] = useState<{ index: number, field: string, value: string } | null>(null)
  const [inputClienteValue, setInputClienteValue] = useState('')
  const [clienteNomeTouched, setClienteNomeTouched] = useState(false)

  const [form, setForm] = useState({
    naturezaOperacaoId: '',
    clienteId: null as number | null,
    clienteNome: '', // Para armazenar nome de cliente ainda não criado
    documentoReferencia: '',
    status: '',
    itens: [{ produtoId: 0, produtoDescricao: '', quantidade: 0, valorUnitario: 0, valorTotal: 0 }] as ItemPedido[]
  })

  const isObrigatorio = (propriedade?: 'DESATIVADO' | 'OPCIONAL' | 'OBRIGATORIO') => propriedade === 'OBRIGATORIO'
  const isAtivo = (propriedade?: 'DESATIVADO' | 'OPCIONAL' | 'OBRIGATORIO') => propriedade !== 'DESATIVADO'

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadProdutos(),
        loadClientes(),
        loadNaturezas(),
      ])
      if (isEditing) {
        await loadPedido()
      }
    }
    init()
  }, [id])

  const loadProdutos = async () => {
    try {
      const response = await produtosApi.listarTodos()
      // support both old raw-array responses and new CursorResponse<{data,nextCursor,hasNext}>
      const payload = response.data
      const items = Array.isArray(payload) ? payload : (payload.data ?? [])
      setProdutos(items)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadClientes = async () => {
    try {
      const response = await clientesApi.listarTodos()
      const payload = response.data
      const items = Array.isArray(payload) ? payload : (payload.data ?? [])
      setClientes(items)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadNaturezas = async () => {
    try {
      const response = await naturezasApi.listar()
      setNaturezas(response.data)
      
      if (!isEditing && initialNaturezaId) {
        setForm(prev => ({ ...prev, naturezaOperacaoId: initialNaturezaId }))
      }
    } catch (error) {
      console.error('Erro ao carregar naturezas:', error)
    }
  }

  const buscarOuCriarClientePF = async (nome: string): Promise<number | null> => {
    const nomeNormalizado = normalizePersonNameInput(nome)
    if (!nomeNormalizado) {
      return null
    }

    try {
      const response = await clientesApi.buscarOuCriarPF(nomeNormalizado)
      const novoCliente = response.data

      // Adiciona à lista de clientes se não existir
      if (!clientes.find(c => c.id === novoCliente.id)) {
        setClientes(prev => [...prev, novoCliente])
      }

      return novoCliente.id
    } catch (error) {
      console.error('Erro ao buscar/criar cliente:', error)
      throw error
    }
  }

  const loadPedido = async () => {
    try {
      const response = await pedidosApi.buscar(Number(id))
      const pedido = response.data
      const clienteNomeDoPedido = pedido.clienteId
        ? (pedido.clienteNome && pedido.clienteNome !== 'N/A' ? pedido.clienteNome : '')
        : ''
      setForm({
        naturezaOperacaoId: String(pedido.naturezaOperacaoId || ''),
        clienteId: pedido.clienteId || null,
        clienteNome: '',
        documentoReferencia: pedido.documentoReferencia || '',
        status: pedido.status || '',
        itens: pedido.itens.length > 0
          ? pedido.itens.map((item: ItemPedido) => ({
              id: item.id,
              produtoId: Number(item.produtoId),
              produtoDescricao: item.produtoDescricao || '',
              quantidade: Number(item.quantidade),
              valorUnitario: Number(item.valorUnitario),
              valorTotal: Number(item.valorTotal),
            }))
          : [{ produtoId: 0, produtoDescricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]
      })
      if (clienteNomeDoPedido) {
        setInputClienteValue(clienteNomeDoPedido)
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      showToast('Erro ao carregar pedido', 'error')
    }
  }

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      itens: [...prev.itens, {
        produtoId: 0,
        produtoDescricao: '',
        quantidade: 0,
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
    if (!form.naturezaOperacaoId || form.itens.length === 0) {
      showToast('Preencha todos os campos obrigatórios', 'error')
      return
    }

    // Validate based on natureza configuration
    if (selectedNatureza) {
      if (isObrigatorio(selectedNatureza.propriedadeCliente) && !form.clienteId && !form.clienteNome.trim()) {
        showToast('Cliente é obrigatório para esta natureza de operação', 'error')
        return
      }

      if (!form.clienteId && form.clienteNome.trim() && isAtivo(selectedNatureza.propriedadeCliente)) {
        const nomeError = getPersonNameValidationMessage(form.clienteNome)
        if (nomeError) {
          showToast(nomeError, 'error')
          return
        }
      }

      if (isObrigatorio(selectedNatureza.propriedadeStatus) && !form.status) {
        showToast('Status é obrigatório para esta natureza de operação', 'error')
        return
      }

      if (isAtivo(selectedNatureza.propriedadeStatus) && form.status === 'PENDENTE' && !form.documentoReferencia?.trim()) {
        showToast('Documento de referência é obrigatório para pedidos pendentes', 'error')
        return
      }
    }

    setLoading(true)
    try {
      // Se houver um nome de cliente mas não um ID, cria o cliente PF primeiro
      let clienteId = form.clienteId
      if (!clienteId && form.clienteNome.trim() && isAtivo(selectedNatureza?.propriedadeCliente)) {
        clienteId = await buscarOuCriarClientePF(form.clienteNome)
      }

      const payload: any = {
        naturezaOperacaoId: Number(form.naturezaOperacaoId),
        itens: form.itens
          .filter(item => item.produtoId !== 0 && item.quantidade > 0)
          .map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            ...(isAtivo(selectedNatureza?.propriedadeValorUnitario) && { valorUnitario: item.valorUnitario })
          }))
      }

      // Add optional fields based on natureza configuration
      if (isAtivo(selectedNatureza?.propriedadeCliente) && clienteId) {
        payload.clienteId = clienteId
      }

      if (isAtivo(selectedNatureza?.propriedadeStatus)) {
        if (form.status) {
          payload.status = form.status
        }
        if (form.status === 'PENDENTE' && form.documentoReferencia) {
          payload.documentoReferencia = form.documentoReferencia
        }
      }

      if (payload.itens.length === 0) {
        showToast('Adicione pelo menos um produto válido', 'error')
        setLoading(false)
        return
      }

      if (isEditing) {
        await pedidosApi.atualizar(Number(id), payload)
      } else {
        await pedidosApi.criar(payload)
      }

      navigate('/pedidos')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao salvar pedido', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedNatureza = naturezas.find(n => String(n.id) === form.naturezaOperacaoId)
  const exibeCardDadosPedido = isAtivo(selectedNatureza?.propriedadeCliente) || isAtivo(selectedNatureza?.propriedadeStatus)
  const clienteNomeError = !form.clienteId && clienteNomeTouched && inputClienteValue.trim()
    ? getPersonNameValidationMessage(inputClienteValue)
    : ''

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
           {isEditing
             ? <><Box component="span" sx={{ fontWeight: 400 }}>Editando Pedido #{id}</Box>{isAtivo(selectedNatureza?.propriedadeValorUnitario) && (<> — <Box component="span" sx={{ fontWeight: 400 }}>R$ {calcularTotal().toFixed(2).replace('.', ',')}</Box></>)}</>
             : <><Box component="span" sx={{ fontWeight: 400 }}>{selectedNatureza?.descricao || 'Pedido'}</Box>{isAtivo(selectedNatureza?.propriedadeValorUnitario) && (<> no valor de <Box component="span" sx={{ fontWeight: 400 }}>R$ {calcularTotal().toFixed(2).replace('.', ',')}</Box></>)}</>
           }
           </Typography>
        </Box>

      {/* spacer so page content sits below the fixed header */}
      <Box sx={{ height: 42, mb: 3 }} />

      <Box>
        {/* Seção 1: Dados Fiscais/Cliente */}
        {exibeCardDadosPedido && (
          <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={4} alignItems="flex-end">
                {isAtivo(selectedNatureza?.propriedadeCliente) && (
                  <Grid item xs={12} md={isAtivo(selectedNatureza?.propriedadeStatus) ? 8 : 12}>
                   <Autocomplete
                      options={clientes}
                      getOptionLabel={(option) => typeof option === 'string' ? option : option.razaoSocial}
                      value={clientes.find(c => c.id === form.clienteId) || null}
                       inputValue={inputClienteValue}
                       onInputChange={(_, value) => {
                         setInputClienteValue(value || '')
                         setClienteNomeTouched(Boolean(value))
                         // Se não há cliente selecionado, armazena o texto digitado como clienteNome
                         if (!form.clienteId && value) {
                           setForm(prev => ({ ...prev, clienteNome: value }))
                         }
                         if (!value) {
                           setForm(prev => ({ ...prev, clienteNome: '', clienteId: null }))
                         }
                       }}
                       onChange={(_, value) => {
                         if (typeof value === 'string') {
                           // É um texto livre digitado - armazena para criar depois
                           const nomeNormalizado = normalizePersonNameInput(value)
                           setClienteNomeTouched(Boolean(nomeNormalizado))
                           setForm({ ...form, clienteId: null, clienteNome: nomeNormalizado })
                           setInputClienteValue(nomeNormalizado)
                           return
                         }
                         // É um cliente selecionado da lista
                         setClienteNomeTouched(false)
                         setForm({ ...form, clienteId: value?.id || null, clienteNome: '' })
                         setInputClienteValue(value?.razaoSocial || '')
                       }}
                      freeSolo
                      renderInput={(params) => (
                        <TextField 
                          {...params}  
                          label="Cliente" 
                          placeholder="Selecione ou digite o nome do cliente"
                          fullWidth 
                          autoFocus
                          onBlur={() => {
                            setClienteNomeTouched(Boolean(inputClienteValue.trim()))
                            if (!form.clienteId && inputClienteValue.trim()) {
                              const nomeNormalizado = normalizePersonNameInput(inputClienteValue)
                              setInputClienteValue(nomeNormalizado)
                              setForm(prev => ({ ...prev, clienteNome: nomeNormalizado }))
                            }
                          }}
                          error={Boolean(clienteNomeError)}
                          helperText={clienteNomeError || (inputClienteValue && !form.clienteId ? 'Cliente será criado ao finalizar o pedido' : '')}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Box>
                            <Typography variant="body1">{option.razaoSocial}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.documento}</Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </Grid>
                )}
                {isAtivo(selectedNatureza?.propriedadeStatus) && (
                  <Grid item xs={12} md={isAtivo(selectedNatureza?.propriedadeCliente) ? 4 : 12}>
                    <Box sx={!isAtivo(selectedNatureza?.propriedadeCliente) ? { maxWidth: 400, mx: 'auto' } : {}}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, display: 'block', ml: 0.5, textAlign: !isAtivo(selectedNatureza?.propriedadeCliente) ? 'center' : 'left' }}>
                        STATUS DO PAGAMENTO
                      </Typography>
                      <ToggleButtonGroup
                        value={form.status || ''}
                        exclusive
                        onChange={(_, value) => value && setForm({ ...form, status: value })}
                        fullWidth
                        size="small"
                        sx={{ 
                          height: 40,
                          '& .MuiToggleButton-root': {
                            border: '1px solid #ddd',
                            '&.Mui-selected': {
                              bgcolor: form.status === 'PAGO' ? '#e8f5e9' : '#fff3e0',
                              color: form.status === 'PAGO' ? '#2e7d32' : '#ed6c02',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: form.status === 'PAGO' ? '#c8e6c9' : '#ffe0b2',
                              }
                            }
                          }
                        }}
                      >
                        {selectedNatureza?.propriedadeStatus === 'OPCIONAL' && (
                          <ToggleButton value="">NÃO INFORMAR</ToggleButton>
                        )}
                        <ToggleButton value="PAGO">PAGO</ToggleButton>
                        <ToggleButton value="PENDENTE">PENDENTE</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Grid>
                )}
               
                {isAtivo(selectedNatureza?.propriedadeStatus) && (
                  <Grid item xs={12} sx={{ pt: form.status === 'PENDENTE' ? 4 : 0, transition: 'padding-top 0.3s' }}>
                    <Collapse in={form.status === 'PENDENTE'} timeout={300}>
                      <TextField
                        label="Documento de Referência"
                        value={form.documentoReferencia}
                        onChange={(e) => setForm({ ...form, documentoReferencia: e.target.value })}
                        fullWidth
                        required={form.status === 'PENDENTE'}
                        helperText="Obrigatório para pedidos pendentes"
                      />
                    </Collapse>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Seção 2: Itens do Pedido */}
        <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '2rem', fontWeight: 100, color: '#333', letterSpacing: 0.1 }}>
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
                  <TableCell width={isAtivo(selectedNatureza?.propriedadeValorUnitario) ? "45%" : "60%"} sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                    <Box sx={{ px: 4, pb: 1.5 }}>Produto</Box>
                  </TableCell>
                   <TableCell width="15%" align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                    <Box sx={{ px: 4, pb: 1.5 }}>Quantidade</Box>
                   </TableCell>
                   {isAtivo(selectedNatureza?.propriedadeValorUnitario) && (
                     <>
                       <TableCell width="15%" align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                        <Box sx={{ px: 4, pb: 1.5 }}>Preço</Box>
                       </TableCell>
                       <TableCell width="15%" align="right" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#333', borderBottom: '1px solid #ddd', p: 0 }}>
                        <Box sx={{ px: 4, pb: 1.5 }}>Total</Box>
                       </TableCell>
                     </>
                   )}
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
                            value={produtos.find(p => p.id === item.produtoId) ?? null}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onChange={(_, value: Produto | null) => {
                              handleUpdateItem(index, 'produtoId', value?.id || 0);
                            }}
                            onClose={(_, reason) => {
                              if (reason === 'selectOption' || reason === 'blur') {
                                setTimeout(() => {
                                  const row = document.querySelectorAll('tbody tr')[index];
                                  const inputs = row?.querySelectorAll('input');
                                  if (inputs && inputs[1]) {
                                    const qtyInput = inputs[1] as HTMLInputElement;
                                    qtyInput.focus();
                                    qtyInput.select();
                                  }
                                }, 100);
                              }
                            }}
                             forcePopupIcon={false}
                            autoHighlight
                            openOnFocus
                            renderOption={(props, option) => (
                              <li {...props} key={option.id} onClick={(e) => {
                                if (props.onClick) props.onClick(e);
                                // Explicitly trigger focus if same item is clicked
                                if (option.id === item.produtoId) {
                                  setTimeout(() => {
                                    const row = document.querySelectorAll('tbody tr')[index];
                                    const inputs = row?.querySelectorAll('input');
                                    if (inputs && inputs[1]) {
                                      const qtyInput = inputs[1] as HTMLInputElement;
                                      qtyInput.focus();
                                      qtyInput.select();
                                    }
                                  }, 100);
                                }
                              }}>
                                {option.codigo} - {option.descricao}
                              </li>
                            )}
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
                                // Move to price field in the same row if valor unitário está ativo
                                if (isAtivo(selectedNatureza?.propriedadeValorUnitario)) {
                                  const row = document.querySelectorAll('tbody tr')[index];
                                  const inputs = row?.querySelectorAll('input');
                                  if (inputs && inputs[2]) (inputs[2] as HTMLInputElement).focus();
                                } else {
                                  setActiveInput(null)
                                  handleAddItem()
                                }
                              }
                            }}
                            variant="standard"
                            InputProps={{ 
                              disableUnderline: true,
                              endAdornment: produto && !(activeInput?.index === index && activeInput?.field === 'quantidade') && (
                                <InputAdornment position="end">
                                  <Typography variant="caption" sx={{ color: '#333', mr: 1, fontSize: '0.875rem' }}>
                                    {produto.unidadeMedida?.sigla}
                                  </Typography>
                                </InputAdornment>
                              )
                            }}
                             inputProps={{ 
                               style: { textAlign: 'right', color: '#333', fontSize: '0.875rem', cursor: 'pointer' },
                               onClick: (e: any) => e.target.select()
                             }}
                             sx={{ 
                               flex: 1,
                               '& .MuiInputBase-input': { fontSize: '0.875rem' }, // Ensure consistent font size
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
                      {isAtivo(selectedNatureza?.propriedadeValorUnitario) && (
                        <>
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
                                  if (e.key === 'Enter' || e.key === 'Tab') {
                                    e.preventDefault()
                                    setActiveInput(null)
                                    handleAddItem()
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
                                   '& .MuiInputBase-input': { fontSize: '0.875rem' }, // Ensure consistent font size
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
                        </>
                      )}
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
                {isAtivo(selectedNatureza?.propriedadeValorUnitario) && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ borderBottom: 'none' }}></TableCell>
                    <TableCell align="right" sx={{ borderBottom: 'none', p: 0 }}>
                      <Box sx={{ px: 2, mt: 2, mr: 2 }}>
                        <span style={{ fontWeight: 400, color: '#333', fontSize: '0.875rem' }}>
                          {calcularTotal().toFixed(2).replace('.', ',')}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: 'none' }}></TableCell>
                  </TableRow>
                )}
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
          py: 2
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

    </Box>
  )
}
