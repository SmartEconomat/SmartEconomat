#!/usr/bin/env bash
set -euo pipefail

BASE=http://localhost:3001
jq --version >/dev/null 2>&1 || { echo "Please install jq to run this script." >&2; exit 1; }

echo "Testing API at $BASE"

# Helper to pretty print
pp() { echo; echo "--- $1"; }

# 1) Productos CRUD
pp "GET /productos"
curl -sS "$BASE/productos" | jq . | sed -n '1,6p'

PROD_NAME="ScriptProduct_$(date +%s)"
pp "POST /productos -> $PROD_NAME"
prod_id=$(curl -sS -X POST "$BASE/productos" -H 'Content-Type: application/json' -d "{\"nombre\":\"$PROD_NAME\"}" | jq -r '.id')

echo "Created product id: $prod_id"
pp "GET /productos/$prod_id"
curl -sS "$BASE/productos/$prod_id" | jq .

pp "PATCH /productos/$prod_id"
curl -sS -X PATCH "$BASE/productos/$prod_id" -H 'Content-Type: application/json' -d '{"nombre":"Updated_'$PROD_NAME'"}' | jq .

pp "DELETE /productos/$prod_id"
curl -sS -X DELETE "$BASE/productos/$prod_id" -w "\nHTTP status: %{http_code}\n"

# 2) Proveedores CRUD
pp "GET /proveedores"
curl -sS "$BASE/proveedores" | jq . | sed -n '1,6p'

PROV_NAME="ScriptProveedor_$(date +%s)"
pp "POST /proveedores -> $PROV_NAME"
prov_id=$(curl -sS -X POST "$BASE/proveedores" -H 'Content-Type: application/json' -d "{\"nombre\":\"$PROV_NAME\"}" | jq -r '.id')

echo "Created proveedor id: $prov_id"
pp "GET /proveedores/$prov_id"
curl -sS "$BASE/proveedores/$prov_id" | jq .

pp "PATCH /proveedores/$prov_id"
curl -sS -X PATCH "$BASE/proveedores/$prov_id" -H 'Content-Type: application/json' -d '{"contacto":"Contacto Script"}' | jq .

pp "DELETE /proveedores/$prov_id"
curl -sS -X DELETE "$BASE/proveedores/$prov_id" -w "\nHTTP status: %{http_code}\n"

# 3) Usuarios CRUD
pp "GET /usuarios"
users_json=$(curl -sS "$BASE/usuarios")
echo "$users_json" | jq . | sed -n '1,6p'

USER_NAME="scriptuser_$(date +%s)"
pp "POST /usuarios -> $USER_NAME"
user_id=$(curl -sS -X POST "$BASE/usuarios" -H 'Content-Type: application/json' -d "{\"nombre\":\"Script User\",\"username\":\"$USER_NAME\",\"password\":\"secret123\",\"rol\":\"admin\",\"email\":\"$USER_NAME@example.com\"}" | jq -r '.id')

echo "Created user id: $user_id"
pp "GET /usuarios/$user_id"
curl -sS "$BASE/usuarios/$user_id" | jq .

pp "PATCH /usuarios/$user_id"
curl -sS -X PATCH "$BASE/usuarios/$user_id" -H 'Content-Type: application/json' -d '{"nombre":"Script User Updated"}' | jq .

# 4) Recepciones: need an existing user id -> take first from list if necessary
pp "GET /recepciones"
curl -sS "$BASE/recepciones" | jq . | sed -n '1,6p'

receiver_id=${user_id}
pp "POST /recepciones with idUsuarioReceptor=$receiver_id"
recepcion_resp=$(curl -sS -X POST "$BASE/recepciones" -H 'Content-Type: application/json' -d "{\"idUsuarioReceptor\":\"$receiver_id\",\"observaciones\":\"Script creada\"}")

echo "$recepcion_resp" | jq .
recepcion_id=$(echo "$recepcion_resp" | jq -r '.id')

pp "GET /recepciones/$recepcion_id"
curl -sS "$BASE/recepciones/$recepcion_id" | jq .

pp "PATCH /recepciones/$recepcion_id"
curl -sS -X PATCH "$BASE/recepciones/$recepcion_id" -H 'Content-Type: application/json' -d '{"observaciones":"Actualizada por script"}' | jq .

pp "DELETE /recepciones/$recepcion_id"
curl -sS -X DELETE "$BASE/recepciones/$recepcion_id" -w "\nHTTP status: %{http_code}\n"

# 5) Albaranes CRUD
pp "GET /albaranes"
curl -sS "$BASE/albaranes" | jq . | sed -n '1,6p'

ALB_NUM="ALB_$(date +%s)"
pp "POST /albaranes -> $ALB_NUM"
albaran_id=$(curl -sS -X POST "$BASE/albaranes" -H 'Content-Type: application/json' -d "{\"nAlbaran\":\"$ALB_NUM\"}" | jq -r '.id')

echo "Created albaran id: $albaran_id"
pp "GET /albaranes/$albaran_id"
curl -sS "$BASE/albaranes/$albaran_id" | jq .

pp "PATCH /albaranes/$albaran_id"
curl -sS -X PATCH "$BASE/albaranes/$albaran_id" -H 'Content-Type: application/json' -d '{"concordancia":true}' | jq .

pp "DELETE /albaranes/$albaran_id"
curl -sS -X DELETE "$BASE/albaranes/$albaran_id" -w "\nHTTP status: %{http_code}\n"

# 6) Read-only checks for pedidos and movimientos
pp "GET /pedidos"
curl -sS "$BASE/pedidos" | jq . | sed -n '1,6p'

pp "GET /movimientos"
curl -sS "$BASE/movimientos" | jq . | sed -n '1,6p'

echo; echo "All done. If any POST/PATCH/DELETE failed, check the output above."