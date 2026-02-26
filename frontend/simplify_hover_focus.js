const fs = require('fs');

let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// 1. Remove the white hover effect on inputs
content = content.replace(
  /bgcolor: '#e8eceb', \/\/ Matches the grey from the image\n\s*'& \.hover-input:not\(:focus-within\)': \{ bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba\(0,0,0,0\.1\)' \},/g,
  "bgcolor: '#e8eceb', // Matches the grey from the image"
);

// 2. Fix the jitter and height issues on focus.
// The easiest way to make it exactly the height of the item without jitter 
// is to use absolute positioning stretching from top to bottom (top: 0, bottom: -1px to cover border),
// but since the parent is a table cell, it might be easier to just NOT use absolute positioning
// and instead just use negative margins or just change the background in place.
// Let's use position absolute, but stretch it.
const oldFocusStyleLeft = `      '&:focus-within': {
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
        '& .edit-icon': { opacity: '0 !important' },
      }`;

const newFocusStyleLeft = `      '&:focus-within': {
        position: 'absolute',
        top: 0,
        bottom: '-1px', // Cover the border
        left: '-8px',
        right: '-8px',
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 0,
        '& .edit-icon': { opacity: '0 !important' },
      }`;
content = content.replace(new RegExp(oldFocusStyleLeft.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'), 'g'), newFocusStyleLeft);

const oldFocusStyleRight = `      '&:focus-within': {
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
        '& .edit-icon': { opacity: '0 !important' },
      }`;

const newFocusStyleRight = `      '&:focus-within': {
        position: 'absolute',
        top: 0,
        bottom: '-1px',
        left: '-8px',
        right: '-8px',
        zIndex: 10,
        bgcolor: '#e8eceb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '2px solid #209b8e',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderRadius: 0,
        '& .edit-icon': { opacity: '0 !important' },
      }`;
content = content.replace(new RegExp(oldFocusStyleRight.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'), 'g'), newFocusStyleRight);

// We need to make sure TableCell padding is removed so the cell is tightly fitting, 
// OR we rely on position absolute within the relatively positioned TableCell.
// Since we used top:0, bottom:-1px, absolute positioning inside the relative TableCell, it will stretch EXACTLY to the cell bounds.

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content, 'utf8');
console.log('Fixed jitter and focus styles');
