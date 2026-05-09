import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controlador principal de la aplicación.
 * Gestiona las rutas base y verificaciones de estado iniciales.
 */
@Controller()
export class AppController {
  /**
   * Crea una instancia de AppController.
   * @param appService Servicio encargado de la lógica de negocio básica de la aplicación.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint de prueba para verificar que el servidor responde correctamente.
   * @returns Un mensaje de saludo "Hello World!".
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
