export interface WishImage {
  url: string;
  position: number;
}

export interface WishCategory {
  id: string;
  name: string;
}

export interface Wish {
  id: string;
  name: string;
  url: string;
  images: WishImage[];
  categories: WishCategory[];
  created_at: string;
}