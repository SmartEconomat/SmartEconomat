import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { DashboardService } from '../service/dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (KPIs)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully.',
    type: DashboardStatsDto,
  })
  async getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }
}
