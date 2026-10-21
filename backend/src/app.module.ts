import { Module, Controller, Get } from '@nestjs/common';
import { Database } from './database';
import { AuthController, AuthService, AdminGuard } from './auth';
import { PortfolioRepository } from './portfolio.repository';
import { PortfolioController } from './portfolio.controller';
import { MediaController } from './media.controller';
@Controller('health')
class HealthController {
  constructor(private readonly database: Database) {}
  @Get() health() {
    this.database.sql.prepare('SELECT 1').get();
    return { status: 'ok' };
  }
}
@Module({
  controllers: [HealthController, AuthController, PortfolioController, MediaController],
  providers: [Database, AuthService, AdminGuard, PortfolioRepository],
})
export class AppModule {}
