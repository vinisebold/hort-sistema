const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// Update TableRow hover styles
const rowStyleOld = `<TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    '&:hover': { 
      bgcolor: '#f5f5f5',
      '& .hover-input': { bgcolor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd' } 
  }}>`;

const rowStyleNew = `<TableRow key={index} sx={{ 
    transition: 'background-color 0.2s', 
    position: 'relative',
    '&:hover': { 
      bgcolor: '#e8eceb', // Matches the grey from the image
      '& .hover-input:not(:focus-within)': { bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      '& .edit-icon': { opacity: 1 }
    }, 
    '& td': { borderBottom: '1px solid #ddd', position: 'relative' } 
  }}>`;
content = content.replace(rowStyleOld, rowStyleNew);

// Function to replace Box styles for popout effect
const replaceBoxStyles = () => {
  // Autocomplete Box
  content = content.replace(
    /<Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', transition: 'all 0.2s', px: 1, py: 0.5, borderRadius: 1, ml: -1 }}>/g,
    `<Box className="hover-input" sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      transition: 'all 0.2s', 
      px: 1, 
      py: 1, 
      borderRadius: 1, 
      ml: -1,
      borderBottom: '2px solid transparent',
      '&:focus-within': {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        transform: 'translateY(-50%)',
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        py: 2,
        borderRadius: '4px 4px 0 0',
      }
    }}>`
  );

  // Quantity and Price Box (with justifyContent flex-end)
  content = content.replace(
    /<Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', transition: 'all 0.2s', px: 1, py: 0.5, borderRadius: 1, mr: -1 }}>/g,
    `<Box className="hover-input" sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-end', 
      transition: 'all 0.2s', 
      px: 1, 
      py: 1, 
      borderRadius: 1, 
      mr: -1,
      borderBottom: '2px solid transparent',
      '&:focus-within': {
        position: 'absolute',
        top: '50%',
        left: -10,
        right: -10,
        transform: 'translateY(-50%)',
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        py: 2,
        borderRadius: '4px 4px 0 0',
      }
    }}>`
  );
};

replaceBoxStyles();

// Ensure empty 0,00 also has the hover-input class so it highlights on hover and has the pencil
content = content.replace(
  /<Typography sx={{ color: '#333', px: 1, py: 0\.5 }}>0,00<\/Typography>/g,
  `<Box className="hover-input" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1, py: 1, borderRadius: 1, mr: -1, borderBottom: '2px solid transparent' }}>
    <Typography sx={{ color: '#333' }}>0,00</Typography>
    <EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa' }} />
  </Box>`
);

// We need to fix the edit-icon styling slightly to make it look exactly like the image
content = content.replace(
  /<EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 18, color: '#aaa', transition: 'opacity 0.2s' }} \/>/g,
  `<EditOutlined className="edit-icon" sx={{ opacity: 0, ml: 1, fontSize: 16, color: '#aaa', transition: 'opacity 0.2s' }} />`
);


// Replace the "Sem transação | Sem informação adicional" for Product display because it was in Image 1!
// Image 1: `Sem transação | Sem informação adicional` is visible in blue below the product name.
// Wait, the prompt said "retire o texto desnecessario Sem transação | Sem informação adicional".
// I will NOT add it back. The user specifically asked to remove it in the PREVIOUS prompt. They are just using old images to show the HOVER state.

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Update inputs completed');
