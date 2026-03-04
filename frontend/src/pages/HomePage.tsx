import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
    Box,
    Card,
    Typography,
    Grid2 as Grid,
    Link,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
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

interface FormState {
    type: 'produto' | 'cliente' | 'unidade' | 'natureza' | null
    loading: boolean
    error: string
}

interface ProdutoForm {
    codigo: string
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
    const [produtoForm, setProdutoForm] = useState<ProdutoForm>({ codigo: '', descricao: '', unidadeMedidaId: '' })
    const [clienteForm, setClienteForm] = useState<ClienteForm>({ razaoSocial: '', documento: '', tipoPessoa: 'JURIDICA' })
    const [unidadeForm, setUnidadeForm] = useState<UnidadeForm>({ sigla: '', descricao: '' })
    const [naturezaForm, setNaturezaForm] = useState<NaturezaForm>({ descricao: '', tipoMovimento: 'SAIDA' })

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
        setProdutoForm({ codigo: '', descricao: '', unidadeMedidaId: '' })
        setClienteForm({ razaoSocial: '', documento: '', tipoPessoa: 'JURIDICA' })
        setUnidadeForm({ sigla: '', descricao: '' })
        setNaturezaForm({ descricao: '', tipoMovimento: 'SAIDA' })
    }

    const handleSaveProduto = async () => {
        if (!produtoForm.codigo || !produtoForm.descricao || !produtoForm.unidadeMedidaId) {
            setFormState(prev => ({ ...prev, error: 'Preencha todos os campos obrigatórios' }))
            return
        }

        setFormState(prev => ({ ...prev, loading: true }))
        try {
            await produtosApi.criar({
                codigo: produtoForm.codigo,
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
        if (!clienteForm.razaoSocial || !clienteForm.documento) {
            setFormState(prev => ({ ...prev, error: 'Preencha todos os campos obrigatórios' }))
            return
        }

        setFormState(prev => ({ ...prev, loading: true }))
        try {
            await clientesApi.criar({
                razaoSocial: clienteForm.razaoSocial,
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

            <Grid container spacing={3}>

                {/* COLUNA ESQUERDA - Acesso Rápido e Ajuda */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ height: '100%', bgcolor: 'transparent' }}>
                        {/* Acesso Rápido */}
                        <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
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
                                            fontSize: '0.95rem',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        <ArrowForward fontSize="inherit" sx={{ fontSize: 16 }} />
                                        {item.label}
                                    </Link>
                                ))}
                            </Box>
                        </Paper>
                    </Card>
                </Grid>

                {/* COLUNA DIREITA - Dashboards e Cadastros */}
                <Grid size={{ xs: 12, md: 8 }}>

                    {/* Cadastros Rápidos Grid */}
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                            Cadastros rápidos
                        </Typography>
                        <Grid container spacing={2}>
                            {cadastrosRapidos.map((item) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => openModal(item.type)}
                                        startIcon={<Box component="span" sx={{ color: '#039be5' }}>{item.icon}</Box>}
                                        endIcon={<ArrowForward fontSize="small" sx={{ color: '#bdbdbd' }} />}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            py: 2,
                                            px: 3,
                                            color: '#424242',
                                            borderColor: '#e0e0e0',
                                            bgcolor: '#eeeeee',
                                            border: 'none',
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
                    </Paper>

                </Grid>
            </Grid>

            {/* DIALOGS DE CADASTRO RÁPIDO */}

            {/* Dialog Produto */}
            <Dialog open={formState.type === 'produto'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Produto</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    <TextField
                        fullWidth
                        label="Código"
                        value={produtoForm.codigo}
                        onChange={(e) => setProdutoForm({ ...produtoForm, codigo: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Descrição"
                        value={produtoForm.descricao}
                        onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                        margin="normal"
                        required
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Unidade de Medida</InputLabel>
                        <Select
                            value={produtoForm.unidadeMedidaId}
                            label="Unidade de Medida"
                            onChange={(e) => setProdutoForm({ ...produtoForm, unidadeMedidaId: e.target.value })}
                        >
                            {unidades.map((u) => (
                                <MenuItem key={u.id} value={u.id}>{u.sigla} - {u.descricao}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancelar</Button>
                    <Button onClick={handleSaveProduto} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Cliente */}
            <Dialog open={formState.type === 'cliente'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Tipo de Pessoa</InputLabel>
                        <Select
                            value={clienteForm.tipoPessoa}
                            label="Tipo de Pessoa"
                            onChange={(e) => setClienteForm({ ...clienteForm, tipoPessoa: e.target.value })}
                        >
                            <MenuItem value="JURIDICA">Jurídica (CNPJ)</MenuItem>
                            <MenuItem value="FISICA">Física (CPF)</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label={clienteForm.tipoPessoa === 'JURIDICA' ? 'Razão Social' : 'Nome'}
                        value={clienteForm.razaoSocial}
                        onChange={(e) => setClienteForm({ ...clienteForm, razaoSocial: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label={clienteForm.tipoPessoa === 'JURIDICA' ? 'CNPJ' : 'CPF'}
                        value={clienteForm.documento}
                        onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })}
                        margin="normal"
                        required
                        placeholder={clienteForm.tipoPessoa === 'JURIDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancelar</Button>
                    <Button onClick={handleSaveCliente} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Unidade de Medida */}
            <Dialog open={formState.type === 'unidade'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Nova Unidade de Medida</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    <TextField
                        fullWidth
                        label="Sigla"
                        value={unidadeForm.sigla}
                        onChange={(e) => setUnidadeForm({ ...unidadeForm, sigla: e.target.value })}
                        margin="normal"
                        required
                        inputProps={{ maxLength: 10 }}
                    />
                    <TextField
                        fullWidth
                        label="Descrição"
                        value={unidadeForm.descricao}
                        onChange={(e) => setUnidadeForm({ ...unidadeForm, descricao: e.target.value })}
                        margin="normal"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancelar</Button>
                    <Button onClick={handleSaveUnidade} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Natureza de Operação */}
            <Dialog open={formState.type === 'natureza'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Nova Natureza de Operação</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {formState.error && <Alert severity="error" sx={{ mb: 2 }}>{formState.error}</Alert>}
                    <TextField
                        fullWidth
                        label="Descrição"
                        value={naturezaForm.descricao}
                        onChange={(e) => setNaturezaForm({ ...naturezaForm, descricao: e.target.value })}
                        margin="normal"
                        required
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Tipo de Movimento</InputLabel>
                        <Select
                            value={naturezaForm.tipoMovimento}
                            label="Tipo de Movimento"
                            onChange={(e) => setNaturezaForm({ ...naturezaForm, tipoMovimento: e.target.value })}
                        >
                            <MenuItem value="ENTRADA">Entrada</MenuItem>
                            <MenuItem value="SAIDA">Saída</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancelar</Button>
                    <Button onClick={handleSaveNatureza} variant="contained" disabled={formState.loading}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}