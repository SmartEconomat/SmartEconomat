import {
  PdfReportService,
  IVA_RATE,
  ProveedorGroup,
} from '../../../src/modules/recepcion/service/pdf-report.service';
import { Pedido } from '../../../src/modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../../../src/modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Proveedor } from '../../../src/modules/proveedor/proveedor.entity/proveedor.entity';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Producto } from '../../../src/modules/producto/producto.entity/producto.entity';
import { DataSource } from 'typeorm';
import {
  EstadoReclamacion,
  TipoDiferencia,
} from '../../../src/modules/incidencia/incidencia-linea.entity/incidencia-linea.entity';

function makeProveedor(id: string, nombre: string, nif?: string): Proveedor {
  const p = new Proveedor();
  Object.assign(p, { id, nombre, nif });
  return p;
}

function makeLinea(
  cantidad: number,
  precioUnitario: number,
  nombreProducto: string
): PedidoProducto {
  const producto = new Producto();
  Object.assign(producto, { nombre: nombreProducto });

  const pp = new ProductoProveedor();
  Object.assign(pp, { producto });

  const linea = new PedidoProducto();
  Object.assign(linea, {
    cantidad,
    precioUnitario,
    productoProveedor: pp,
    productoProveedorId: 'pp-1',
  });
  return linea;
}

function makePedido(
  id: string,
  proveedor: Proveedor | undefined,
  lineas: PedidoProducto[]
): Pedido {
  const pedido = new Pedido();
  Object.assign(pedido, {
    id,
    proveedorId: proveedor?.id,
    proveedor,
    fechaPedido: new Date('2026-03-01T00:00:00Z'),
    estado: 'RECIBIDO',
    pedidoProductos: lineas,
  });
  return pedido;
}

describe('PdfReportService - groupPedidosByProveedor', () => {
  let service: PdfReportService;

  beforeEach(() => {
    service = new PdfReportService(null as unknown as DataSource);
  });

  it('debe agrupar dos pedidos del mismo proveedor en un único grupo', () => {
    const prov = makeProveedor('prov-1', 'Proveedor Uno', 'B12345678');
    const pedidos = [
      makePedido('p1', prov, [makeLinea(10, 2, 'Aceite')]),
      makePedido('p2', prov, [makeLinea(5, 4, 'Arroz')]),
    ];

    const groups = service.groupPedidosByProveedor(pedidos);

    expect(groups).toHaveLength(1);
    expect(groups[0].nombre).toBe('Proveedor Uno');
    expect(groups[0].pedidos).toHaveLength(2);
  });

  it('debe crear grupos separados para distintos proveedores', () => {
    const prov1 = makeProveedor('prov-1', 'Proveedor Uno');
    const prov2 = makeProveedor('prov-2', 'Proveedor Dos');
    const pedidos = [
      makePedido('p1', prov1, [makeLinea(1, 10, 'Producto A')]),
      makePedido('p2', prov2, [makeLinea(2, 5, 'Producto B')]),
    ];

    const groups = service.groupPedidosByProveedor(pedidos);

    expect(groups).toHaveLength(2);
    const nombres = groups.map((g) => g.nombre).sort();
    expect(nombres).toEqual(['Proveedor Dos', 'Proveedor Uno']);
  });

  it('debe calcular subtotal sumando cantidad * precioUnitario de todas las líneas', () => {
    const prov = makeProveedor('prov-1', 'Test');
    const pedidos = [
      makePedido('p1', prov, [makeLinea(10, 2, 'A'), makeLinea(5, 4, 'B')]),
      makePedido('p2', prov, [makeLinea(20, 1, 'C')]),
    ];

    const groups = service.groupPedidosByProveedor(pedidos);

    const expectedSubtotal = 10 * 2 + 5 * 4 + 20 * 1;
    expect(groups[0].subtotal).toBeCloseTo(expectedSubtotal);
  });

  it('debe calcular IVA al 10% sobre el subtotal', () => {
    const prov = makeProveedor('prov-1', 'Test');
    const pedidos = [makePedido('p1', prov, [makeLinea(100, 1, 'X')])];

    const groups = service.groupPedidosByProveedor(pedidos);

    expect(groups[0].iva).toBeCloseTo(100 * IVA_RATE);
  });

  it('debe calcular total = subtotal + IVA', () => {
    const prov = makeProveedor('prov-1', 'Test');
    const pedidos = [makePedido('p1', prov, [makeLinea(200, 0.5, 'X')])];

    const groups = service.groupPedidosByProveedor(pedidos);

    const expectedSubtotal = 200 * 0.5;
    const expectedTotal = expectedSubtotal * (1 + IVA_RATE);
    expect(groups[0].total).toBeCloseTo(expectedTotal);
  });

  it('debe devolver array vacío para input vacío', () => {
    expect(service.groupPedidosByProveedor([])).toHaveLength(0);
  });

  it('debe manejar pedido sin proveedor asignado', () => {
    const pedido = makePedido('p1', undefined, []);

    const groups = service.groupPedidosByProveedor([pedido]);

    expect(groups).toHaveLength(1);
    expect(groups[0].nombre).toBe('Sin proveedor');
    expect(groups[0].subtotal).toBe(0);
    expect(groups[0].iva).toBe(0);
    expect(groups[0].total).toBe(0);
  });

  it('debe calcular subtotalPedido por pedido individual correctamente', () => {
    const prov = makeProveedor('prov-1', 'Test');
    const pedidos = [
      makePedido('p1', prov, [makeLinea(3, 10, 'A'), makeLinea(7, 5, 'B')]),
    ];

    const groups = service.groupPedidosByProveedor(pedidos);

    expect(groups[0].pedidos[0].subtotalPedido).toBeCloseTo(3 * 10 + 7 * 5);
  });

  it('debe incluir nombre del producto en las líneas agrupadas', () => {
    const prov = makeProveedor('prov-1', 'Test');
    const pedidos = [
      makePedido('p1', prov, [makeLinea(1, 1, 'Aceite de oliva')]),
    ];

    const groups = service.groupPedidosByProveedor(pedidos);

    expect(groups[0].pedidos[0].lineas[0].producto).toBe('Aceite de oliva');
  });

  it('debe calcular totales correctos con múltiples proveedores y múltiples pedidos', () => {
    const prov1 = makeProveedor('prov-1', 'Proveedor A');
    const prov2 = makeProveedor('prov-2', 'Proveedor B');
    const pedidos = [
      makePedido('p1', prov1, [makeLinea(10, 5, 'X')]),
      makePedido('p2', prov1, [makeLinea(20, 3, 'Y')]),
      makePedido('p3', prov2, [makeLinea(100, 1, 'Z')]),
    ];

    const groups = service.groupPedidosByProveedor(pedidos);

    const g1 = groups.find((g) => g.nombre === 'Proveedor A') as ProveedorGroup;
    const g2 = groups.find((g) => g.nombre === 'Proveedor B') as ProveedorGroup;

    expect(g1.subtotal).toBeCloseTo(10 * 5 + 20 * 3);
    expect(g1.total).toBeCloseTo((10 * 5 + 20 * 3) * (1 + IVA_RATE));
    expect(g2.subtotal).toBeCloseTo(100 * 1);
    expect(g2.total).toBeCloseTo(100 * 1 * (1 + IVA_RATE));
  });

  it('debe agrupar incidencias por proveedor y conservar los datos de línea', () => {
    const incidencias = [
      {
        id: 'inc-1',
        pedidoId: 'ped-1',
        createdAt: new Date('2026-03-02T00:00:00Z'),
        pedido: {
          proveedorId: 'prov-1',
          proveedor: { nombre: 'Proveedor Uno', nif: 'B12345678' },
        },
        lineas: [
          {
            cantidadEsperada: 10,
            cantidadRecibida: 8,
            diferencia: -2,
            tipoDiferencia: TipoDiferencia.FALTANTE,
            estadoReclamacion: EstadoReclamacion.PENDIENTE,
            pedidoProducto: {
              productoProveedor: {
                producto: { nombre: 'Aceite' },
              },
            },
          },
        ],
        estaResuelta: () => false,
      },
    ] as any;

    const groups = (service as any).groupIncidenciasByProveedor(incidencias);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(
      expect.objectContaining({
        nombre: 'Proveedor Uno',
        nif: 'B12345678',
      })
    );
    expect(groups[0].lineas).toEqual([
      expect.objectContaining({
        incidenciaId: 'inc-1',
        pedidoId: 'ped-1',
        producto: 'Aceite',
        tipoDiferencia: TipoDiferencia.FALTANTE,
        estadoReclamacion: EstadoReclamacion.PENDIENTE,
        resuelta: false,
      }),
    ]);
  });

  it('debe agrupar incidencias sin proveedor bajo el grupo por defecto', () => {
    const incidencias = [
      {
        id: 'inc-2',
        pedidoId: undefined,
        createdAt: new Date('2026-03-03T00:00:00Z'),
        pedido: undefined,
        lineas: [
          {
            cantidadEsperada: 4,
            cantidadRecibida: 0,
            diferencia: -4,
            tipoDiferencia: TipoDiferencia.DEFECTUOSO,
            estadoReclamacion: EstadoReclamacion.RECLAMADO,
            pedidoProducto: undefined,
          },
        ],
        estaResuelta: () => true,
      },
    ] as any;

    const groups = (service as any).groupIncidenciasByProveedor(incidencias);

    expect(groups).toHaveLength(1);
    expect(groups[0].nombre).toBe('Sin proveedor');
    expect(groups[0].lineas[0]).toEqual(
      expect.objectContaining({
        producto: '-',
        resuelta: true,
        tipoDiferencia: TipoDiferencia.DEFECTUOSO,
      })
    );
  });
});
