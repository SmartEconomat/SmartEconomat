const { Client } = require('pg');
const client = new Client({
  connectionString:
    'postgresql://smarteconomat:smarteconomat@localhost:5432/smarteconomat',
});
async function test() {
  await client.connect();
  const res = await client.query(
    "SELECT id, batch_id, pedido_usuario_id FROM pedido WHERE estado = 'por_recepcionar' LIMIT 5;"
  );
  console.log(res.rows);
  await client.end();
}
test().catch(console.error);
