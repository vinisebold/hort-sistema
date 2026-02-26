const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// 1. Change Box to Card, remove the hardcoded background and border
content = content.replace(
  /<Box sx={{ mb: 3, bgcolor: '#f2f4f6', p: 4, borderRadius: 1, border: '1px solid #e0e0e0' }}>/g,
  '<Card sx={{ mb: 3 }}><CardContent sx={{ p: 3 }}>'
);

// We need to also replace the closing </Box> of this section with </CardContent></Card>
// Let's do a more robust regex or direct text replacement
let oldSectionEnd = `          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
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

let newSectionEnd = `        </CardContent></Card>`;
content = content.replace(oldSectionEnd, newSectionEnd);

// If the previous replace failed because it didn't match exactly, fallback:
if (content.includes("['Desconto', 'Frete', 'Seguro', 'Outras Despesas']")) {
    console.log("Fallback replacement for the end block");
    content = content.replace(/<Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>[\s\S]*?<\/Box>\s*<\/Box>/, '</CardContent></Card>');
}


// 2. Add Hover to TableRow
content = content.replace(
  /<TableRow key={index} sx={{ '& td': { borderBottom: '1px solid #ddd' } }}>/g,
  "<TableRow key={index} sx={{ '& td': { borderBottom: '1px solid #ddd', transition: 'background-color 0.2s' }, '&:hover': { bgcolor: 'action.hover' } }}>"
);

// 3. Remove "Sem transação | Sem informação adicional"
content = content.replace(
  /<Typography variant="body2" sx={{ color: '#0088cc' }}>\s*\{form\.naturezaOperacaoId \? \(naturezas\.find\(n => n\.id === Number\(form\.naturezaOperacaoId\)\)\?\.descricao \+ ' \| Sem informação adicional'\) : 'Sem transação \| Sem informação adicional'\}\s*<\/Typography>/g,
  ''
);

// 4. Change inputs to not have arrows, and update colors to match the theme (remove specific hardcoded colors where unnecessary or adjust)
const quantityInputOld = `<TextField
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
                          />`;

const quantityInputNew = `<TextField
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
                            sx={{
                              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { 
                                display: 'none', 
                                WebkitAppearance: 'none', 
                                margin: 0 
                              }, 
                              '& input[type=number]': { 
                                MozAppearance: 'textfield' 
                              }
                            }}
                            InputProps={{ 
                              disableUnderline: true,
                              endAdornment: <Typography sx={{ ml: 0.5, color: '#555' }}>{produto?.unidadeMedida?.sigla || 'Un'}</Typography>
                            }}
                            inputProps={{ min: 0.001, step: 0.001, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />`;

const priceInputOld = `<TextField
                            type="number"
                            value={item.valorUnitario}
                            onChange={(e) => handleUpdateItem(index, 'valorUnitario', Number(e.target.value))}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />`;

const priceInputNew = `<TextField
                            type="number"
                            value={item.valorUnitario}
                            onChange={(e) => handleUpdateItem(index, 'valorUnitario', Number(e.target.value))}
                            variant="standard"
                            sx={{
                              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { 
                                display: 'none', 
                                WebkitAppearance: 'none', 
                                margin: 0 
                              }, 
                              '& input[type=number]': { 
                                MozAppearance: 'textfield' 
                              }
                            }}
                            InputProps={{ disableUnderline: true }}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', color: '#333' } }}
                            fullWidth
                          />`;

content = content.replace(quantityInputOld, quantityInputNew);
content = content.replace(priceInputOld, priceInputNew);

// Change the custom button to standard primary theme button
content = content.replace(
  /<Button \s*variant="contained" \s*onClick={handleAddItem}\s*sx={{\s*bgcolor: '#209b8e',\s*color: '#fff',\s*px: 4,\s*py: 1\.5,\s*borderRadius: 1,\s*fontWeight: 600,\s*boxShadow: 'none',\s*'&:hover': \{ bgcolor: '#1a8479', boxShadow: 'none' \}\s*}}\s*>/g,
  `<Button 
              variant="contained" 
              color="primary"
              onClick={handleAddItem}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 1,
                fontWeight: 600,
                boxShadow: 'none',
              }}
            >`
);

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Modification complete');
