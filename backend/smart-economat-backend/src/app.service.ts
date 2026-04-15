import { Injectable } from '@nestjs/common';

/**
 * @description Root application service.
 * Provides utility methods consumed by AppController for root-level endpoints.
 */
@Injectable()
export class AppService {
  /**
   * @description Returns a simple greeting string used by the root GET endpoint.
   * @returns {string} Static greeting message "Hello World!".
   */
  getHello(): string {
    return 'Hello World!';
  }
}
