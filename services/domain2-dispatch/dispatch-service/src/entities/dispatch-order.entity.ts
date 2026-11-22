import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'dispatch_orders' })
export class DispatchOrderEntity {
  @PrimaryColumn({ name: 'tracking_code', type: 'varchar', length: 32 })
  trackingCode: string;

  @Column({ name: 'customer_code', type: 'varchar', length: 32 })
  customerCode: string;

  @Column({ name: 'sender_name', type: 'varchar', length: 120 })
  senderName: string;

  @Column({ name: 'sender_phone', type: 'varchar', length: 20 })
  senderPhone: string;

  @Column({ name: 'sender_address', type: 'varchar', length: 255 })
  senderAddress: string;

  @Column({ name: 'sender_district', type: 'varchar', length: 80 })
  senderDistrict: string;

  @Column({ name: 'receiver_name', type: 'varchar', length: 120 })
  receiverName: string;

  @Column({ name: 'receiver_phone', type: 'varchar', length: 20 })
  receiverPhone: string;

  @Column({ name: 'receiver_address', type: 'varchar', length: 255 })
  receiverAddress: string;

  @Column({ name: 'receiver_district', type: 'varchar', length: 80 })
  receiverDistrict: string;

  @Column({ name: 'item_name', type: 'varchar', length: 200 })
  itemName: string;

  @Column({ name: 'shipping_fee', type: 'bigint', default: 0 })
  shippingFee: number;

  @Column({ name: 'cod_amount', type: 'bigint', default: 0 })
  codAmount: number;

  @Column({ name: 'hub_code', type: 'varchar', length: 32 })
  hubCode: string;

  @Column({
    name: 'assigned_shipper_code',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  assignedShipperCode: string | null;

  @Column({
    name: 'assigned_shipper_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  assignedShipperName: string | null;

  @Column({ name: 'order_status', type: 'varchar', length: 32 })
  orderStatus: string;

  @Column({ name: 'delivery_attempts', type: 'int', default: 0 })
  deliveryAttempts: number;

  @Column({ name: 'fail_reason', type: 'varchar', length: 255, nullable: true })
  failReason: string | null;

  @Column({
    name: 'proof_image_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  proofImageUrl: string | null;

  @Column({
    name: 'receiver_signature',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  receiverSignature: string | null;

  @Column({ name: 'cod_collected', type: 'boolean', default: false })
  codCollected: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
