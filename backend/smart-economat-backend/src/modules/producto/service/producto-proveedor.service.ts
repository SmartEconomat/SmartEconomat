import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { UpdatePrecioProductoDto } from '../dto/update-precio-producto.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class ProductoProveedorService {
  constructor(private readonly dataSource: DataSource) {}

  async updatePrecio(
    idProductoProveedor: string,
    updatePrecioDto: UpdatePrecioProductoDto
  ): Promise<ProductoProveedor> {
    const { nuevoPrecio } = updatePrecioDto;

    return await this.dataSource.transaction(async (manager) => {
      const productoProveedor = await manager.findOne(ProductoProveedor, {
        where: { id: idProductoProveedor },
      });

      if (!productoProveedor) {
        throw new NotFoundException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }

      if (productoProveedor.precioUnitario === nuevoPrecio) {
        throw new ConflictException(I18nHelper.getError('PRICE_NOT_CHANGED'));
      }

      const previousPrice = productoProveedor.precioUnitario;

      if (previousPrice !== undefined && previousPrice !== null) {
        const historial = new HistorialPrecio();
        historial.productoProveedor = productoProveedor;
        historial.precio = previousPrice;
        await manager.save(HistorialPrecio, historial);
      }

      productoProveedor.precioUnitario = nuevoPrecio;
      return await manager.save(ProductoProveedor, productoProveedor);
    });
  }

  async getHistorial(idProductoProveedor: string): Promise<HistorialPrecio[]> {
    const productoProveedor = await this.dataSource.manager.findOne(
      ProductoProveedor,
      {
        where: { id: idProductoProveedor },
        relations: ['historialPrecios'],
      }
    );

    if (!productoProveedor) {
      throw new NotFoundException(
        I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
      );
    }

    return productoProveedor.historialPrecios.sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );
  }
}
