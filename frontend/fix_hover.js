const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// The hover was actually applied incorrectly, modifying the existing TableRow sx.
content = content.replace(
  /<TableRow key={index} sx={{ '& td': { borderBottom: '1px solid #ddd', transition: 'background-color 0.2s' }, '&:hover': { bgcolor: 'action.hover' } }}>/g,
  "<TableRow key={index} sx={{ transition: 'background-color 0.2s', '&:hover': { bgcolor: '#f5f5f5' }, '& td': { borderBottom: '1px solid #ddd' } }}>"
);

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Fixed hover');
