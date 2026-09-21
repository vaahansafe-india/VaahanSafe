import {
  CreditCardIcon,
  Invoice01Icon,
  ShoppingCart01Icon,
  Tag01Icon,
  Wallet01Icon,
  Dollar01Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons";

export const commerceIcons = {
  payment: CreditCardIcon,
  "credit-card": CreditCardIcon,
  invoice: Invoice01Icon,
  receipt: Invoice01Icon,
  package: PackageIcon,
  cart: ShoppingCart01Icon,
  "shopping-cart": ShoppingCart01Icon,
  tag: Tag01Icon,
  wallet: Wallet01Icon,
  currency: Dollar01Icon,
  "currency-rupee": Dollar01Icon,
} as const;

export type CommerceIconName = keyof typeof commerceIcons;
