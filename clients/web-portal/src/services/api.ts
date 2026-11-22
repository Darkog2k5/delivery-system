import {
  AuthData,
  DispatchDashboardData,
  DispatchOrder,
  DistrictLocation,
  FeeCalculationResult,
  OrderItem,
  OrderLabel,
  PublicTrackingSummary,
  ShipperProfile,
  StandardResponse,
  TrackingReadModel,
  UserInfo,
} from '../types/api';

const GATEWAY_URL = (
  import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
).replace(/\/$/, '');

const TOKEN_KEY = 'spx_jwt_token';
const USER_KEY = 'spx_current_user';

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  constructor(status: number, message: string, errorCode?: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserInfo | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function saveAuthSession(auth: AuthData) {
  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (withAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = (await res.json()) as StandardResponse<T>;
  if (!res.ok) {
    const errData = (payload?.data || {}) as Record<string, any>;
    throw new ApiError(
      payload?.status || res.status,
      payload?.message || 'Yêu cầu thất bại',
      errData.errorCode,
    );
  }
  return payload.data;
}

export const spxApi = {
  gatewayUrl: GATEWAY_URL,

  login: (identifier: string, password: string) =>
    request<AuthData>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      },
      false,
    ),

  register: (body: {
    fullName: string;
    phone: string;
    password: string;
    role: string;
    defaultAddress?: string;
  }) =>
    request<AuthData>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      false,
    ),

  getLocations: () =>
    request<DistrictLocation[]>('/api/orders/locations', {}, false),

  calculateFee: (body: {
    senderDistrict: string;
    receiverDistrict: string;
    actualWeightGram: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  }) =>
    request<FeeCalculationResult>(
      '/api/orders/calculate-fee',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      false,
    ),

  createOrder: (body: {
    senderName?: string;
    senderPhone?: string;
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
    codAmount: number;
    note?: string;
  }) =>
    request<OrderItem>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMyOrders: () => request<OrderItem[]>('/api/orders/my'),

  getOrderLabel: (trackingCode: string) =>
    request<OrderLabel>(`/api/orders/${encodeURIComponent(trackingCode)}/label`),

  trackOrderPublic: (trackingCode: string) =>
    request<TrackingReadModel>(
      `/api/tracking/${encodeURIComponent(trackingCode)}`,
      {},
      false,
    ),

  getRecentPublicTracking: () =>
    request<PublicTrackingSummary[]>('/api/tracking/recent/public', {}, false),

  getDispatchDashboard: (params?: {
    status?: string;
    hubCode?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.hubCode) query.set('hubCode', params.hubCode);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<DispatchDashboardData>(
      `/api/dispatch/dashboard${qs ? `?${qs}` : ''}`,
    );
  },

  assignShipper: (trackingCode: string, shipperCode: string, hubCode?: string) =>
    request<DispatchOrder>('/api/dispatch/assign', {
      method: 'POST',
      body: JSON.stringify({ trackingCode, shipperCode, hubCode }),
    }),

  getShipperProfile: (shipperCode?: string) =>
    request<ShipperProfile>(
      `/api/dispatch/shipper/profile${shipperCode ? `?shipperCode=${encodeURIComponent(shipperCode)}` : ''}`,
    ),

  setShipperOnline: (isOnline: boolean) =>
    request<ShipperProfile>('/api/dispatch/shipper/status', {
      method: 'PATCH',
      body: JSON.stringify({ isOnline }),
    }),

  getShipperOrders: (tab?: string, shipperCode?: string) => {
    const q = new URLSearchParams();
    if (tab) q.set('tab', tab);
    if (shipperCode) q.set('shipperCode', shipperCode);
    return request<DispatchOrder[]>(
      `/api/dispatch/shipper/orders${q.toString() ? `?${q.toString()}` : ''}`,
    );
  },

  confirmPickup: (trackingCode: string, scannedBarcode?: string) =>
    request<DispatchOrder>(
      `/api/dispatch/orders/${encodeURIComponent(trackingCode)}/pickup`,
      {
        method: 'POST',
        body: JSON.stringify({ scannedBarcode }),
      },
    ),

  advanceTransit: (trackingCode: string, targetStatus?: string) =>
    request<DispatchOrder>(
      `/api/dispatch/orders/${encodeURIComponent(trackingCode)}/transit`,
      {
        method: 'POST',
        body: JSON.stringify({ targetStatus }),
      },
    ),

  confirmDeliver: (
    trackingCode: string,
    payload: { receiverSignature?: string; codCollected?: boolean; note?: string },
  ) =>
    request<DispatchOrder>(
      `/api/dispatch/orders/${encodeURIComponent(trackingCode)}/deliver`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),

  reportFailure: (trackingCode: string, reason: string) =>
    request<DispatchOrder>(
      `/api/dispatch/orders/${encodeURIComponent(trackingCode)}/fail`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    ),
};
