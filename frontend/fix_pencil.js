const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// Hide pencil when focused
content = content.replace(
  /bgcolor: '#e8eceb',\n\s*boxShadow: '0 4px 20px rgba\(0,0,0,0\.15\)',\n\s*borderBottom: '2px solid #209b8e',\n\s*px: 2,\n\s*py: 2,\n\s*borderRadius: '4px 4px 0 0',\n\s*}/g,
  `bgcolor: '#e8eceb',\n        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',\n        borderBottom: '2px solid #209b8e',\n        px: 2,\n        py: 2,\n        borderRadius: '4px 4px 0 0',\n        '& .edit-icon': { opacity: '0 !important' },\n      }`
);

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Fixed pencil focus state');
