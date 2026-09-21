export type OrderFulfillmentStage =
  | "ORDER_PLACED"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface FulfillmentRailStep {
  id: string;
  label: string;
  sublabel?: string;
  state: "completed" | "current" | "future" | "failed";
  timestamp?: string;
  description?: string;
}

export interface OrderItemDetail {
  id: string;
  name: string;
  catalogCode: string;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
  itemType: string;
}

export interface ProductMediaItem {
  heroUrl: string;
  thumbUrl: string;
  detailUrl: string;
  altText: string;
}

export interface OrderVehicleRef {
  id: string;
  plateNumber: string;
  makeModel: string;
}

export interface OrderQrRef {
  id: string;
  publicId: string;
  visibleCode: string;
  status: string;
}

export interface OrderAddressRef {
  id: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface OrderFulfilmentRef {
  id: string;
  status: string;
  processingAt?: string | null;
  packedAt?: string | null;
  completedAt?: string | null;
}

export interface OrderShipmentRef {
  id: string;
  provider: string;
  trackingReference: string | null;
  status: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentProvider: string;
  paymentRef: string | null;
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  items: OrderItemDetail[];
  productMedia: ProductMediaItem;
  vehicle: OrderVehicleRef | null;
  qrSticker: OrderQrRef | null;
  shippingAddress: OrderAddressRef | null;
  fulfilment: OrderFulfilmentRef | null;
  shipment: OrderShipmentRef | null;
  fulfillmentStage: OrderFulfillmentStage;
  timelineSteps: FulfillmentRailStep[];
  canCancel: boolean;
}

export interface OrdersCategoryCounts {
  all: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface OrdersPageData {
  orders: OrderListItem[];
  counts: OrdersCategoryCounts;
  vehicles: OrderVehicleRef[];
}

export interface OrderFilterState {
  status: string;
  search: string;
  vehicleId: string;
  paymentStatus: string;
}
