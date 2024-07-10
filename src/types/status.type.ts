import { CartItem, PromoCode } from "./status.interface";

export type Order = {
  name: string;
  phoneNumber: string;
  email: string;
  secondPhoneNumber: string;
  receiverName: string;
  comment: string;
  deliveryMethod: DeliveryRadioGroupOption;
  paymentMethod: PayRadioGroupOptions;
  appliedPromoCode?: PromoCode;
  cartItems: CartItem[];
  finalPrice: number;
  address?: {
    deliveryAddress: string;
    apartmentNumber: string;
    deliveryTime: string;
  };
};

const deliveryRadioGroupOptions = ["Самовывоз", "Доставка курьером"] as const;
const payRadioGroupOptions = [
  "Банковская карта",
  "Наличными",
  "Apple pay",
  "Google pay",
  "Криптовалюта",
  "С расчетного счета",
] as const;

export type DeliveryRadioGroupOption =
  (typeof deliveryRadioGroupOptions)[number];
export type PayRadioGroupOptions = (typeof payRadioGroupOptions)[number];
