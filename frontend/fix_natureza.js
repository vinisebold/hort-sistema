const fs = require('fs');
let content = fs.readFileSync('src/pages/NovoPedidoPage.tsx', 'utf8');

content = content.replace(
  /Venda de Mercadoria - Venda\.\.\. \| Sem informação adicional/g,
  `{form.naturezaOperacaoId ? (naturezas.find(n => n.id === Number(form.naturezaOperacaoId))?.descricao + ' | Sem informação adicional') : 'Sem transação | Sem informação adicional'}`
);

fs.writeFileSync('src/pages/NovoPedidoPage.tsx', content);
