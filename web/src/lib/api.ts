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
		if (response.status !== 204) {
			try {
				data = await response.json()
			} catch {
				showToast({ title: 'Failed to get response from server', variant: 'error', duration: 2500 })
				return { error: 'Failed to get response from server', data: null }
			}
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
	return await apiRequest('/presigned-url',
		{
			method: 'POST',
			body: JSON.stringify({ file_name: filename }),
		})
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

export const saveUserPreferences = async (preferences: any) => {
	const { data, error } = await apiRequest('/user/settings', {
		method: 'PUT',
		body: JSON.stringify(preferences),
	})

	return { data, error }
}

export const saveUserInterests = async (categories: string[]) => {
	const { data, error } = await apiRequest('/user/interests', {
		method: 'PUT',
		body: JSON.stringify(categories),
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

export const fetchFeed = async () => {
	const { data } = await apiRequest('/feed', {
		method: 'GET',
	})

	return data
}

export const fetchBookmarks = async () => {
	const { data } = await apiRequest('/bookmarks', {
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
	source_id: string | null
	source_type: string | null
	categories: Array<{
		id: string
		name: string
		image_url: string
	}>
	copied_wish_id: string | null
	is_bookmarked: boolean
}

export type UserProfile = {
	id: string
	first_name: string
	last_name: string
	username: string
	created_at: string
	avatar_url: string
	interests: Array<{
		id: string
		name: string
		image_url: string
		created_at: string
		updated_at: string
		deleted_at: any
	}>
	followers: number
	wishlist_items: Array<Wish>
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

export const fetchUserProfile = async (id: string) => {
	const { data } = await apiRequest(`/profiles/${id}`, {
		method: 'GET',
	})

	return data
}

export const copyWish = async (id: string) => {
	const { data, error } = await apiRequest(`/wishes/${id}/copy`, {
		method: 'POST',
	})

	if (error) {
		throw new Error(error)
	}

	return data
}

export const deleteWish = async (id: string) => {
	const { data, error } = await apiRequest(`/wishes/${id}`, {
		method: 'DELETE',
	})

	if (error) {
		throw new Error(error)
	}

	return { data }
}

export const saveBookmark = async (id: string) => {
	const { data, error } = await apiRequest(`/wishes/${id}/bookmark`, {
		method: 'POST',
	})

	if (error) {
		throw new Error(error)
	}

	return data
}

export const removeBookmark = async (id: string) => {
	const { data, error } = await apiRequest(`/wishes/${id}/bookmark`, {
		method: 'DELETE',
	})

	if (error) {
		throw new Error(error)
	}

	return data
}
