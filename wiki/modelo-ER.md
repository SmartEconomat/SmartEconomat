# 📦 Sistema de Gestión de Productos y Pedidos

## 🧩 Explicación 

Este sistema sirve para **gestionar productos, proveedores, pedidos, recepciones y movimientos** dentro de un sistema de educativo.
A continuación, se explican las principales conexiones (relaciones) entre las partes del sistema usando un lenguaje sencillo.

### Relaciones principales (explicadas con ejemplos)

- **Productos y Proveedores**:
Los productos son los artículos que maneja la empresa.
Un mismo producto puede venir de varios proveedores (por ejemplo, “papel A4” de distintas marcas), y cada proveedor puede ofrecer varios productos.

- **Producto-Proveedor**:
Es el punto donde se guarda la relación entre un producto y su proveedor, junto con el **precio** y un **código identificativo**.
Por ejemplo, “Proveedor A vende Papel A4 a 3 € la caja”.

- **Inventario**:
Representa el registro de cuántas unidades hay disponibles de cada producto-proveedor.
Por ejemplo, “Tenemos 40 cajas de Papel A4 del Proveedor A”.

- **Pedidos**:
Son las solicitudes que hacen los usuarios (por ejemplo, un profesor o el personal de almacén) para conseguir productos.
Un pedido puede incluir varios productos distintos y lo genera un usuario responsable.

- **Recepciones**:
Indican la llegada física de los productos solicitados.
En este sistema, **varios pedidos pueden combinarse en una sola recepción** (por ejemplo, si el proveedor entrega todo junto).
Igualmente, una recepción puede estar relacionada con varios pedidos.

- **Albaranes**:
Son documentos que acompañan las entregas.
Sirven para comprobar que lo que se ha recibido coincide con lo que se pidió.
Un albarán puede incluir varias recepciones, y cada recepción puede aparecer en varios albaranes (si se entregó por partes).

- **Usuarios**:
Son las personas que interactúan con el sistema.
Pueden tener diferentes roles, como *almacén* (gestiona existencias) o *profesor* (solicita materiales).

- **Movimientos**:
Cada vez que entra o sale material del almacén, se registra un movimiento (por ejemplo, “Entrada de 10 cajas de papel” o “Salida hacia el aula 3”).

- **Distribución Interna**:
Una vez recibido el material, esta parte controla cómo se reparte dentro de la organización (por ejemplo, “5 cajas de papel para el departamento de arte”).

---

## 📘 Explicación técnica

### Relaciones y cardinalidades

| Relación | Cardinalidad | Descripción |
|-----------|---------------|--------------|
| **Producto – ProductoProveedor** | 1:N | Un producto puede tener varios proveedores. |
| **Proveedor – ProductoProveedor** | 1:N | Un proveedor puede ofrecer varios productos. |
| **ProductoProveedor – Inventario** | 1:N | Un registro de producto-proveedor tiene un inventario asociado. |
| **ProductoProveedor – HistorialPrecio** | 1:N | Se registran cambios de precios históricos. |
| **Usuario – Pedido** | 1:N | Un usuario puede generar varios pedidos. |
| **Pedido – PedidoProducto** | 1:N | Cada pedido contiene varios productos. |
| **PedidoProducto – ProductoProveedor** | N:1 | Cada producto de un pedido proviene de un proveedor. |
| **Pedido – PedidoRecepcion – Recepcion** | N:N | Varios pedidos pueden estar vinculados a una recepción y una recepción puede estar vinculada a varios pedidos. |
| **Albaran – AlbaranPedidoRecepcion** | N:N | Un albarán puede incluir varias recepciones y viceversa. |
| **Recepcion – DistribucionInterna** | 1:1 | Cada recepción tiene su distribución interna. |
| **Usuario – Movimientos** | 1:N | Un usuario puede registrar varios movimientos. |

---

## 🧾 Entidades y Atributos

### 🧱 Producto
- `id_producto (PK)`
- `stock`
- `descripcion`
- `minimo`
- `reposicion`
- `imagen (opt)`
- `error (opt)`
- `calculado (bool)`

### 🏭 Proveedor
- `id_proveedor (PK)`
- `nombre`

### 🔗 ProductoProveedor
- `id_producto_proveedor (PK)`
- `id_producto (FK)`
- `id_proveedor (FK)`
- `codigo`
- `precio_unitario`

### 📦 Inventario
- `id_inventario (PK)`
- `id_producto_proveedor (FK)`

### 💰 HistorialPrecio
- `id_historial_precio (PK)`
- `id_producto_proveedor (FK)`
- `precio`

### 👤 Usuario
- `id_usuario (PK)`
- `rol (enum: 'almacen', 'profesor')`
- `username (unique)`
- `password`
- `nombre`

### 🧾 Pedido
- `id_pedido (PK)`
- `id_usuario (FK)`
- `fecha_creacion`
- `fecha_entrega`
- `estado`
- `coste_total`

### 📦 PedidoProducto
- `id_pedido_producto (PK)`
- `id_producto_proveedor (FK)`
- `id_pedido (FK)`
- `cantidad`

### 🚚 PedidoRecepcion
- `id_pedido_recepcion (PK)`
- `id_pedido (FK)`
- `id_recepcion (FK)`

### 📄 Albaran
- `id_albaran (PK)`
- `codigo`
- `fecha`
- `completado (bool)`

### 🔗 AlbaranPedidoRecepcion
- `id_albaran_pedido_recepcion (PK)`
- `id_pedido_recepcion (FK)`
- `id_albaran (FK)`

### 📥 Recepcion
- `id_recepcion (PK)`
- `descripcion`
- `cantidad`
- `estado`
- `importado`
- `tipo`
- `observacion`

### 📤 DistribucionInterna
- `id_distribucion_interna (PK)`
- `id_recepcion (FK)`
- `cantidad_real`
- `coste_real`
- `diferencia_cantidad_pedida`
- `fecha_entrega`
- `descripcion`

### 🔄 Movimientos
- `id_movimiento (PK)`
- `id_usuario (FK)`
- `tipo_movimiento (enum: 'A', 'R')`
- `entidad (enum: 'Albarán', 'Producto')`
- `fecha`

![Diagrama ER](https://ruta.com/imagen.png)
