import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AssignShipperDto,
  DeliverConfirmDto,
  FailDeliveryDto,
  PickupConfirmDto,
  ShipperStatusDto,
  TransitUpdateDto,
  UpdateOrderStatusDto,
} from '../dto/dispatch.dto';
import { DispatchService } from '../services/dispatch.service';

@ApiTags('Dispatch & Operations (Domain 2)')
@Controller('api/dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for Dispatch Service' })
  health() {
    return { service: 'dispatch-service', status: 'UP' };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'UC26: Master Dashboard & Order Filtering' })
  getDashboard(
    @Query('status') status?: string,
    @Query('hubCode') hubCode?: string,
    @Query('search') search?: string,
  ) {
    return this.dispatchService.getDashboard({ status, hubCode, search });
  }

  @Get('hubs')
  @ApiOperation({ summary: 'UC25: List Hubs / Sorting Centers' })
  listHubs() {
    return this.dispatchService.listHubs();
  }

  @Get('shippers')
  @ApiOperation({ summary: 'List all Shippers' })
  listShippers() {
    return this.dispatchService.listShippers();
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC26: Assign Order to Shipper (CREATED -> WAITING_FOR_PICKUP)' })
  assignShipper(
    @Body() dto: AssignShipperDto,
    @Headers('x-user-code') userCode?: string,
  ) {
    return this.dispatchService.assignShipper(dto, userCode);
  }

  @Get('shipper/profile')
  @ApiOperation({ summary: 'UC16: Get Shipper Profile & Online Status' })
  getShipperProfile(
    @Headers('x-user-code') userCode?: string,
    @Headers('x-user-name') userName?: string,
    @Headers('x-user-phone') userPhone?: string,
    @Headers('x-user-hub') userHub?: string,
    @Query('shipperCode') queryCode?: string,
  ) {
    const code = queryCode || userCode || 'SHIPPER_01';
    return this.dispatchService.getOrCreateShipperProfile(
      code,
      userName,
      userPhone,
      userHub,
    );
  }

  @Patch('shipper/status')
  @ApiOperation({ summary: 'UC16: Toggle Shipper Online / Offline Status' })
  updateShipperStatus(
    @Body() dto: ShipperStatusDto,
    @Headers('x-user-code') userCode?: string,
    @Headers('x-user-name') userName?: string,
    @Headers('x-user-phone') userPhone?: string,
    @Headers('x-user-hub') userHub?: string,
  ) {
    return this.dispatchService.updateShipperOnlineStatus(
      userCode || 'SHIPPER_01',
      dto.isOnline,
      userName,
      userPhone,
      userHub,
    );
  }

  @Get('shipper/orders')
  @ApiOperation({ summary: 'UC17: List Assigned Orders for Shipper' })
  getShipperOrders(
    @Headers('x-user-code') userCode?: string,
    @Query('shipperCode') queryCode?: string,
    @Query('status') status?: string,
    @Query('tab') tab?: string,
  ) {
    const code = queryCode || userCode || 'SHIPPER_01';
    return this.dispatchService.getShipperOrders(code, status, tab);
  }

  @Post('orders/:trackingCode/pickup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC18: Confirm Pickup with Barcode Scan (WAITING_FOR_PICKUP -> PICKED_UP)' })
  confirmPickup(
    @Param('trackingCode') trackingCode: string,
    @Body() dto: PickupConfirmDto,
    @Headers('x-user-code') userCode?: string,
  ) {
    return this.dispatchService.confirmPickup(trackingCode, dto || {}, userCode);
  }

  @Post('orders/:trackingCode/transit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance order to IN_TRANSIT or OUT_FOR_DELIVERY' })
  advanceTransit(
    @Param('trackingCode') trackingCode: string,
    @Body() dto: TransitUpdateDto,
    @Headers('x-user-code') userCode?: string,
  ) {
    return this.dispatchService.advanceTransit(trackingCode, dto || {}, userCode);
  }

  @Post('orders/:trackingCode/deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC20: Confirm Delivery Success (OUT_FOR_DELIVERY -> DELIVERED)' })
  confirmDelivery(
    @Param('trackingCode') trackingCode: string,
    @Body() dto: DeliverConfirmDto,
    @Headers('x-user-code') userCode?: string,
  ) {
    return this.dispatchService.confirmDelivery(trackingCode, dto || {}, userCode);
  }

  @Post('orders/:trackingCode/fail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC21: Report Delivery Failure with Mandatory Reason (OUT_FOR_DELIVERY -> FAILED)' })
  reportFailure(
    @Param('trackingCode') trackingCode: string,
    @Body() dto: FailDeliveryDto,
    @Headers('x-user-code') userCode?: string,
  ) {
    return this.dispatchService.reportFailure(trackingCode, dto, userCode);
  }

  @Patch('orders/:trackingCode/status')
  @ApiOperation({ summary: 'Update Order Status with Strict State Machine Validation' })
  updateStatus(
    @Param('trackingCode') trackingCode: string,
    @Body() dto: UpdateOrderStatusDto,
    @Headers('x-user-code') userCode?: string,
  ) {
    return this.dispatchService.updateStatusValidated(trackingCode, dto, userCode);
  }

  @Post('internal/events')
  @ApiOperation({ summary: 'Internal event receiver for HTTP fallback mode' })
  async receiveInternalEvent(@Body() event: Record<string, any>) {
    if (event?.eventType === 'order.created') {
      await this.dispatchService.handleOrderCreatedEvent(event);
    }
    return { received: true };
  }
}
