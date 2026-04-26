import { Injectable } from '@nestjs/common';

/**
 * Documentación en español.
 */
@Injectable()
export class AppService {
        /**
     * Documentación en español.
     */
  getHello(): string {
    return 'Hello World!';
  }
}
