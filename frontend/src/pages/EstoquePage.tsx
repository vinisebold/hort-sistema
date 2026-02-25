import { useEffect, useState } from 'react'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Collapse } from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { estoqueApi } from '../services/api'

interface ProdutoEstoque {
  id: number
  codigo: string
  descricao: string
  unidadeMedidaSigla: string
  estoqueAtual: number
  isActive: boolean
}

interface Movimentacao {
  id: number
  produtoId: number
  produtoDescricao: string
  naturezaOperacaoDescricao: string
  tipoMovimento: string
  pedidoId: number | null
  quantidade: number
  estoqueAposMovimentacao: number
  dataMovimentacao: string
}

function Row({ produto, onExpand, expanded, movimentacoes }: { produto: ProdutoEstoque; onExpand: () => void; expanded: boolean; movimentacoes: Movimentacao[] }) {
  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={onExpand}>
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{produto.codigo}</TableCell>
        <TableCell>{produto.descricao}</TableCell>
        <TableCell>{produto.unidadeMedidaSigla}</TableCell>
        <TableCell align="right">
          <Chip
            label={produto.estoqueAtual}
            color={produto.estoqueAtual > 0 ? 'success' : 'error'}
            size="small"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, bgcolor: '#f9f9f9' }}>
          <Collapse in={expanded} timeout="auto">
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Histórico de Movimentações
              </Typography>
              {movimentacoes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma movimentação encontrada
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Natureza</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Quantidade</TableCell>
                      <TableCell align="right">Estoque Após</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>{new Date(mov.dataMovimentacao).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{mov.naturezaOperacaoDescricao}</TableCell>
                        <TableCell>
                          <Chip
                            label={mov.tipoMovimento}
                            color={mov.tipoMovimento === 'ENTRADA' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{mov.quantidade}</TableCell>
                        <TableCell align="right">{mov.estoqueAposMovimentacao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Record<number, Movimentacao[]>>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    loadProdutos()
  }, [])

  const loadProdutos = async () => {
    try {
      const response = await estoqueApi.listarProdutos()
      setProdutos(response.data)
    } catch (error) {
      console.error('Erro ao carregar estoque:', error)
    }
  }

  const handleExpand = async (produtoId: number) => {
    if (expandedId === produtoId) {
      setExpandedId(null)
      return
    }

    setExpandedId(produtoId)

    if (!movimentacoes[produtoId]) {
      try {
        const response = await estoqueApi.timeline(produtoId)
        setMovimentacoes(prev => ({ ...prev, [produtoId]: response.data }))
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error)
      }
    }
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Código</TableCell>
              <TableCell>Produto</TableCell>
              <TableCell>Unidade</TableCell>
              <TableCell align="right">Estoque Atual</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produtos.map((produto) => (
              <Row
                key={produto.id}
                produto={produto}
                expanded={expandedId === produto.id}
                onExpand={() => handleExpand(produto.id)}
                movimentacoes={movimentacoes[produto.id] || []}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
