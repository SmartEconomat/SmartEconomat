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

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @RequirePermissions('dashboard:ver_estadisticas')
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
