import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DistribucionService } from './src/modules/distribucion/service/distribucion.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const svc = app.get(DistribucionService);
  const disponibles = await svc.findDisponibles({ page: 1, limit: 10 });
  for (const d of disponibles) {
    console.log(
      `Pedido: ${d.numeroGlobal}, Usuario: ${d.usuario?.username}, Ubicaciones:`,
      d.ubicacionesUsuario
    );
  }
  await app.close();
}
bootstrap();
