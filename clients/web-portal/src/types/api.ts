export interface StandardResponse<T> {
  status: number;
  message: string;
  data: T;
}

export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_SHIPPER' | 'ROLE_ADMIN';

export interface UserInfo {
  id: number;
  userCode: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  hubCode?: string | null;
  defaultAddress?: string | null;
}

export interface AuthData {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserInfo;
}

export interface DistrictLocation {
  district: string;
  lat: number;
  lng: number;
  hubCode: string;
  hubName: string;
}

export interface FeeCalculationResult {
  distanceKm: number;
  actualWeightGram: number;
  volumetricWeightGram: number;
  chargeableWeightGram: number;
  baseFee: number;
  distanceSurcharge: number;
  weightSurcharge: number;
  shippingFee: number;
  originHubCode: string;
  destinationHubCode: string;
}

export interface OrderItem {
  id: number;
  trackingCode: string;
  customerCode: string;
  customerName: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderDistrict: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverDistrict: string;
  itemName: string;
  actualWeightGram: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightGram: number;
  chargeableWeightGram: number;
  distanceKm: number;
  shippingFee: number;
  codAmount: number;
  note?: string;
  hubCode: string;
  assignedShipperCode?: string | null;
  orderStatus: string;
  deliveryAttempts: number;
  failReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderLabel {
  trackingCode: string;
  barcodeFormat: string;
  barcodeValue: string;
  qrTrackingUrl: string;
  paperSizeMm: string;
  hubCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  itemName: string;
  chargeableWeightGram: number;
  codAmount: number;
  shippingFee: number;
  note?: string | null;
  orderStatus: string;
  createdAt: string;
}

export interface DispatchOrder {
  trackingCode: string;
  customerCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderDistrict: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverDistrict: string;
  itemName: string;
  shippingFee: number;
  codAmount: number;
  hubCode: string;
  assignedShipperCode?: string | null;
  assignedShipperName?: string | null;
  orderStatus: string;
  deliveryAttempts: number;
  failReason?: string | null;
  proofImageUrl?: string | null;
  receiverSignature?: string | null;
  codCollected?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShipperProfile {
  shipperCode: string;
  fullName: string;
  phone: string;
  hubCode: string;
  vehiclePlate: string;
  isOnline: boolean;
  activeOrdersCount: number;
  codHolding: number;
}

export interface HubInfo {
  hubCode: string;
  hubName: string;
  district: string;
  address: string;
}

export interface DispatchDashboardData {
  summary: {
    totalOrders: number;
    byStatus: Record<string, number>;
    totalCodAmount: number;
    onlineShippers: number;
    totalShippers: number;
  };
  orders: DispatchOrder[];
  shippers: ShipperProfile[];
  hubs: HubInfo[];
}

export interface TrackingTimelineItem {
  eventId: string;
  status: string;
  title: string;
  description: string;
  location: string;
  actorCode: string;
  hubCode?: string | null;
  occurredAt: string;
}

export interface TrackingReadModel {
  trackingCode: string;
  customerCode: string;
  senderName: string;
  senderDistrict: string;
  receiverName: string;
  receiverDistrict: string;
  itemName: string;
  codAmount: number;
  shippingFee: number;
  currentStatus: string;
  hubCode: string;
  assignedShipperCode?: string | null;
  assignedShipperName?: string | null;
  deliveryAttempts: number;
  failReason?: string | null;
  proofImageUrl?: string | null;
  receiverSignature?: string | null;
  timeline: TrackingTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicTrackingSummary {
  trackingCode: string;
  currentStatus: string;
  senderDistrict: string;
  receiverDistrict: string;
  itemName: string;
  updatedAt: string;
}
