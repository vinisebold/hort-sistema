import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Fab, Card, CardContent, Typography
} from '@mui/material'
import { Add, Edit, TrendingUp, TrendingDown } from '@mui/icons-material'
import { naturezasApi } from '../services/api'
import { NaturezaOperacao } from '../types'

export default function NaturezasOperacaoPage() {
  const navigate = useNavigate()
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>([])

  useEffect(() => {
    loadNaturezas().catch(console.error)
  }, [])

  const loadNaturezas = async () => {
    try {
      const response = await naturezasApi.listar()
      setNaturezas(response.data)
    } catch (error) {
      console.error('Erro ao carregar naturezas:', error)
    }
  }


  const getTipoChip = (tipo: string) => {
    if (tipo === 'ENTRADA') {
      return <Chip icon={<TrendingUp />} label="Entrada" color="success" size="small" sx={{ fontSize: '0.75rem' }} />
    }
    return <Chip icon={<TrendingDown />} label="Saída" color="warning" size="small" sx={{ fontSize: '0.75rem' }} />
  }

  const getPropriedadeLabel = (campo: string, propriedade: 'DESATIVADO' | 'OPCIONAL' | 'OBRIGATORIO') => {
    if (propriedade === 'OBRIGATORIO') return `${campo}: Obrigatório`
    if (propriedade === 'OPCIONAL') return `${campo}: Opcional`
    return `${campo}: Desativado`
  }

  const getPropriedadeColor = (propriedade: 'DESATIVADO' | 'OPCIONAL' | 'OBRIGATORIO') => {
    if (propriedade === 'OBRIGATORIO') return { bgcolor: '#e8f5e9', color: '#2e7d32' }
    if (propriedade === 'OPCIONAL') return { bgcolor: '#fff8e1', color: '#ef6c00' }
    return { bgcolor: '#eceff1', color: '#607d8b' }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 300, color: '#333', mb: 1 }}>
          Naturezas de Operação
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          Configure os tipos de operações e suas regras de movimentação
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                    Operação
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 150 }}>
                    Tipo
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#555', bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 280 }}>
                    Campos Obrigatórios
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fafafa', borderBottom: '2px solid #ddd', width: 80 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {naturezas.map((natureza) => (
                  <TableRow 
                    key={natureza.id}
                    sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
                          {natureza.descricao}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          ID: {natureza.id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getTipoChip(natureza.tipoMovimento)}
                    </TableCell>
                      <TableCell>
                       <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip
                          label={getPropriedadeLabel('Cliente', natureza.propriedadeCliente)}
                          size="small"
                          sx={{ fontSize: '0.75rem', border: 'none', '& .MuiChip-label': { px: 1.5 }, ...getPropriedadeColor(natureza.propriedadeCliente) }}
                        />
                        <Chip
                          label={getPropriedadeLabel('Valor Unitário', natureza.propriedadeValorUnitario)}
                          size="small"
                          sx={{ fontSize: '0.75rem', border: 'none', '& .MuiChip-label': { px: 1.5 }, ...getPropriedadeColor(natureza.propriedadeValorUnitario) }}
                        />
                        <Chip
                          label={getPropriedadeLabel('Status', natureza.propriedadeStatus)}
                          size="small"
                          sx={{ fontSize: '0.75rem', border: 'none', '& .MuiChip-label': { px: 1.5 }, ...getPropriedadeColor(natureza.propriedadeStatus) }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => navigate(`/naturezas-operacao/${natureza.id}/editar`)} size="small" title="Editar">
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ color: '#555', fontSize: '0.95rem' }}>
              Exibindo {naturezas.length} de {naturezas.length}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Fab color="primary" aria-label="add" onClick={() => navigate('/naturezas-operacao/novo')} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>
    </Box>
  )
}
