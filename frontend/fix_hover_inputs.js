const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// 1. Add EditOutlined to imports
content = content.replace(
  "import { ArrowBack, Close, InfoOutlined } from '@mui/icons-material'",
  "import { ArrowBack, Close, InfoOutlined, EditOutlined } from '@mui/icons-material'"
);

// 2. Update TableRow sx to handle .hover-input and .edit-icon
content = content.replace(
  /<TableRow key=\{index\} sx=\{\{ transition: 'background-color 0\.2s', '&:hover': \{ bgcolor: '#f5f5f5' \}, '& td': \{ borderBottom: '1px solid #ddd' \} \}\}>/g,
  `<TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    '&:hover': { 
      bgcolor: '#f5f5f5',
      '& .hover-input': { bgcolor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd' } 
  }}>`
);

// 3. Update Autocomplete rendering (produtoId === 0)
const autocompleteOld = `{item.produtoId === 0 ? (
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
                        ) : (`;

const autocompleteNew = `{item.produtoId === 0 ? (
                          <Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', transition: 'all 0.2s', px: 1, py: 0.5, borderRadius: 1, ml: -1 }}>
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
                              sx={{ flex: 1, '& .MuiInputBase-root': { padding: 0 } }}
                            />
                            <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 18, color: '#aaa', transition: 'opacity 0.2s' }} />
                          </Box>
                        ) : (`;
content = content.replace(autocompleteOld, autocompleteNew);

// 4. Update Product text rendering (produtoId !== 0)
const productBoxOld = `<Box>
                            <Typography variant="body1" sx={{ color: '#333', mb: 0.5 }}>
                              {produto?.codigo} - {produto?.descricao}
                            </Typography>
                            
                          </Box>`;

const productBoxNew = `<Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', transition: 'all 0.2s', px: 1, py: 0.5, borderRadius: 1, ml: -1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ color: '#333', mb: 0.5 }}>
                                {produto?.codigo} - {produto?.descricao}
                              </Typography>
                            </Box>
                            <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 18, color: '#aaa', transition: 'opacity 0.2s' }} />
                          </Box>`;
content = content.replace(productBoxOld, productBoxNew);


// 5. Update Quantity input rendering
const qtyZeroOld = `{item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333' }}>0,00</Typography>
                        ) : (
                          <TextField`;
                          
const qtyZeroNew = `{item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333', px: 1, py: 0.5 }}>0,00</Typography>
                        ) : (
                          <Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', transition: 'all 0.2s', px: 1, py: 0.5, borderRadius: 1, mr: -1 }}>
                            <TextField`;

content = content.replace(qtyZeroOld, qtyZeroNew);

const qtyEndOld = `                            inputProps={{ min: 0.001, step: 0.001, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                        )}`;

const qtyEndNew = `                            inputProps={{ min: 0.001, step: 0.001, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                          <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 18, color: '#aaa', transition: 'opacity 0.2s' }} />
                        </Box>
                        )}`;
content = content.replace(qtyEndOld, qtyEndNew);

// 6. Update Price input rendering
const priceZeroOld = `{item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333' }}>0,00</Typography>
                        ) : (
                          <TextField`;

const priceZeroNew = `{item.produtoId === 0 ? (
                          <Typography sx={{ color: '#333', px: 1, py: 0.5 }}>0,00</Typography>
                        ) : (
                          <Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', transition: 'all 0.2s', px: 1, py: 0.5, borderRadius: 1, mr: -1 }}>
                            <TextField`;
content = content.replace(priceZeroOld, priceZeroNew);

const priceEndOld = `                            InputProps={{ disableUnderline: true }}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                        )}`;

const priceEndNew = `                            InputProps={{ disableUnderline: true }}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />
                          <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 18, color: '#aaa', transition: 'opacity 0.2s' }} />
                        </Box>
                        )}`;
content = content.replace(priceEndOld, priceEndNew);

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Update completed');
