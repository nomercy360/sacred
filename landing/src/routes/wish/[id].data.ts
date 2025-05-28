import { query } from "@solidjs/router";
import { Wish } from '../../types/wish';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const getWishData = query(async (id: string): Promise<Wish | null> => {
  "use server";
  
  try {
    const response = await fetch(`${API_BASE_URL}/v1/wishes/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch wish');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching wish:', error);
    throw error;
  }
}, "wish");