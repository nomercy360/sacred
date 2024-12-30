import { store } from '~/store'
import { showToast } from '~/components/ui/toast'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
	try {
		const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${store.token}`,
				...(options.headers || {}),
			},
		})

		let data
		try {
			data = await response.json()
		} catch {
			showToast({ title: 'Failed to get response from server', variant: 'error', duration: 2500 })
			return { error: 'Failed to get response from server', data: null }
		}

		if (!response.ok) {
			const errorMessage =
				Array.isArray(data?.error)
					? data.error.join('\n')
					: typeof data?.error === 'string'
						? data.error
						: 'An error occurred'

			showToast({ title: errorMessage, variant: 'error', duration: 2500 })
			return { error: errorMessage, data: null }
		}

		return { data, error: null }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
		showToast({ title: errorMessage, variant: 'error', duration: 2500 })
		return { error: errorMessage, data: null }
	}
}


export async function fetchPresignedUrl(filename: string) {
	const { data, error } = await apiRequest('/presigned-url',
		{
			method: 'POST',
			body: JSON.stringify({ filename }),
		})


	return data
}

export async function uploadToS3(url: string, file: File) {
	return await fetch(url, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
		},
	})
}

// export const fetchPresignedUrl = async (file: string) => {
// 	const { path, url } = await apiFetch({
// 		endpoint: `/presigned-url?filename=${file}`,
// 		showProgress: false,
// 	})
//
// 	return { path, url }
// }

export const saveUserPreferences = async (preferences: any) => {
	const { data, error } = await apiRequest('/user/settings', {
		method: 'PUT',
		body: JSON.stringify(preferences),
	})

	return { data, error }
}

export const fetchCategories = async () => {
	const { data } = await apiRequest('/categories', {
		method: 'GET',
	})

	return data
}

export const fetchUserWishes = async () => {
	const { data } = await apiRequest('/user/wishes', {
		method: 'GET',
	})

	return data
}

export const fetchIdeas = async () => {
	const { data } = await apiRequest('/ideas', {
		method: 'GET',
	})

	return data
}

export const fetchProfiles = async () => {
	const { data } = await apiRequest('/profiles', {
		method: 'GET',
	})

	return data
}

export type NewItemRequest = {
	name: string | null
	notes: string | null
	url: string | null
	images: { url: string, width: number, height: number, size: number }[]
	price: number | null
	currency: string | null
	is_public: boolean
	category_ids: string[]
}

export const fetchAddWish = async (item: NewItemRequest) => {
	const { data, error } = await apiRequest('/wishes', {
		method: 'POST',
		body: JSON.stringify(item),
	})

	return { data, error }
}

export type WishImage = {
	id: string
	url: string
	width: number
	height: number
	size: number
	position: number
}

export type Wish = {
	id: string
	user_id: string
	name: string
	notes: string | null
	images: Array<WishImage>
	url: string | null
	created_at: string
	currency: string | null
	price: number | null
	is_public: boolean
	is_fulfilled: boolean
	is_reserved: boolean
	reserved_by: string | null
	categories: Array<{
		id: string
		name: string
		image_url: string
	}>
}

export type Wishlist = {
	id: string
	user_id: string
	name: string
	description: string
	is_public: boolean
	created_at: string
}

export const fetchWish = async (id: string) => {
	const { data } = await apiRequest(`/wishes/${id}`, {
		method: 'GET',
	})

	return data
}
