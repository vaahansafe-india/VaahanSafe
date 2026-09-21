import type { Vehicle, VehicleRepository, VehicleId, UserId } from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbVehicleRow {
  id: string;
  user_id: string;
  registration_number: string;
  registration_number_normalized: string;
  vehicle_type: string;
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  color: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export class D1VehicleRepository implements VehicleRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbVehicleRow): Vehicle {
    return {
      id: row.id,
      customerId: row.user_id,
      registrationNumber: row.registration_number,
      make: row.make,
      model: row.model,
      year: row.year ?? undefined,
      type: row.vehicle_type as Vehicle["type"],
      primaryColor: row.color ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private normalizeReg(reg: string): string {
    return reg.toUpperCase().replace(/[\s\-]/g, "");
  }

  async findById(id: VehicleId | string): Promise<Vehicle | null> {
    const row = await this.db.queryFirst<DbVehicleRow>(
      `SELECT id, user_id, registration_number, registration_number_normalized, vehicle_type, make, model, variant, year, color, status, created_at, updated_at 
       FROM vehicles WHERE id = ? AND status != 'DELETED'`,
      [id]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByCustomerId(customerId: UserId | string): Promise<Vehicle[]> {
    const rows = await this.db.query<DbVehicleRow>(
      `SELECT id, user_id, registration_number, registration_number_normalized, vehicle_type, make, model, variant, year, color, status, created_at, updated_at 
       FROM vehicles WHERE user_id = ? AND status != 'DELETED' ORDER BY created_at DESC`,
      [customerId]
    );
    return rows.map((r) => this.mapRowToDomain(r));
  }

  async findByRegistration(reg: string): Promise<Vehicle | null> {
    const normalized = this.normalizeReg(reg);
    const row = await this.db.queryFirst<DbVehicleRow>(
      `SELECT id, user_id, registration_number, registration_number_normalized, vehicle_type, make, model, variant, year, color, status, created_at, updated_at 
       FROM vehicles WHERE registration_number_normalized = ? AND status != 'DELETED'`,
      [normalized]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async save(vehicle: Partial<Vehicle> & { id: string }): Promise<Vehicle> {
    const existing = await this.findById(vehicle.id);
    const now = new Date().toISOString();
    const normalizedReg = vehicle.registrationNumber ? this.normalizeReg(vehicle.registrationNumber) : "";

    if (existing) {
      await this.db.execute(
        `UPDATE vehicles SET
           make = COALESCE(?, make),
           model = COALESCE(?, model),
           color = COALESCE(?, color),
           year = COALESCE(?, year),
           vehicle_type = COALESCE(?, vehicle_type),
           updated_at = ?
         WHERE id = ?`,
        [
          vehicle.make ?? null,
          vehicle.model ?? null,
          vehicle.primaryColor ?? null,
          vehicle.year ?? null,
          vehicle.type ?? null,
          now,
          vehicle.id,
        ]
      );
    } else {
      if (!vehicle.customerId || !vehicle.registrationNumber || !vehicle.make || !vehicle.model) {
        throw new Error("Missing required fields to insert new vehicle");
      }
      await this.db.execute(
        `INSERT INTO vehicles (id, user_id, registration_number, registration_number_normalized, vehicle_type, make, model, year, color, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [
          vehicle.id,
          vehicle.customerId,
          vehicle.registrationNumber,
          normalizedReg,
          vehicle.type || "CAR",
          vehicle.make,
          vehicle.model,
          vehicle.year ?? null,
          vehicle.primaryColor ?? null,
          vehicle.createdAt || now,
          now,
        ]
      );
    }

    const updated = await this.findById(vehicle.id);
    if (!updated) {
      throw new Error(`Failed to save vehicle ${vehicle.id}`);
    }
    return updated;
  }
}
