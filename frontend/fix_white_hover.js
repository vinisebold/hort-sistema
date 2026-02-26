const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

content = content.replace(
  /bgcolor: '#e8eceb', \/\/ Matches the grey from the image\s+'& \.hover-input:not\(:focus-within\)': \{ bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba\(0,0,0,0\.1\)' \},/g,
  "bgcolor: '#e8eceb',"
);

// I noticed the regex replace before might not have worked perfectly due to whitespace.
// Let's do a more robust replace for the TableRow styling.
const oldRowSx = `<TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    position: 'relative',
    '&:hover': { 
      bgcolor: '#e8eceb', // Matches the grey from the image
      '& .hover-input:not(:focus-within)': { bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd', position: 'relative' } 
  }}>`;

const newRowSx = `<TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    position: 'relative',
    '&:hover': { 
      bgcolor: '#e8eceb',
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd', position: 'relative', p: 0, height: '64px' } 
  }}>`;

// Notice I also set padding to 0 and height to 64px on td, so the absolute positioning fits perfectly without overlapping borders incorrectly.
content = content.replace(oldRowSx, newRowSx);

// Now we need to add padding back to the actual content since we removed it from td.
// For the 1, 2, 3 index column:
content = content.replace(
  /<TableCell align="center" sx={{ color: '#555' }}>/g,
  `<TableCell align="center" sx={{ color: '#555', px: 2 }}>`
);

// For the total:
content = content.replace(
  /<TableCell align="right">\s*<Typography sx={{ fontWeight: 500, color: '#333' }}>/g,
  `<TableCell align="right" sx={{ px: 2 }}>
                        <Typography sx={{ fontWeight: 500, color: '#333' }}>`
);

// For close button:
content = content.replace(
  /<TableCell align="center">\s*<IconButton/g,
  `<TableCell align="center" sx={{ px: 2 }}>
                        <IconButton`
);

// And we must adjust the `.hover-input` non-focused state to have the correct padding so it looks normal when not focused
content = content.replace(
  /px: 1,\s*py: 1,\s*borderRadius: 1,\s*ml: -1,/g,
  `px: 2,
      py: 1,
      height: '100%',
      ml: 0,`
);

content = content.replace(
  /px: 1,\s*py: 1,\s*borderRadius: 1,\s*mr: -1,/g,
  `px: 2,
      py: 1,
      height: '100%',
      mr: 0,`
);

// We should fix the absolute positioning to start exactly from 0 to 0 on td edges.
// With p:0 on td, left and right can be 0.
content = content.replace(/left: '-8px',/g, "left: 0,");
content = content.replace(/right: '-8px',/g, "right: 0,");

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Fixed white hover and improved height layout');
