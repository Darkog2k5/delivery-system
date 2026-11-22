import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'hubs' })
export class HubEntity {
  @PrimaryColumn({ name: 'hub_code', type: 'varchar', length: 32 })
  hubCode: string;

  @Column({ name: 'hub_name', type: 'varchar', length: 120 })
  hubName: string;

  @Column({ name: 'district', type: 'varchar', length: 80 })
  district: string;

  @Column({ name: 'address', type: 'varchar', length: 255 })
  address: string;

  @Column({ name: 'lat', type: 'float' })
  lat: number;

  @Column({ name: 'lng', type: 'float' })
  lng: number;
}
