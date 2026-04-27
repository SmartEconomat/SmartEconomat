import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Documentación en español.
 */
@Controller()
export class AppController {
  /**
   * Documentación en español.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Documentación en español.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
