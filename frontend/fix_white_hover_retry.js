const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// Retry removing the white hover and adjusting td padding
content = content.replace(
  /<TableRow key=\{index\} sx=\{\{\s*transition: 'background-color 0\.2s',\s*position: 'relative',\s*'&:hover': \{\s*bgcolor: '#e8eceb', \/\/ Matches the grey from the image\s*'& \.hover-input:not\(:focus-within\)': \{ bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba\(0,0,0,0\.1\)' \},\s*'& \.edit-icon': \{ opacity: 1 \}\s*\},\s*'& td': \{ borderBottom: '1px solid #ddd', position: 'relative' \} \s*\}\}>/,
  `<TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    position: 'relative',
    '&:hover': { 
      bgcolor: '#e8eceb',
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd', position: 'relative', p: 0, height: '64px' } 
  }}>`
);

// If the above replace didn't work, try another format
content = content.replace(
  /<TableRow key=\{index\} sx=\{\{ \n    transition: 'background-color 0\.2s', \n    position: 'relative',\n    '&:hover': \{ \n      bgcolor: '#e8eceb', \/\/ Matches the grey from the image\n      '& \.edit-icon': \{ opacity: 1 \}\n    \}, \n    '& td': \{ borderBottom: '1px solid #ddd', position: 'relative' \} \n  \}\}>/g,
  `<TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    position: 'relative',
    '&:hover': { 
      bgcolor: '#e8eceb',
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd', position: 'relative', p: 0, height: '64px' } 
  }}>`
);


// And fix the TableCell sx py: 2 to just sx={{ }} so it gets p:0 from row
content = content.replace(
  /<TableCell sx={{ py: 2 }}>/g,
  `<TableCell>`
);

// Empty cell 0,00 needs height 100% and px 2 to match
content = content.replace(
  /<Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1, py: 1, borderRadius: 1, mr: -1, borderBottom: '2px solid transparent' }}>/g,
  `<Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%', px: 2, borderBottom: '2px solid transparent' }}>`
);


// The autocomplete has padding 0, but the container should have px:2
content = content.replace(
  /sx={{ flex: 1, '& \.MuiInputBase-root': { padding: 0 } }}/g,
  `sx={{ flex: 1, '& .MuiInputBase-root': { padding: 0 } }}`
);

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Retry table formatting');
