import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HubEntity } from '../entities/hub.entity';
import { ShipperEntity } from '../entities/shipper.entity';
import { DispatchOrderEntity } from '../entities/dispatch-order.entity';
import { WAYBILL_STATUS } from '../domain/waybill-state-machine';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(HubEntity)
    private readonly hubRepo: Repository<HubEntity>,
    @InjectRepository(ShipperEntity)
    private readonly shipperRepo: Repository<ShipperEntity>,
    @InjectRepository(DispatchOrderEntity)
    private readonly orderRepo: Repository<DispatchOrderEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedHubs();
    await this.seedShippers();
    await this.seedOrders();
  }

  private async seedHubs() {
    const hubs: Partial<HubEntity>[] = [
      {
        hubCode: 'HUB-Q1',
        hubName: 'Bưu cục Trung tâm Quận 1',
        district: 'Quận 1',
        address: '02 Công Xã Paris, Quận 1, TP. Hồ Chí Minh',
        lat: 10.7769,
        lng: 106.7009,
      },
      {
        hubCode: 'HUB-TD',
        hubName: 'Trạm Trung Chuyển TP. Thủ Đức',
        district: 'TP. Thủ Đức',
        address: '180 Võ Văn Ngân, TP. Thủ Đức, TP. Hồ Chí Minh',
        lat: 10.8494,
        lng: 106.7537,
      },
      {
        hubCode: 'HUB-TB',
        hubName: 'Bưu cục Tân Bình',
        district: 'Quận Tân Bình',
        address: '320 Cộng Hòa, Quận Tân Bình, TP. Hồ Chí Minh',
        lat: 10.8014,
        lng: 106.6528,
      },
      {
        hubCode: 'HUB-BT',
        hubName: 'Bưu cục Bình Thạnh',
        district: 'Quận Bình Thạnh',
        address: '150 Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh',
        lat: 10.8106,
        lng: 106.7091,
      },
    ];

    for (const h of hubs) {
      const exists = await this.hubRepo.findOneBy({ hubCode: h.hubCode! });
      if (!exists) {
        await this.hubRepo.save(this.hubRepo.create(h));
      }
    }
  }

  private async seedShippers() {
    const shippers: Partial<ShipperEntity>[] = [
      {
        shipperCode: 'SHIPPER_01',
        fullName: 'Nguyễn Văn Tài',
        phone: '0911000001',
        hubCode: 'HUB-Q1',
        vehiclePlate: '59T1-889.01',
        isOnline: true,
        activeOrdersCount: 5,
        codHolding: 0,
      },
      {
        shipperCode: 'SHIPPER_02',
        fullName: 'Trần Minh Tuấn',
        phone: '0911000002',
        hubCode: 'HUB-TD',
        vehiclePlate: '59X2-662.18',
        isOnline: true,
        activeOrdersCount: 2,
        codHolding: 0,
      },
      {
        shipperCode: 'SHIPPER_03',
        fullName: 'Lê Hoàng Nam',
        phone: '0911000003',
        hubCode: 'HUB-TB',
        vehiclePlate: '59P1-519.44',
        isOnline: true,
        activeOrdersCount: 0,
        codHolding: 250000,
      },
    ];

    for (const s of shippers) {
      const exists = await this.shipperRepo.findOneBy({ shipperCode: s.shipperCode! });
      if (!exists) {
        await this.shipperRepo.save(this.shipperRepo.create(s));
      }
    }
  }

  private async seedOrders() {
    const orders: Partial<DispatchOrderEntity>[] = [
      {
        trackingCode: 'SPX20260501089',
        customerCode: 'SHOP_01',
        senderName: 'Shop Thời Trang Sài Gòn',
        senderPhone: '0988000001',
        senderAddress: '120 Lê Lợi',
        senderDistrict: 'Quận 1',
        receiverName: 'Nguyễn Thị Mai',
        receiverPhone: '0909111222',
        receiverAddress: '88 Võ Văn Ngân',
        receiverDistrict: 'TP. Thủ Đức',
        itemName: 'Áo khoác Denim Unisex',
        shippingFee: 60000,
        codAmount: 350000,
        hubCode: 'HUB-TD',
        assignedShipperCode: 'SHIPPER_01',
        assignedShipperName: 'Nguyễn Văn Tài',
        orderStatus: WAYBILL_STATUS.IN_TRANSIT,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501001',
        customerCode: 'SHOP_01',
        senderName: 'Shop Thời Trang Sài Gòn',
        senderPhone: '0988000001',
        senderAddress: '120 Lê Lợi',
        senderDistrict: 'Quận 1',
        receiverName: 'Lê Văn Hùng',
        receiverPhone: '0903222333',
        receiverAddress: '25 Nguyễn Thị Thập',
        receiverDistrict: 'Quận 7',
        itemName: 'Giày Sneaker Thể Thao',
        shippingFee: 35000,
        codAmount: 450000,
        hubCode: 'HUB-Q1',
        assignedShipperCode: null,
        assignedShipperName: null,
        orderStatus: WAYBILL_STATUS.CREATED,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501002',
        customerCode: 'SHOP_02',
        senderName: 'Cửa Hàng Điện Tử Minh Anh',
        senderPhone: '0988000002',
        senderAddress: '45 Cộng Hòa',
        senderDistrict: 'Quận Tân Bình',
        receiverName: 'Phạm Thị Hoa',
        receiverPhone: '0904333444',
        receiverAddress: '102 Quang Trung',
        receiverDistrict: 'Quận Gò Vấp',
        itemName: 'Tai nghe Bluetooth Pro',
        shippingFee: 32500,
        codAmount: 280000,
        hubCode: 'HUB-TB',
        assignedShipperCode: null,
        assignedShipperName: null,
        orderStatus: WAYBILL_STATUS.CREATED,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501003',
        customerCode: 'SHOP_01',
        senderName: 'Shop Thời Trang Sài Gòn',
        senderPhone: '0988000001',
        senderAddress: '120 Lê Lợi',
        senderDistrict: 'Quận 1',
        receiverName: 'Trần Quốc Bảo',
        receiverPhone: '0905444555',
        receiverAddress: '300 Điện Biên Phủ',
        receiverDistrict: 'Quận Bình Thạnh',
        itemName: 'Set Quần Áo Công Sở',
        shippingFee: 27500,
        codAmount: 520000,
        hubCode: 'HUB-Q1',
        assignedShipperCode: 'SHIPPER_01',
        assignedShipperName: 'Nguyễn Văn Tài',
        orderStatus: WAYBILL_STATUS.WAITING_FOR_PICKUP,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501004',
        customerCode: 'SHOP_03',
        senderName: 'Mỹ Phẩm Lan Chi',
        senderPhone: '0988000003',
        senderAddress: '88 Võ Văn Tần',
        senderDistrict: 'Quận 3',
        receiverName: 'Võ Minh Tâm',
        receiverPhone: '0906555666',
        receiverAddress: '55 Sư Vạn Hạnh',
        receiverDistrict: 'Quận 10',
        itemName: 'Bộ Dưỡng Da Chống Nắng',
        shippingFee: 22500,
        codAmount: 190000,
        hubCode: 'HUB-Q1',
        assignedShipperCode: 'SHIPPER_01',
        assignedShipperName: 'Nguyễn Văn Tài',
        orderStatus: WAYBILL_STATUS.WAITING_FOR_PICKUP,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501005',
        customerCode: 'SHOP_02',
        senderName: 'Cửa Hàng Điện Tử Minh Anh',
        senderPhone: '0988000002',
        senderAddress: '45 Cộng Hòa',
        senderDistrict: 'Quận Tân Bình',
        receiverName: 'Ngô Thị Lan',
        receiverPhone: '0907666777',
        receiverAddress: '19 Xa Lộ Hà Nội',
        receiverDistrict: 'TP. Thủ Đức',
        itemName: 'Bàn phím Cơ Không Dây',
        shippingFee: 75000,
        codAmount: 1200000,
        hubCode: 'HUB-TB',
        assignedShipperCode: 'SHIPPER_02',
        assignedShipperName: 'Trần Minh Tuấn',
        orderStatus: WAYBILL_STATUS.PICKED_UP,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501006',
        customerCode: 'SHOP_04',
        senderName: 'Gia Dụng Phú Quý',
        senderPhone: '0988000004',
        senderAddress: '210 Xô Viết Nghệ Tĩnh',
        senderDistrict: 'Quận Bình Thạnh',
        receiverName: 'Đặng Hữu Nghĩa',
        receiverPhone: '0908777888',
        receiverAddress: '12 Nguyễn Huệ',
        receiverDistrict: 'Quận 1',
        itemName: 'Ấm Siêu Tốc Inox 304',
        shippingFee: 27500,
        codAmount: 640000,
        hubCode: 'HUB-Q1',
        assignedShipperCode: 'SHIPPER_01',
        assignedShipperName: 'Nguyễn Văn Tài',
        orderStatus: WAYBILL_STATUS.OUT_FOR_DELIVERY,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501007',
        customerCode: 'SHOP_05',
        senderName: 'Nhà Sách Tri Thức',
        senderPhone: '0988000005',
        senderAddress: '15 Nguyễn Trãi',
        senderDistrict: 'Quận 5',
        receiverName: 'Huỳnh Ngọc Ánh',
        receiverPhone: '0909888999',
        receiverAddress: '68 Trần Hưng Đạo',
        receiverDistrict: 'Quận 1',
        itemName: 'Bộ Sách Thiết Kế Hệ Thống',
        shippingFee: 32500,
        codAmount: 310000,
        hubCode: 'HUB-Q1',
        assignedShipperCode: 'SHIPPER_01',
        assignedShipperName: 'Nguyễn Văn Tài',
        orderStatus: WAYBILL_STATUS.OUT_FOR_DELIVERY,
        deliveryAttempts: 0,
      },
      {
        trackingCode: 'SPX20260501008',
        customerCode: 'SHOP_01',
        senderName: 'Shop Thời Trang Sài Gòn',
        senderPhone: '0988000001',
        senderAddress: '120 Lê Lợi',
        senderDistrict: 'Quận 1',
        receiverName: 'Bùi Thanh Tùng',
        receiverPhone: '0912000111',
        receiverAddress: '44 Pasteur',
        receiverDistrict: 'Quận 3',
        itemName: 'Túi Đeo Chéo Da PU',
        shippingFee: 15000,
        codAmount: 250000,
        hubCode: 'HUB-Q1',
        assignedShipperCode: 'SHIPPER_03',
        assignedShipperName: 'Lê Hoàng Nam',
        orderStatus: WAYBILL_STATUS.DELIVERED,
        deliveryAttempts: 1,
        codCollected: true,
        receiverSignature: 'Bùi Thanh Tùng',
      },
      {
        trackingCode: 'SPX20260501009',
        customerCode: 'SHOP_03',
        senderName: 'Mỹ Phẩm Lan Chi',
        senderPhone: '0988000003',
        senderAddress: '88 Võ Văn Tần',
        senderDistrict: 'Quận Phú Nhuận',
        receiverName: 'Trương Mỹ Linh',
        receiverPhone: '0913000222',
        receiverAddress: '90 Nguyễn Hữu Thọ',
        receiverDistrict: 'Quận 7',
        itemName: 'Nước Hoa Cao Cấp 50ml',
        shippingFee: 50000,
        codAmount: 420000,
        hubCode: 'HUB-BT',
        assignedShipperCode: 'SHIPPER_02',
        assignedShipperName: 'Trần Minh Tuấn',
        orderStatus: WAYBILL_STATUS.FAILED,
        deliveryAttempts: 1,
        failReason: 'Khách hẹn giao lại vào ngày mai',
      },
    ];

    for (const o of orders) {
      const exists = await this.orderRepo.findOneBy({ trackingCode: o.trackingCode! });
      if (!exists) {
        await this.orderRepo.save(this.orderRepo.create(o));
      }
    }
  }
}
