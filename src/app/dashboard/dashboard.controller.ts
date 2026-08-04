import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.SUPER_ADMINISTRADOR, Role.JEFATURA)
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('monthly')
  @Roles(Role.SUPER_ADMINISTRADOR, Role.JEFATURA)
  @ApiOperation({ summary: 'Estadísticas mensuales (tareas y proyectos)' })
  getMonthlyStats(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getMonthlyStats(month, year);
  }

  @Get('by-sede')
  @Roles(Role.SUPER_ADMINISTRADOR, Role.JEFATURA)
  @ApiOperation({ summary: 'Proyectos y tareas por sede (filtro mensual)' })
  getBySedeStats(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getBySedeStats(month, year);
  }

  @Get('upcoming-deadlines')
  @Roles(Role.SUPER_ADMINISTRADOR, Role.JEFATURA)
  @ApiOperation({
    summary: 'Próximos vencimientos (tareas pendientes con fecha límite)',
  })
  getUpcomingDeadlines(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getUpcomingDeadlines(limit);
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Estadísticas personales del usuario autenticado' })
  getMyStats(@CurrentUser('sub') userId: string) {
    return this.dashboardService.getMyStats(userId);
  }

  @Get('my-weekly-activity')
  @ApiOperation({
    summary:
      'Actividad semanal del usuario (tareas creadas y completadas por semana)',
  })
  getMyWeeklyActivity(
    @CurrentUser('sub') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.getMyWeeklyActivity(userId, from, to);
  }

  @Get('my-upcoming-deadlines')
  @ApiOperation({
    summary:
      'Próximos vencimientos del usuario (tareas pendientes con fecha límite)',
  })
  getMyUpcomingDeadlines(
    @CurrentUser('sub') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getMyUpcomingDeadlines(userId, limit);
  }
}
