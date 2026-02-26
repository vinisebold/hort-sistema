const fs = require('fs');
let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

// I want to make the elevated box effect more similar to the image:
// - Grey background when the row is normally hovered (or selected)
// - When the input is focused, the input cell has a larger white background, small shadow, and bottom teal border.
// - The "Edit" pencil icon is shown to the left of the input text
// Also the quantity input size needs to be a bit bigger to accommodate the label like '30.00 Kg'. 80px might be too small, let's use a min-width and auto-width.

content = content.replace(
  /width: '80px',/g,
  "minWidth: '90px',"
);

// We need to wrap the whole cell content into a Box that elevates, right now it elevates just the input root, which is fine, but maybe it needs padding.
content = content.replace(
  /transform: 'scale\(1\.05\)',/g,
  ""
);

content = content.replace(
  /bgcolor: '#fff',/g,
  "bgcolor: '#f5f7f9',"
);

content = content.replace(
  /boxShadow: '0 4px 12px rgba\(0,0,0,0\.15\)',/g,
  "boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',"
);

// Also let's put the edit icon in the "Produto" cell as well, as in the image there is an edit icon there.
// No, the image only has pencil icons on "Quantidade" and "Preço" according to what we saw. Wait, looking at the image:
// Yes, next to "1,00 Kg" there is a pencil. Wait, actually the pencil is to the *left* of the white box.
// And next to "8,00" there is a pencil to the *right*? No, the pencil is always before the value if it's right-aligned, or maybe after.
// In the image, the pencil is to the left of "1,00 Kg" and to the left of "8,00". No, wait.
// For Preço, the pencil is on the right of "8,00"! Let's just keep them to the left to be consistent, or left for Qtd and right for Preço? The image is a bit small.
// Actually, looking at the image:
// "65 - abacate" cell has a pencil on the far right.
// "1,00 Kg" cell has the popover over it. 
// "8,00" (Preço) cell has a pencil on the *right*.
// Let's add the pencil on the right for Preço, and left for Qtd as we did, or right for both.
// Let's do right for both.

const oldQtdContent = `<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Edit className="edit-icon" sx={{ fontSize: 16, color: '#bbb', mr: 1, opacity: 0, transition: 'opacity 0.2s' }} />`;
const newQtdContent = `<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>`;

const oldPrecoContent = `<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Edit className="edit-icon" sx={{ fontSize: 16, color: '#bbb', mr: 1, opacity: 0, transition: 'opacity 0.2s' }} />`;
const newPrecoContent = `<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>`;

content = content.replace(oldQtdContent, newQtdContent);
content = content.replace(oldPrecoContent, newPrecoContent);

// Add edit icon as an endAdornment to both or right beside the text
// Actually, putting it in a Box right after TextField is easier.
const oldQtdEnd = `sx={{
                                minWidth: '90px',`;
const newQtdEnd = `sx={{
                                minWidth: '90px',
                                mr: 1,`;
content = content.replace(oldQtdEnd, newQtdEnd);

const oldPrecoEnd = `sx={{
                                minWidth: '90px',`;
const newPrecoEnd = `sx={{
                                minWidth: '90px',
                                mr: 1,`;
content = content.replace(oldPrecoEnd, newPrecoEnd);

// Let's manually add the icon back after TextField
const oldQtdBoxEnd = `/>
                          </Box>`;
const newQtdBoxEnd = `/>
                            <Edit className="edit-icon" sx={{ fontSize: 16, color: '#bbb', opacity: 0, transition: 'opacity 0.2s', position: 'absolute', right: -20 }} />
                          </Box>`;
content = content.replace(oldQtdBoxEnd, newQtdBoxEnd);
content = content.replace(oldQtdBoxEnd, newQtdBoxEnd); // do it twice, for preco as well.

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content);
console.log('Styles fixed');
