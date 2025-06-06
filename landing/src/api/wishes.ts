import { Wish, WishResponse } from '@/types/wish';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
  const data = await response.json();
  console.log(data);
  return data;

}


fetchWish('TS1t_66v1hmrKmUQBvyQl')