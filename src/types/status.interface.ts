export interface CartItem extends Bouquet {
  count: number;
}

export interface Bouquet {
  id: number;
  name: string;
  cost: number;
  imageUrl: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
  category5?: string;
  filters: BouquetFilters;
}

export interface BouquetFilters {
  lighting: string;
  colors: {
    color1: string;
    color2?: string;
    color3?: string;
  };
  format: {
    format1: string;
    format2?: string;
    format3?: string;
  };
  flowers: {
    flower1: string;
    flower2?: string;
    flower3?: string;
  };
}

export interface PromoCode {
  promoName: string;
  percentageDiscount: number;
}
