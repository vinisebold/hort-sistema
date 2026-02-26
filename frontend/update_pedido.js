const fs = require('fs');
const filePath = 'src/pages/NovoPedidoPage.tsx';

let content = fs.readFileSync(filePath, 'utf8');

const oldSection = `        {/* Seção 2: Itens do Pedido */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Produtos
              </Typography>
              <Button 
                startIcon={<Add />} 
                onClick={handleAddItem}
                variant="outlined"
                size="small"
              >
                Adicionar Linha
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '40%' }}>Produto</TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>Quantidade</TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>Vl. Unitário</TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>Subtotal</TableCell>
                    <TableCell align="center" sx={{ width: '10%' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.itens.map((item, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Autocomplete
                          className="product-autocomplete"
                          options={produtos}
                          getOptionLabel={(option) => \`\${option.codigo} - \${option.descricao}\`}
                          value={produtos.find(p => p.id === item.produtoId) || null}
                          onChange={(_, value) => handleUpdateItem(index, 'produtoId', value?.id || 0)}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Selecione um produto" fullWidth />
                          )}
                          sx={{ '& .MuiInputBase-root': { padding: '4px 0' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
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
                          inputProps={{ min: 0.001, step: 0.001, style: { textAlign: 'right' } }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.valorUnitario}
                          onChange={(e) => handleUpdateItem(index, 'valorUnitario', Number(e.target.value))}
                          inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 500 }}>
                          R$ {item.valorTotal.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveItem(index)} 
                          color="error"
                          disabled={form.itens.length === 1 && index === 0}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#fcfcfc' }}>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>TOTAL:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        R$ {calcularTotal().toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>`;

const newSection = `        {/* Seção 2: Itens do Pedido */}
        <Box sx={{ mb: 3, bgcolor: '#f2f4f6', p: 4, borderRadius: 1, border: '1px solid #e0e0e0' }}>
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
                    <TableRow key={index} sx={{ '& td': { borderBottom: '1px solid #ddd' } }}>
                      <TableCell align="center" sx={{ color: '#555' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {item.produtoId === 0 ? (
                          <Autocomplete
                            className="product-autocomplete"
                            options={produtos}
                            getOptionLabel={(option) => \`\${option.codigo} - \${option.descricao}\`}
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
                            sx={{ '& .MuiInputBase-root': { padding: 0 } }}
                          />
                        ) : (
                          <Box>
                            <Typography variant="body1" sx={{ color: '#333', mb: 0.5 }}>
                              {produto?.codigo} - {produto?.descricao}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#0088cc' }}>
                              Venda de Mercadoria - Venda... | Sem informação adicional
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
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
                      </TableCell>
                      <TableCell align="right">
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
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 500, color: '#333' }}>
                          {item.produtoId === 0 ? '0,00' : item.valorTotal.toFixed(2).replace('.', ',')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
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
              onClick={handleAddItem}
              sx={{ 
                bgcolor: '#209b8e', 
                color: '#fff', 
                px: 4, 
                py: 1.5,
                borderRadius: 1,
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1a8479', boxShadow: 'none' }
              }}
            >
              ADICIONAR MAIS UM PRODUTO
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {['Desconto', 'Frete', 'Seguro', 'Outras Despesas'].map((label) => (
              <Box 
                key={label}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: '#dce8e6', 
                  borderRadius: '20px',
                  pr: 2,
                  pl: 0.5,
                  py: 0.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#cddddb' }
                }}
              >
                <Box sx={{ 
                  bgcolor: '#209b8e', 
                  color: '#fff', 
                  width: 24, 
                  height: 24, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mr: 1
                }}>
                  <Add sx={{ fontSize: 16 }} />
                </Box>
                <Typography variant="body2" sx={{ color: '#555', fontWeight: 500 }}>
                  {label} R$ 0,00
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>`;

content = content.replace(oldSection, newSection);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete');
