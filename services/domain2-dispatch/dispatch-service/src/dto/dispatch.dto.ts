import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignShipperDto {
  @ApiProperty({ example: 'SPX20260501001' })
  @IsString()
  @IsNotEmpty({ message: 'Mã vận đơn không được để trống' })
  trackingCode: string;

  @ApiProperty({ example: 'SHIPPER_01' })
  @IsString()
  @IsNotEmpty({ message: 'Mã tài xế không được để trống' })
  shipperCode: string;

  @ApiPropertyOptional({ example: 'HUB-Q1' })
  @IsOptional()
  @IsString()
  hubCode?: string;
}

export class ShipperStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean({ message: 'Trạng thái isOnline phải là boolean' })
  isOnline: boolean;
}

export class PickupConfirmDto {
  @ApiPropertyOptional({ example: 'SPX20260501003' })
  @IsOptional()
  @IsString()
  scannedBarcode?: string;

  @ApiPropertyOptional({ example: 'Đã kiểm tra nguyên vẹn kiện hàng' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class TransitUpdateDto {
  @ApiPropertyOptional({ example: 'OUT_FOR_DELIVERY' })
  @IsOptional()
  @IsString()
  targetStatus?: string;

  @ApiPropertyOptional({ example: 'HUB-TD' })
  @IsOptional()
  @IsString()
  hubCode?: string;

  @ApiPropertyOptional({ example: 'Kiện hàng đang được giao đến người nhận' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DeliverConfirmDto {
  @ApiPropertyOptional({ example: 'https://storage.spx.local/proof/SPX20260501006.jpg' })
  @IsOptional()
  @IsString()
  proofImageUrl?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn Nhận' })
  @IsOptional()
  @IsString()
  receiverSignature?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  codCollected?: boolean;

  @ApiPropertyOptional({ example: 'Giao tận tay người nhận' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class FailDeliveryDto {
  @ApiProperty({ example: 'Không liên lạc được với người nhận' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do giao thất bại' })
  reason: string;

  @ApiPropertyOptional({ example: 'Đã gọi 3 cuộc không bắt máy' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'DELIVERED' })
  @IsString()
  @IsNotEmpty({ message: 'Trạng thái mục tiêu không được để trống' })
  targetStatus: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hubCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipperCode?: string;
}
