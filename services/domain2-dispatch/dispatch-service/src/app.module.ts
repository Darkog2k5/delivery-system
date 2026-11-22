import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { DispatchController } from './controllers/dispatch.controller';
import { DispatchOrderEntity } from './entities/dispatch-order.entity';
import { HubEntity } from './entities/hub.entity';
import { ShipperEntity } from './entities/shipper.entity';
import { MessagingService } from './messaging/messaging.service';
import { DispatchService } from './services/dispatch.service';
import { SeedService } from './services/seed.service';

function buildTypeOrmConfig() {
  const dbType = (process.env.DB_TYPE || 'mysql').toLowerCase();
  if (dbType === 'local' || dbType === 'sqljs') {
    const localDir = process.env.LOCAL_DB_DIR || path.resolve(process.cwd(), '.local-data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return TypeOrmModule.forRoot({
      type: 'sqljs',
      location: path.join(localDir, 'dispatch_db.sqlite'),
      autoSave: true,
      entities: [HubEntity, ShipperEntity, DispatchOrderEntity],
      synchronize: true,
    });
  }

  return TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3307),
    username: process.env.DB_USER || 'spx_dispatch',
    password: process.env.DB_PASSWORD || 'spx_mysql_pass_2026',
    database: process.env.DB_NAME || 'dispatch_db',
    entities: [HubEntity, ShipperEntity, DispatchOrderEntity],
    synchronize: true,
  });
}

@Module({
  imports: [
    buildTypeOrmConfig(),
    TypeOrmModule.forFeature([HubEntity, ShipperEntity, DispatchOrderEntity]),
  ],
  controllers: [DispatchController],
  providers: [MessagingService, DispatchService, SeedService],
})
export class AppModule {}
