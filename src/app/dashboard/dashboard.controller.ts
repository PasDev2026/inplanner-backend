import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMINISTRADOR, Role.JEFATURA)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Estadísticas mensuales (tareas y proyectos)' })
  getMonthlyStats(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getMonthlyStats(month, year);
  }

  @Get('by-sede')
  @ApiOperation({ summary: 'Proyectos y tareas por sede (filtro mensual)' })
  getBySedeStats(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getBySedeStats(month, year);
  }
}
