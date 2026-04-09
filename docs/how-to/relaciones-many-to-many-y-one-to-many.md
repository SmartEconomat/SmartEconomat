# How-to: Modelar relaciones many-to-many y one-to-many

## One-to-many
Usa esta relación cuando una entidad padre tiene múltiples hijas y cada hija pertenece a un único padre.

```ts
@OneToMany(() => PedidoProducto, (pp) => pp.pedido)
lineas: Relation<PedidoProducto[]>;

@ManyToOne(() => Pedido, (pedido) => pedido.lineas)
pedido: Relation<Pedido>;
```

## Many-to-many
Úsala cuando ambos lados pueden tener múltiples relaciones.

```ts
@ManyToMany(() => Permiso)
@JoinTable({ name: 'rol_permiso' })
permisos: Relation<Permiso[]>;
```

## Recomendación del proyecto
Para control fino, prioriza tabla puente explícita (por ejemplo `rol_permiso`, `usuario_rol`) frente a many-to-many implícita.

## Checklist
- Define `onDelete` acorde a negocio (RESTRICT/SET NULL/CASCADE).
- Indexa columnas FK.
- Evalúa constraints únicas en tablas puente.
