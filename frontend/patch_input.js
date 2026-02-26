const fs = require('fs');
let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

content = content.replace(
  "import { Add, ArrowBack, Close, InfoOutlined } from '@mui/icons-material'",
  "import { Add, ArrowBack, Close, InfoOutlined, Edit } from '@mui/icons-material'"
);

// We want to style the inputs. Let's find the TableBody map return block
const tableBodyMatch = content.match(/<TableBody>[\s\S]*?<\/TableBody>/);
if (tableBodyMatch) {
  let tb = tableBodyMatch[0];

  // We are going to replace the Quantidade and ValorUnitario cells.
  // First, find the Quantidade TableCell
  const oldQuantidade = `<TableCell align="right">
                        {item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333' }}>0,00</Typography>
                        ) : (
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
                            InputProps={{ 
                              disableUnderline: true,
                              endAdornment: <Typography sx={{ ml: 0.5, color: '#555' }}>{produto?.unidadeMedida?.sigla || 'Un'}</Typography>
                            }}
                            inputProps={{ min: 0.001, step: 0.001, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                        )}
                      </TableCell>`;

  const newQuantidade = `<TableCell align="right" sx={{ position: 'relative', '&:hover .edit-icon': { opacity: 1 } }}>
                        {item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333' }}>0,00</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Edit className="edit-icon" sx={{ fontSize: 16, color: '#bbb', mr: 1, opacity: 0, transition: 'opacity 0.2s' }} />
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
                              InputProps={{ 
                                disableUnderline: true,
                                endAdornment: <Typography sx={{ ml: 0.5, color: '#555' }}>{produto?.unidadeMedida?.sigla || 'Un'}</Typography>
                              }}
                              inputProps={{ min: 0.001, step: 0.001, style: { textAlign: 'right', color: '#333' } }}
                              sx={{
                                width: '80px',
                                '& .MuiInputBase-root': {
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 0,
                                  transition: 'all 0.2s',
                                  '&.Mui-focused': {
                                    bgcolor: '#fff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 10,
                                    borderBottom: '2px solid #209b8e',
                                    transform: 'scale(1.05)',
                                  }
                                }
                              }}
                            />
                          </Box>
                        )}
                      </TableCell>`;

  const oldValorUnitario = `<TableCell align="right">
                        {item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333' }}>0,00</Typography>
                        ) : (
                          <TextField
                            type="number"
                            value={item.valorUnitario}
                            onChange={(e) => handleUpdateItem(index, 'valorUnitario', Number(e.target.value))}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                        )}
                      </TableCell>`;

  const newValorUnitario = `<TableCell align="right" sx={{ position: 'relative', '&:hover .edit-icon': { opacity: 1 } }}>
                        {item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333' }}>0,00</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Edit className="edit-icon" sx={{ fontSize: 16, color: '#bbb', mr: 1, opacity: 0, transition: 'opacity 0.2s' }} />
                            <TextField
                              type="number"
                              value={item.valorUnitario}
                              onChange={(e) => handleUpdateItem(index, 'valorUnitario', Number(e.target.value))}
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                              inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', color: '#333' } }}
                              sx={{
                                width: '80px',
                                '& .MuiInputBase-root': {
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 0,
                                  transition: 'all 0.2s',
                                  '&.Mui-focused': {
                                    bgcolor: '#fff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 10,
                                    borderBottom: '2px solid #209b8e',
                                    transform: 'scale(1.05)',
                                  }
                                }
                              }}
                            />
                          </Box>
                        )}
                      </TableCell>`;

  tb = tb.replace(oldQuantidade, newQuantidade);
  tb = tb.replace(oldValorUnitario, newValorUnitario);

  content = content.replace(tableBodyMatch[0], tb);
}

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content);
console.log('Update inputs done');
