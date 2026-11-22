import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DispatchOrderEntity } from '../entities/dispatch-order.entity';
import { HubEntity } from '../entities/hub.entity';
import { ShipperEntity } from '../entities/shipper.entity';
import {
  WAYBILL_STATUS,
  WaybillStateMachine,
} from '../domain/waybill-state-machine';
import {
  AssignShipperDto,
  DeliverConfirmDto,
  FailDeliveryDto,
  PickupConfirmDto,
  TransitUpdateDto,
  UpdateOrderStatusDto,
} from '../dto/dispatch.dto';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class DispatchService implements OnModuleInit {
  constructor(
    @InjectRepository(DispatchOrderEntity)
    private readonly orderRepo: Repository<DispatchOrderEntity>,
    @InjectRepository(ShipperEntity)
    private readonly shipperRepo: Repository<ShipperEntity>,
    @InjectRepository(HubEntity)
    private readonly hubRepo: Repository<HubEntity>,
    private readonly messagingService: MessagingService,
  ) {}

  onModuleInit() {
    this.messagingService.registerOrderCreatedHandler(async (event) => {
      await this.handleOrderCreatedEvent(event);
    });
  }

  async handleOrderCreatedEvent(event: Record<string, any>) {
    const trackingCode = String(event.trackingCode || '').trim();
    if (!trackingCode) return;

    const existing = await this.orderRepo.findOneBy({ trackingCode });
    if (existing) return;

    const entity = this.orderRepo.create({
      trackingCode,
      customerCode: String(event.customerCode || 'SHOP_01'),
      senderName: String(event.senderName || event.customerName || 'Shop'),
      senderPhone: String(event.senderPhone || ''),
      senderAddress: String(event.senderAddress || ''),
      senderDistrict: String(event.senderDistrict || 'Quận 1'),
      receiverName: String(event.receiverName || ''),
      receiverPhone: String(event.receiverPhone || ''),
      receiverAddress: String(event.receiverAddress || ''),
      receiverDistrict: String(event.receiverDistrict || 'Quận 1'),
      itemName: String(event.itemName || 'Kiện hàng'),
      shippingFee: Number(event.shippingFee || 0),
      codAmount: Number(event.codAmount || 0),
      hubCode: String(event.hubCode || 'HUB-Q1'),
      orderStatus: String(event.orderStatus || WAYBILL_STATUS.CREATED),
      assignedShipperCode: null,
      assignedShipperName: null,
      deliveryAttempts: 0,
    });
    await this.orderRepo.save(entity);
  }

  async getDashboard(filters: { status?: string; hubCode?: string; search?: string }) {
    const [allOrders, shippers, hubs] = await Promise.all([
      this.orderRepo.find({ order: { createdAt: 'DESC' } }),
      this.shipperRepo.find({ order: { shipperCode: 'ASC' } }),
      this.hubRepo.find({ order: { hubCode: 'ASC' } }),
    ]);

    const byStatus: Record<string, number> = {
      CREATED: 0,
      WAITING_FOR_PICKUP: 0,
      PICKED_UP: 0,
      IN_TRANSIT: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      FAILED: 0,
    };

    let totalCodAmount = 0;
    for (const o of allOrders) {
      byStatus[o.orderStatus] = (byStatus[o.orderStatus] || 0) + 1;
      totalCodAmount += Number(o.codAmount || 0);
    }

    const filteredOrders = allOrders.filter((o) => {
      if (filters.status && filters.status !== 'ALL' && o.orderStatus !== filters.status) {
        return false;
      }
      if (filters.hubCode && filters.hubCode !== 'ALL' && o.hubCode !== filters.hubCode) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.trim().toLowerCase();
        const hay = `${o.trackingCode} ${o.senderName} ${o.receiverName} ${o.receiverPhone} ${o.assignedShipperCode || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return {
      summary: {
        totalOrders: allOrders.length,
        byStatus,
        totalCodAmount,
        onlineShippers: shippers.filter((s) => s.isOnline).length,
        totalShippers: shippers.length,
      },
      orders: filteredOrders,
      shippers,
      hubs,
    };
  }

  async listHubs() {
    return this.hubRepo.find({ order: { hubCode: 'ASC' } });
  }

  async listShippers() {
    return this.shipperRepo.find({ order: { shipperCode: 'ASC' } });
  }

  async assignShipper(dto: AssignShipperDto, actorCode?: string) {
    const order = await this.findOrderOrThrow(dto.trackingCode);
    const shipper = await this.shipperRepo.findOneBy({
      shipperCode: dto.shipperCode.trim(),
    });
    if (!shipper) {
      throw new NotFoundException({
        message: `Không tìm thấy tài xế với mã ${dto.shipperCode}`,
        errorCode: 'ERR_SHIPPER_NOT_FOUND',
        field: 'shipperCode',
      });
    }

    WaybillStateMachine.validateTransition(
      order.orderStatus,
      WAYBILL_STATUS.WAITING_FOR_PICKUP,
      order.deliveryAttempts,
    );

    order.orderStatus = WAYBILL_STATUS.WAITING_FOR_PICKUP;
    order.assignedShipperCode = shipper.shipperCode;
    order.assignedShipperName = shipper.fullName;
    if (dto.hubCode) {
      order.hubCode = dto.hubCode.trim();
    }

    const saved = await this.orderRepo.save(order);
    shipper.activeOrdersCount = Number(shipper.activeOrdersCount || 0) + 1;
    await this.shipperRepo.save(shipper);

    await this.messagingService.publishDispatchStatusUpdated({
      trackingCode: saved.trackingCode,
      orderStatus: saved.orderStatus,
      hubCode: saved.hubCode,
      assignedShipperCode: saved.assignedShipperCode,
      assignedShipperName: saved.assignedShipperName,
      deliveryAttempts: saved.deliveryAttempts,
      location: saved.hubCode,
      description: `Đã điều phối tài xế ${shipper.fullName} (${shipper.shipperCode}) đến lấy hàng`,
      actorCode: actorCode || 'ADMIN_01',
    });

    return saved;
  }

  async getOrCreateShipperProfile(
    shipperCode: string,
    fullName?: string,
    phone?: string,
    hubCode?: string,
  ) {
    let shipper = await this.shipperRepo.findOneBy({ shipperCode });
    if (!shipper) {
      shipper = this.shipperRepo.create({
        shipperCode,
        fullName: fullName ? decodeURIComponent(fullName) : shipperCode,
        phone: phone || '0911999999',
        hubCode: hubCode || 'HUB-Q1',
        vehiclePlate: '59X1-000.99',
        isOnline: true,
        activeOrdersCount: 0,
        codHolding: 0,
      });
      shipper = await this.shipperRepo.save(shipper);
    }
    return shipper;
  }

  async updateShipperOnlineStatus(
    shipperCode: string,
    isOnline: boolean,
    fullName?: string,
    phone?: string,
    hubCode?: string,
  ) {
    const shipper = await this.getOrCreateShipperProfile(
      shipperCode,
      fullName,
      phone,
      hubCode,
    );
    shipper.isOnline = isOnline;
    return this.shipperRepo.save(shipper);
  }

  async getShipperOrders(shipperCode: string, status?: string, tab?: string) {
    const all = await this.orderRepo.find({
      where: { assignedShipperCode: shipperCode },
      order: { updatedAt: 'DESC' },
    });

    return all.filter((o) => {
      if (status && status !== 'ALL') {
        return o.orderStatus === status;
      }
      if (tab === 'pickup') {
        return o.orderStatus === WAYBILL_STATUS.WAITING_FOR_PICKUP;
      }
      if (tab === 'delivery') {
        return [
          WAYBILL_STATUS.PICKED_UP,
          WAYBILL_STATUS.IN_TRANSIT,
          WAYBILL_STATUS.OUT_FOR_DELIVERY,
        ].includes(o.orderStatus as any);
      }
      if (tab === 'history') {
        return [WAYBILL_STATUS.DELIVERED, WAYBILL_STATUS.FAILED].includes(
          o.orderStatus as any,
        );
      }
      return true;
    });
  }

  async confirmPickup(
    trackingCode: string,
    dto: PickupConfirmDto,
    actorCode?: string,
  ) {
    const order = await this.findOrderOrThrow(trackingCode);
    if (
      dto.scannedBarcode &&
      dto.scannedBarcode.trim().toUpperCase() !== order.trackingCode.toUpperCase()
    ) {
      throw new BadRequestException({
        message: `Mã vạch quét được (${dto.scannedBarcode}) không khớp với vận đơn ${order.trackingCode}`,
        errorCode: 'ERR_BARCODE_MISMATCH',
        field: 'scannedBarcode',
      });
    }

    WaybillStateMachine.validateTransition(
      order.orderStatus,
      WAYBILL_STATUS.PICKED_UP,
      order.deliveryAttempts,
    );

    order.orderStatus = WAYBILL_STATUS.PICKED_UP;
    const saved = await this.orderRepo.save(order);

    await this.messagingService.publishDispatchStatusUpdated({
      trackingCode: saved.trackingCode,
      orderStatus: saved.orderStatus,
      hubCode: saved.hubCode,
      assignedShipperCode: saved.assignedShipperCode,
      assignedShipperName: saved.assignedShipperName,
      deliveryAttempts: saved.deliveryAttempts,
      location: `${saved.senderAddress}, ${saved.senderDistrict}`,
      description:
        dto.note ||
        `Tài xế ${saved.assignedShipperName || saved.assignedShipperCode || ''} đã lấy hàng thành công từ Shop`,
      actorCode: actorCode || saved.assignedShipperCode || 'SHIPPER',
    });

    return saved;
  }

  async advanceTransit(
    trackingCode: string,
    dto: TransitUpdateDto,
    actorCode?: string,
  ) {
    const order = await this.findOrderOrThrow(trackingCode);
    const inferredTarget =
      dto.targetStatus ||
      (order.orderStatus === WAYBILL_STATUS.PICKED_UP
        ? WAYBILL_STATUS.IN_TRANSIT
        : WAYBILL_STATUS.OUT_FOR_DELIVERY);

    WaybillStateMachine.validateTransition(
      order.orderStatus,
      inferredTarget,
      order.deliveryAttempts,
    );

    order.orderStatus = inferredTarget;
    if (dto.hubCode) {
      order.hubCode = dto.hubCode.trim();
    }
    const saved = await this.orderRepo.save(order);

    const defaultDesc =
      inferredTarget === WAYBILL_STATUS.IN_TRANSIT
        ? `Kiện hàng đang được trung chuyển tại ${saved.hubCode}`
        : `Tài xế ${saved.assignedShipperName || saved.assignedShipperCode || ''} đang đi giao kiện hàng tới ${saved.receiverDistrict}`;

    await this.messagingService.publishDispatchStatusUpdated({
      trackingCode: saved.trackingCode,
      orderStatus: saved.orderStatus,
      hubCode: saved.hubCode,
      assignedShipperCode: saved.assignedShipperCode,
      assignedShipperName: saved.assignedShipperName,
      deliveryAttempts: saved.deliveryAttempts,
      location: saved.hubCode,
      description: dto.note || defaultDesc,
      actorCode: actorCode || saved.assignedShipperCode || 'DISPATCH',
    });

    return saved;
  }

  async confirmDelivery(
    trackingCode: string,
    dto: DeliverConfirmDto,
    actorCode?: string,
  ) {
    const order = await this.findOrderOrThrow(trackingCode);
    WaybillStateMachine.validateTransition(
      order.orderStatus,
      WAYBILL_STATUS.DELIVERED,
      order.deliveryAttempts,
    );

    order.orderStatus = WAYBILL_STATUS.DELIVERED;
    order.deliveryAttempts = Number(order.deliveryAttempts || 0) + 1;
    order.proofImageUrl =
      dto.proofImageUrl || `https://storage.spx.local/proof/${order.trackingCode}.jpg`;
    order.receiverSignature = dto.receiverSignature || order.receiverName;
    order.codCollected = dto.codCollected !== undefined ? dto.codCollected : true;
    order.failReason = null;

    const saved = await this.orderRepo.save(order);

    if (saved.assignedShipperCode) {
      const shipper = await this.shipperRepo.findOneBy({
        shipperCode: saved.assignedShipperCode,
      });
      if (shipper) {
        shipper.activeOrdersCount = Math.max(0, Number(shipper.activeOrdersCount || 0) - 1);
        if (saved.codCollected) {
          shipper.codHolding = Number(shipper.codHolding || 0) + Number(saved.codAmount || 0);
        }
        await this.shipperRepo.save(shipper);
      }
    }

    await this.messagingService.publishDispatchStatusUpdated({
      trackingCode: saved.trackingCode,
      orderStatus: saved.orderStatus,
      hubCode: saved.hubCode,
      assignedShipperCode: saved.assignedShipperCode,
      assignedShipperName: saved.assignedShipperName,
      deliveryAttempts: saved.deliveryAttempts,
      proofImageUrl: saved.proofImageUrl,
      receiverSignature: saved.receiverSignature,
      location: `${saved.receiverAddress}, ${saved.receiverDistrict}`,
      description:
        dto.note ||
        `Giao hàng thành công cho ${saved.receiverName}. Đã thu COD ${Number(saved.codAmount).toLocaleString('vi-VN')}đ`,
      actorCode: actorCode || saved.assignedShipperCode || 'SHIPPER',
    });

    return saved;
  }

  async reportFailure(
    trackingCode: string,
    dto: FailDeliveryDto,
    actorCode?: string,
  ) {
    const order = await this.findOrderOrThrow(trackingCode);
    WaybillStateMachine.validateTransition(
      order.orderStatus,
      WAYBILL_STATUS.FAILED,
      order.deliveryAttempts,
    );

    order.orderStatus = WAYBILL_STATUS.FAILED;
    order.deliveryAttempts = Number(order.deliveryAttempts || 0) + 1;
    order.failReason = dto.reason.trim();
    const saved = await this.orderRepo.save(order);

    await this.messagingService.publishDispatchStatusUpdated({
      trackingCode: saved.trackingCode,
      orderStatus: saved.orderStatus,
      hubCode: saved.hubCode,
      assignedShipperCode: saved.assignedShipperCode,
      assignedShipperName: saved.assignedShipperName,
      deliveryAttempts: saved.deliveryAttempts,
      failReason: saved.failReason,
      location: `${saved.receiverAddress}, ${saved.receiverDistrict}`,
      description: `Giao hàng thất bại (Lần ${saved.deliveryAttempts}/3): ${saved.failReason}`,
      actorCode: actorCode || saved.assignedShipperCode || 'SHIPPER',
    });

    return saved;
  }

  async updateStatusValidated(
    trackingCode: string,
    dto: UpdateOrderStatusDto,
    actorCode?: string,
  ) {
    const order = await this.findOrderOrThrow(trackingCode);
    WaybillStateMachine.validateTransition(
      order.orderStatus,
      dto.targetStatus,
      order.deliveryAttempts,
    );

    if (dto.targetStatus === WAYBILL_STATUS.FAILED && (!dto.reason || !dto.reason.trim())) {
      throw new BadRequestException({
        message: 'Bắt buộc phải nhập lý do khi cập nhật trạng thái giao thất bại',
        errorCode: 'ERR_MISSING_FAIL_REASON',
        field: 'reason',
      });
    }

    order.orderStatus = dto.targetStatus;
    if (dto.hubCode) order.hubCode = dto.hubCode.trim();
    if (dto.shipperCode) {
      order.assignedShipperCode = dto.shipperCode.trim();
    }
    if (dto.targetStatus === WAYBILL_STATUS.FAILED) {
      order.deliveryAttempts = Number(order.deliveryAttempts || 0) + 1;
      order.failReason = dto.reason!.trim();
    }

    const saved = await this.orderRepo.save(order);

    await this.messagingService.publishDispatchStatusUpdated({
      trackingCode: saved.trackingCode,
      orderStatus: saved.orderStatus,
      hubCode: saved.hubCode,
      assignedShipperCode: saved.assignedShipperCode,
      assignedShipperName: saved.assignedShipperName,
      deliveryAttempts: saved.deliveryAttempts,
      failReason: saved.failReason,
      location: saved.hubCode,
      description:
        dto.reason || `Cập nhật trạng thái vận đơn sang ${saved.orderStatus}`,
      actorCode: actorCode || 'SYSTEM',
    });

    return saved;
  }

  private async findOrderOrThrow(trackingCode: string): Promise<DispatchOrderEntity> {
    const order = await this.orderRepo.findOneBy({
      trackingCode: trackingCode.trim(),
    });
    if (!order) {
      throw new NotFoundException({
        message: `Không tìm thấy vận đơn ${trackingCode} trong hệ thống điều phối`,
        errorCode: 'ERR_ORDER_NOT_FOUND',
        field: 'trackingCode',
      });
    }
    return order;
  }
}
