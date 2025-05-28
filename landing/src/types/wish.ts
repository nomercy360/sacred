export interface Category {
  id: string;
  name: string;
  image_url: string;
}

export interface WishImage {
  id: string;
  wish_id: string;
  url: string;
  created_at: string;
  position: number;
  width: number;
  height: number;
}

export interface Wish {
  id: string;
  name: string;
  url: string;
  created_at: string;
  updated_at: string;
  categories: Category[];
  images: WishImage[];
}