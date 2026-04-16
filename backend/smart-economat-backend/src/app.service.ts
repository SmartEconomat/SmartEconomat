import { Injectable } from '@nestjs/common';

/**
 * @description Servicio raíz de la aplicación.
 * Proporciona métodos de utilidad consumidos por AppController para los endpoints raíz.
 */
@Injectable()
export class AppService {
  /**
   * @description Devuelve una cadena de saludo simple utilizada por el endpoint GET raíz.
   * @returns {string} Mensaje de saludo estático "Hello World!".
   */
  getHello(): string {
    return 'Hello World!';
  }
}
