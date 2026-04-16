import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * @description Controlador raíz de la aplicación.
 * Gestiona las peticiones al endpoint raíz y delega en AppService.
 */
@Controller()
export class AppController {
  /**
   * @description Construye el controlador con la dependencia AppService.
   * @param {AppService} appService - Servicio que proporciona el mensaje de saludo raíz.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * @description Devuelve una cadena de saludo proporcionada por el servicio de la aplicación.
   * @returns {string} El mensaje de saludo (p. ej. "Hello World!").
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
