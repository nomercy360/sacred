import type {Wish, WishResponse} from '../types/wish';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function fetchWishes(): Promise<Wish[]> {
  const response = await fetch(`${API_BASE_URL}/v1/feed`);
  if (!response.ok) {
    throw new Error('Failed to fetch wishes');
  }
  return response.json();
}

export async function fetchWish(id: string): Promise<WishResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/wishes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch wish');
  }
  return response.json();
}
