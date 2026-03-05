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
                        {natureza.exigeCliente && (
                          <Chip 
                            label="Cliente" 
                            size="small" 
                            sx={{ 
                              fontSize: '0.75rem',
                              bgcolor: '#e0e0e0',
                              color: '#555',
                              border: 'none',
                              '& .MuiChip-label': { px: 1.5 }
                            }} 
                          />
                        )}
                        {natureza.exigeValorUnitario && (
                          <Chip 
                            label="Valor Unitário" 
                            size="small" 
                            sx={{ 
                              fontSize: '0.75rem',
                              bgcolor: '#e0e0e0',
                              color: '#555',
                              border: 'none',
                              '& .MuiChip-label': { px: 1.5 }
                            }} 
                          />
                        )}
                        {natureza.exigeStatus && (
                          <Chip 
                            label="Status Pagamento" 
                            size="small" 
                            sx={{ 
                              fontSize: '0.75rem',
                              bgcolor: '#e0e0e0',
                              color: '#555',
                              border: 'none',
                              '& .MuiChip-label': { px: 1.5 }
                            }} 
                          />
                        )}
                        {!natureza.exigeCliente && !natureza.exigeValorUnitario && !natureza.exigeStatus && (
                          <Typography variant="body2" sx={{ fontSize: '0.813rem', color: '#aaa', fontStyle: 'italic' }}>
                            Nenhum campo obrigatório
                          </Typography>
                        )}
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
        </CardContent>
      </Card>

      <Fab color="primary" aria-label="add" onClick={() => navigate('/naturezas-operacao/novo')} sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Add />
      </Fab>
    </Box>
  )
}
