export interface WishImage {
    url: string;
    position: number;
    width: number;
    height: number;
  }
  
  export interface WishCategory {
    id: string;
    name: string;
  }
  
  export type UserProfile = {
    id: string
    name: string
    username: string
    avatar_url: string
    followers: number
  }
  
  export type SaversResponse = {
    users: UserProfile[]
    total: number
  }
  
  export type WishResponse = {
    wish: Wish
    savers: SaversResponse
  }
  
  export interface Wish {
    id: string;
    name: string;
    url: string;
    images: WishImage[];
    categories: WishCategory[];
    created_at: string;
  }