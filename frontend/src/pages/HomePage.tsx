import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid2 as Grid,
    Link,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Alert
} from '@mui/material'
import {
    Inventory,
    PersonAdd,
    ShoppingCart,
    AddShoppingCart,
    Widgets,
    ArrowForward,
    AccountBalanceWallet,
    Category,
    Scale
} from '@mui/icons-material'
import { produtosApi, clientesApi, unidadesMedidaApi, naturezasApi } from '../services/api'
import { getPersonNameValidationMessage, normalizePersonNameInput } from '../utils/personNameValidation'

interface FormState {
    type: 'produto' | 'cliente' | 'unidade' | 'natureza' | null
    loading: boolean
    error: string
}

interface ProdutoForm {
    descricao: string
    unidadeMedidaId: string
}

interface ClienteForm {
    razaoSocial: string
    documento: string
    tipoPessoa: string
}

interface UnidadeForm {
    sigla: string
    descricao: string
}

interface NaturezaForm {
    descricao: string
    tipoMovimento: string
}

export default function HomePage() {
    const navigate = useNavigate()
    const [formState, setFormState] = useState<FormState>({ type: null, loading: false, error: '' })
    const [unidades, setUnidades] = useState<any[]>([])
    
    // Form states
    const [produtoForm, setProdutoForm] = useState<ProdutoForm>({ descricao: '', unidadeMedidaId: '' })
    const [clienteForm, setClienteForm] = useState<ClienteForm>({ razaoSocial: '', documento: '', tipoPessoa: 'JURIDICA' })
    const [unidadeForm, setUnidadeForm] = useState<UnidadeForm>({ sigla: '', descricao: '' })
    const [naturezaForm, setNaturezaForm] = useState<NaturezaForm>({ descricao: '', tipoMovimento: 'SAIDA' })
    const clienteNomeError = clienteForm.tipoPessoa === 'FISICA'
        ? getPersonNameValidationMessage(clienteForm.razaoSocial)
        : ''

    const acessoRapidoItems = [
        { label: 'Novo Pedido', icon: <AddShoppingCart fontSize="small" />, path: '/pedidos/novo' },
        { label: 'Lista de Pedidos', icon: <ShoppingCart fontSize="small" />, path: '/pedidos' },
        { label: 'Controle de Estoque', icon: <Widgets fontSize="small" />, path: '/estoque' },
        { label: 'Financeiro', icon: <AccountBalanceWallet fontSize="small" />, path: '/financeiro' },
        { label: 'Produtos', icon: <Inventory fontSize="small" />, path: '/produtos' },
        { label: 'Clientes', icon: <PersonAdd fontSize="small" />, path: '/clientes' },
    ]

    const cadastrosRapidos = [
        { label: 'Adicionar Produto', icon: <Inventory />, type: 'produto' as const },
        { label: 'Adicionar Cliente', icon: <PersonAdd />, type: 'cliente' as const },
        { label: 'Adicionar Unidade', icon: <Scale />, type: 'unidade' as const },
        { label: 'Adicionar Natureza', icon: <Category />, type: 'natureza' as const },
    ]

    const openModal = async (type: 'produto' | 'cliente' | 'unidade' | 'natureza') => {
        setFormState({ type, loading: false, error: '' })
        if (type === 'produto') {
            try {
                const response = await unidadesMedidaApi.listar()
                setUnidades(response.data)
            } catch (error) {
                console.error('Erro ao carregar unidades:', error)
            }
        }
    }

    const closeModal = () => {
        setFormState({ type: null, loading: false, error: '' })
        setProdutoForm({ descricao: '', unidadeMedidaId: '' })
        setClienteForm({ razaoSocial: '', documento: '', tipoPessoa: 'JURIDICA' })
        setUnidadeForm({ sigla: '', descricao: '' })
        setNaturezaForm({ descricao: '', tipoMovimento: 'SAIDA' })
    }

    const handleSaveProduto = async () => {
        if (!produtoForm.descricao || !produtoForm.unidadeMedidaId) {
            setFormState(prev => ({ ...prev, error: 'Preencha todos os campos obrigatórios' }))
            return
        }

        setFormState(prev => ({ ...prev, loading: true }))
        try {
            await produtosApi.criar({
                descricao: produtoForm.descricao,
                unidadeMedidaId: Number(produtoForm.unidadeMedidaId),
            })
            setFormState(prev => ({ ...prev, loading: false, error: '' }))
            closeModal()
            navigate('/produtos')
        } catch (error: any) {
            setFormState(prev => ({ ...prev, loading: false, error: error.response?.data?.message || 'Erro ao criar produto' }))
        }
    }

    const handleSaveCliente = async () => {
        const nomeNormalizado = normalizePersonNameInput(clienteForm.razaoSocial)

        if (!nomeNormalizado || !clienteForm.documento) {
            setFormState(prev => ({ ...prev, error: 'Preencha todos os campos obrigatórios' }))
            return
        }

        if (clienteForm.tipoPessoa === 'FISICA' && clienteNomeError) {
            setFormState(prev => ({ ...prev, error: clienteNomeError }))
            return
        }

        setFormState(prev => ({ ...prev, loading: true }))
        try {
            await clientesApi.criar({
                razaoSocial: clienteForm.tipoPessoa === 'FISICA' ? nomeNormalizado : clienteForm.razaoSocial,
                documento: clienteForm.documento,
                tipoPessoa: clienteForm.tipoPessoa,
            })
            setFormState(prev => ({ ...prev, loading: false, error: '' }))
            closeModal()
            navigate('/clientes')
        } catch (error: any) {
            setFormState(prev => ({ ...prev, loading: false, error: error.response?.data?.message || 'Erro ao criar cliente' }))
        }
    }

    const handleSaveUnidade = async () => {
        if (!unidadeForm.sigla || !unidadeForm.descricao) {
            setFormState(prev => ({ ...prev, error: 'Preencha todos os campos obrigatórios' }))
            return
        }

        setFormState(prev => ({ ...prev, loading: true }))
        try {
            await unidadesMedidaApi.criar({
                sigla: unidadeForm.sigla,
                descricao: unidadeForm.descricao,
            })
            setFormState(prev => ({ ...prev, loading: false, error: '' }))
            closeModal()
            navigate('/unidades-medida')
        } catch (error: any) {
            setFormState(prev => ({ ...prev, loading: false, error: error.response?.data?.message || 'Erro ao criar unidade' }))
        }
    }

    const handleSaveNatureza = async () => {
        if (!naturezaForm.descricao) {
            setFormState(prev => ({ ...prev, error: 'Preencha o campo obrigatório' }))
            return
        }

        setFormState(prev => ({ ...prev, loading: true }))
        try {
            await naturezasApi.criar({
                descricao: naturezaForm.descricao,
                tipoMovimento: naturezaForm.tipoMovimento,
                propriedadeCliente: 'OBRIGATORIO',
                propriedadeValorUnitario: 'OBRIGATORIO',
                propriedadeStatus: 'OBRIGATORIO'
            })
            setFormState(prev => ({ ...prev, loading: false, error: '' }))
            closeModal()
            navigate('/naturezas-operacao')
        } catch (error: any) {
            setFormState(prev => ({ ...prev, loading: false, error: error.response?.data?.message || 'Erro ao criar natureza' }))
        }
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
                    Página Inicial
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                    Acesse rapidamente as principais funcionalidades do sistema e crie novos cadastros
                </Typography>
            </Box>

            <Grid container spacing={3}>

                {/* COLUNA ESQUERDA - Acesso Rápido e Ajuda */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Acesso Rápido */}
                    <Card elevation={0} sx={{ 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
                        borderRadius: 2,
                        mb: 3 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontSize: '1.125rem', fontWeight: 500, color: '#333' }}>
                                Acesso rápido
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {acessoRapidoItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        component="button"
                                        onClick={() => navigate(item.path)}
                                        underline="none"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            color: '#039be5',
                                            fontSize: '15px',
                                            height: '28px',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        <ArrowForward fontSize="inherit" sx={{ fontSize: 24, flexShrink: 0 }} />
                                        {item.label}
                                    </Link>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* COLUNA DIREITA - Dashboards e Cadastros */}
                <Grid size={{ xs: 12, md: 8 }}>

                    {/* Cadastros Rápidos Grid */}
                    <Card elevation={0} sx={{ 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
                        borderRadius: 2 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontSize: '1.125rem', fontWeight: 500, color: '#333' }}>
                                Cadastros rápidos
                            </Typography>
                            <Grid container spacing={2}>
                                {cadastrosRapidos.map((item) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => openModal(item.type)}
                                            startIcon={<Box component="span" sx={{ color: '#039be5', display: 'flex', alignItems: 'center' }}>{item.icon}</Box>}
                                            endIcon={<ArrowForward fontSize="small" sx={{ color: '#bdbdbd' }} />}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: 2,
                                                px: 3,
                                                color: '#424242',
                                                borderColor: '#e0e0e0',
                                                bgcolor: '#eeeeee',
                                                border: 'none',
                                                fontSize: '15px',
                                                '&:hover': {
                                                    bgcolor: '#e0e0e0',
                                                    border: 'none'
                                                },
                                                '& .MuiButton-endIcon': {
                                                    marginLeft: 'auto'
                                                },
                                                textTransform: 'none',
                                                fontWeight: 400
                                            }}
                                        >
                                            {item.label}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>

                </Grid>
            </Grid>

            {/* DIALOGS DE CADASTRO RÁPIDO */}

            {/* Dialog Produto */}
            <Dialog open={formState.type === 'produto'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>Novo Produto</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Descrição *
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={produtoForm.descricao}
                            onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                            placeholder="Ex: Tomate Salada"
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Unidade de Medida *
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={produtoForm.unidadeMedidaId}
                                onChange={(e) => setProdutoForm({ ...produtoForm, unidadeMedidaId: e.target.value })}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>
                                    Selecione uma unidade
                                </MenuItem>
                                {unidades.map((u) => (
                                    <MenuItem key={u.id} value={u.id}>{u.sigla} - {u.descricao}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                    <Button onClick={closeModal} sx={{ color: '#666' }}>Cancelar</Button>
                    <Button onClick={handleSaveProduto} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Cliente */}
            <Dialog open={formState.type === 'cliente'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>Novo Cliente</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Tipo de Pessoa *
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={clienteForm.tipoPessoa}
                                onChange={(e) => setClienteForm({ ...clienteForm, tipoPessoa: e.target.value })}
                            >
                                <MenuItem value="JURIDICA">Jurídica (CNPJ)</MenuItem>
                                <MenuItem value="FISICA">Física (CPF)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            {clienteForm.tipoPessoa === 'JURIDICA' ? 'Razão Social *' : 'Nome *'}
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={clienteForm.razaoSocial}
                            onChange={(e) => setClienteForm({ ...clienteForm, razaoSocial: e.target.value })}
                            onBlur={() => {
                                if (clienteForm.tipoPessoa === 'FISICA') {
                                    setClienteForm(prev => ({ ...prev, razaoSocial: normalizePersonNameInput(prev.razaoSocial) }))
                                }
                            }}
                            placeholder={clienteForm.tipoPessoa === 'JURIDICA' ? 'Ex: Empresa LTDA' : 'Ex: João da Silva'}
                            error={clienteForm.tipoPessoa === 'FISICA' && Boolean(clienteForm.razaoSocial) && Boolean(clienteNomeError)}
                            helperText={clienteForm.tipoPessoa === 'FISICA' ? (clienteNomeError || ' ') : ' '}
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            {clienteForm.tipoPessoa === 'JURIDICA' ? 'CNPJ *' : 'CPF *'}
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={clienteForm.documento}
                            onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })}
                            placeholder={clienteForm.tipoPessoa === 'JURIDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                    <Button onClick={closeModal} sx={{ color: '#666' }}>Cancelar</Button>
                    <Button onClick={handleSaveCliente} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Unidade de Medida */}
            <Dialog open={formState.type === 'unidade'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>Nova Unidade de Medida</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Sigla *
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={unidadeForm.sigla}
                            onChange={(e) => setUnidadeForm({ ...unidadeForm, sigla: e.target.value })}
                            inputProps={{ maxLength: 10 }}
                            placeholder="Ex: UN, KG, CX"
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Descrição *
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={unidadeForm.descricao}
                            onChange={(e) => setUnidadeForm({ ...unidadeForm, descricao: e.target.value })}
                            placeholder="Ex: Unidade, Quilograma, Caixa"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                    <Button onClick={closeModal} sx={{ color: '#666' }}>Cancelar</Button>
                    <Button onClick={handleSaveUnidade} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Natureza de Operação */}
            <Dialog open={formState.type === 'natureza'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>Nova Natureza de Operação</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Descrição *
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={naturezaForm.descricao}
                            onChange={(e) => setNaturezaForm({ ...naturezaForm, descricao: e.target.value })}
                            placeholder="Ex: Venda, Compra, Devolução"
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                            Tipo de Movimento *
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={naturezaForm.tipoMovimento}
                                onChange={(e) => setNaturezaForm({ ...naturezaForm, tipoMovimento: e.target.value })}
                            >
                                <MenuItem value="ENTRADA">Entrada</MenuItem>
                                <MenuItem value="SAIDA">Saída</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                    <Button onClick={closeModal} sx={{ color: '#666' }}>Cancelar</Button>
                    <Button onClick={handleSaveNatureza} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
