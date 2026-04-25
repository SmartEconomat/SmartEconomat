/**
 * @module DashboardController
 * REST controller for the /dashboard resource.
 * Exposes KPI statistic endpoints consumed by the front-end dashboard.
 */
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UseInterceptors, Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { DashboardService } from '../service/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controller that exposes dashboard KPI endpoints.
 * Responses are cached for 60 seconds via the NestJS cache manager.
 * All routes are protected by JWT authentication and role-based permissions.
 * @class DashboardController
 */
@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('dashboard')
export class DashboardController {
  /**
   * Constructs the DashboardController with its required service dependency.
   * @param {DashboardService} dashboardService - Service that computes the dashboard KPI statistics.
   */
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Returns aggregated KPI statistics for the main dashboard.
   * The response is cached for 60 000 ms (1 minute) to reduce database load.
   * @returns {Promise<DashboardStatsDto>} DTO containing inventory, order, alert and movement stats.
   */
  @Get('stats')
  @RequirePermissions(PERMISSIONS.dashboard.ver_estadisticas)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get dashboard statistics (KPIs)' })
  @ApiResponse({
    status: 200,
    description: 'docs.DASHBOARD_STATISTICS_RETRIEVED_SUCCESSFU',
    type: DashboardStatsDto,
  })
  async getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }
}
