import {
  Car01Icon,
  Motorbike01Icon,
  DeliveryTruck01Icon,
  Bus01Icon,
  Key01Icon,
  Fuel01Icon,
  CircleGaugeIcon,
  Wrench01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";

export const vehicleIcons = {
  vehicle: Car01Icon,
  car: Car01Icon,
  bike: Motorbike01Icon,
  motorcycle: Motorbike01Icon,
  truck: DeliveryTruck01Icon,
  "truck-delivery": DeliveryTruck01Icon,
  bus: Bus01Icon,
  key: Key01Icon,
  fuel: Fuel01Icon,
  speedometer: CircleGaugeIcon,
  maintenance: Wrench01Icon,
  document: File01Icon,
} as const;

export type VehicleIconName = keyof typeof vehicleIcons;
