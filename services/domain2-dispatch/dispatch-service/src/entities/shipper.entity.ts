import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'shippers' })
export class ShipperEntity {
  @PrimaryColumn({ name: 'shipper_code', type: 'varchar', length: 32 })
  shipperCode: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'hub_code', type: 'varchar', length: 32 })
  hubCode: string;

  @Column({ name: 'vehicle_plate', type: 'varchar', length: 32 })
  vehiclePlate: string;

  @Column({ name: 'is_online', type: 'boolean', default: true })
  isOnline: boolean;

  @Column({ name: 'active_orders_count', type: 'int', default: 0 })
  activeOrdersCount: number;

  @Column({ name: 'cod_holding', type: 'bigint', default: 0 })
  codHolding: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
