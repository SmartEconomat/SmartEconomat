import { Injectable } from '@nestjs/common';

/**
 * Servicio principal de la aplicación.
 * Proporciona funcionalidades básicas y de salud del sistema.
 */
@Injectable()
export class AppService {
  /**
   * Obtiene un mensaje de saludo estándar.
   * @returns El string "Hello World!".
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
