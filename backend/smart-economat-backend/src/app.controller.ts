import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * @description Root application controller.
 * Handles requests to the root endpoint and delegates to AppService.
 */
@Controller()
export class AppController {
  /**
   * @description Constructs the controller with the AppService dependency.
   * @param {AppService} appService - Service that provides the root greeting message.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * @description Returns a greeting string from the application service.
   * @returns {string} The greeting message (e.g. "Hello World!").
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
