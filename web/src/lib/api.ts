import { store } from '~/store'
import { addToast } from '~/components/toast'

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
				addToast('Failed to get response from server')
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

			addToast(errorMessage)
			return { error: errorMessage, data: null }
		}

		return { data, error: null }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
		addToast(errorMessage)
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

export const fetchFeed = async (search: string) => {
	const { data } = await apiRequest('/feed' + (search ? `?search=${search}` : ''), {
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

export type UpdateWishRequest = {
	name: string | null
	notes: string | null
	url: string | null
	price: number | null
	currency: string | null
	category_ids: string[]
}

export const fetchUpdateWish = async (id: string, body: UpdateWishRequest) => {
	const { data, error } = await apiRequest('/wishes/' + id, {
		method: 'PUT',
		body: JSON.stringify(body),
	})

	return { data, error }
}

export const fetchAddWish = async () => {
	const { data, error } = await apiRequest('/wishes', { method: 'POST' })

	return { data, error }
}

export type WishImage = {
	id: string
	url: string
	width: number
	height: number
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
	name: string
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

export const uploadWishPhoto = async (wishId: string, file: File) => {
	const formData = new FormData()
	formData.append('photo', file)

	const response = await fetch(`${API_BASE_URL}/v1/wishes/${wishId}/photos`, {
		method: 'POST',
		body: formData,
		headers: {
			Authorization: `Bearer ${store.token}`,
		},
	})

	const data = await response.json()
	return { data, error: null }
}

export const uploadWishPhotosByUrls = async (wishId: string, imageUrls: string[]) => {
	const { data, error } = await apiRequest(`/wishes/${wishId}/photos`, {
		method: 'POST',
		body: JSON.stringify({ image_urls: imageUrls }),
	})

	if (error) {
		throw new Error(error)
	}

	return { data, error: null }
}
