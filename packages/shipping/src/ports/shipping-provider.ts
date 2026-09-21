/**
 * Shipping Provider Port
 *
 * Decouples the fulfilment domain from external courier APIs (Delhivery, Shiprocket, BlueDart, etc.).
 * INVARIANT: No real courier provider is hardcoded or selected until production procurement is complete.
 */

import { ShippingAddressSnapshot } from "../fulfilment/fulfilment";

export interface CreateProviderShipmentInput {
  orderNumber: string;
  recipientAddress: ShippingAddressSnapshot;
  packageDetails: {
    weightGrams: number;
    description: string;
  };
}

export interface ProviderShipmentResult {
  providerShipmentId: string;
  trackingReference: string;
  status: string;
  trackingUrl?: string;
}

export interface ShippingProvider {
  createShipment(input: CreateProviderShipmentInput): Promise<ProviderShipmentResult>;
  getTracking(trackingReference: string): Promise<{ status: string; checkpoints: unknown[] }>;
  cancelShipment(providerShipmentId: string): Promise<boolean>;
}

/**
 * In-Memory Test Shipping Provider for local tests and manual operations simulation.
 */
export class TestShippingProvider implements ShippingProvider {
  public createdShipments: Array<{ input: CreateProviderShipmentInput; result: ProviderShipmentResult }> = [];
  public shouldFail = false;

  async createShipment(input: CreateProviderShipmentInput): Promise<ProviderShipmentResult> {
    if (this.shouldFail) {
      throw new Error("Shipping provider service unavailable");
    }

    const result: ProviderShipmentResult = {
      providerShipmentId: `shp_prov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackingReference: `VS-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: "MANIFESTED",
      trackingUrl: "https://tracking.vaahansafe.com/mock",
    };

    this.createdShipments.push({ input, result });
    return result;
  }

  async getTracking(trackingReference: string): Promise<{ status: string; checkpoints: unknown[] }> {
    return {
      status: "IN_TRANSIT",
      checkpoints: [
        { location: "Warehouse Hub", status: "PICKED_UP", timestamp: new Date().toISOString() },
      ],
    };
  }

  async cancelShipment(_providerShipmentId: string): Promise<boolean> {
    return true;
  }

  clear(): void {
    this.createdShipments = [];
    this.shouldFail = false;
  }
}
