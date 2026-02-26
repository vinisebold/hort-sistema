const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/export default App\n\nexport default App/g, 'export default App');
fs.writeFileSync('src/App.tsx', appContent);

let novoPedidoContent = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');
novoPedidoContent = novoPedidoContent.replace(/import { Add, Delete, ArrowBack, Close, InfoOutlined } from '@mui\/icons-material'/g, "import { Add, ArrowBack, Close, InfoOutlined } from '@mui/icons-material'");
fs.writeFileSync('src/pages/NovoPedidoPage.tsx', novoPedidoContent);
