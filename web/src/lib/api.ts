import { store } from '~/store'

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
			return { error: errorMessage, data: null }
		}

		return { data, error: null }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
		return { error: errorMessage, data: null }
	}
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
	console.log('🔎 FETCH FEED WITH SEARCH:', search)

	const { data } = await apiRequest('/feed' + (search ? `?search=${search}` : ''), {
		method: 'GET',
	})

	console.log('📥 FEED RESPONSE:', data)

	return data
}

type AutocompleteSearchResponse = {
	text: string
	count: number
}

export const autocompleteSearch = async (query: string): Promise<AutocompleteSearchResponse[]> => {
	if (!query.trim()) return []

	const { data } = await apiRequest(`/feed/autocomplete?search=${encodeURIComponent(query)}`, {
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
	delete_image_ids?: string[]
}

export const fetchUpdateWish = async (id: string, body: UpdateWishRequest & { photos?: File[] }) => {
	const formData = new FormData()

	// Add fields to form data
	if (body.name !== null) formData.append('name', body.name || '')
	if (body.url !== null) formData.append('url', body.url || '')
	if (body.notes !== null) formData.append('notes', body.notes || '')
	if (body.price !== null) formData.append('price', body.price.toString())
	if (body.currency !== null) formData.append('currency', body.currency || '')

	// Add category IDs
	body.category_ids.forEach(id => {
		formData.append('category_ids', id)
	})

	// Add delete image IDs if present
	if (body.delete_image_ids && body.delete_image_ids.length > 0) {
		body.delete_image_ids.forEach(id => {
			formData.append('delete_image_ids', id)
		})
	}

	// Add photo files if present
	if (body.photos && body.photos.length > 0) {
		body.photos.forEach(file => {
			formData.append('photos', file)
		})
	}

	const response = await fetch(`${API_BASE_URL}/v1/wishes/${id}`, {
		method: 'PUT',
		body: formData,
		headers: {
			Authorization: `Bearer ${store.token}`,
		},
	})

	let data
	try {
		data = await response.json()
	} catch {
		return { error: 'Failed to get response from server', data: null }
	}

	if (!response.ok) {
		const errorMessage = data?.error || 'An error occurred'
		return { error: errorMessage, data: null }
	}

	return { data, error: null }
}

export type CreateWishData = {
	name: string
	url?: string
	price?: number
	currency?: string
	notes?: string
	category_ids: string[]
	image_urls?: string[]
	photos?: File[]
}

export const createWish = async (wishData: CreateWishData) => {
	const formData = new FormData()

	// Add required fields
	formData.append('name', wishData.name)
	wishData.category_ids.forEach(id => {
		formData.append('category_ids', id)
	})

	// Add optional fields
	if (wishData.url) formData.append('url', wishData.url)
	if (wishData.price !== undefined) formData.append('price', wishData.price.toString())
	if (wishData.currency) formData.append('currency', wishData.currency)
	if (wishData.notes) formData.append('notes', wishData.notes)

	// Add image URLs
	if (wishData.image_urls && wishData.image_urls.length > 0) {
		wishData.image_urls.forEach(url => {
			formData.append('image_urls', encodeURIComponent(url))
		})
	}

	// Add photo files
	if (wishData.photos && wishData.photos.length > 0) {
		wishData.photos.forEach(file => {
			formData.append('photos', file)
		})
	}

	const response = await fetch(`${API_BASE_URL}/v1/wishes`, {
		method: 'POST',
		body: formData,
		headers: {
			Authorization: `Bearer ${store.token}`,
		},
	})

	let data
	try {
		data = await response.json()
	} catch {
		return { error: 'Failed to get response from server', data: null }
	}

	if (!response.ok) {
		const errorMessage = data?.error || 'An error occurred'
		return { error: errorMessage, data: null }
	}

	return { data, error: null }
}

type CreateWishResponse = {
	id: string
	user_id: string
	name: string | null
	notes: string | null
	currency: string | null
	price: number | null
	image_urls: string[]
	url: string | null
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
	copy_id?: string | null
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
	is_following: boolean
}

export type SaversResponse = {
	users: UserProfile[]
	total: number
}

export type WishResponse = {
	wish: Wish
	savers: SaversResponse
}

export const fetchWish = async (id: string): Promise<WishResponse> => {
	const { data } = await apiRequest(`/wishes/${id}`, {
		method: 'GET',
	})

	return data
}

// TODO: create extra page to show all people who saved the wish
export const fetchWishSavers = async (id: string): Promise<SaversResponse> => {
	const { data } = await apiRequest(`/wishes/${id}/savers`, {
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


export const followUser = async (followingId: string) => {
	const { data, error } = await apiRequest('/users/follow', {
		method: 'POST',
		body: JSON.stringify({ following_id: followingId }),
	})

	if (error) {
		throw new Error(error)
	}

	return data
}

export const unfollowUser = async (followingId: string) => {
	const { data, error } = await apiRequest('/users/unfollow', {
		method: 'POST',
		body: JSON.stringify({ following_id: followingId }),
	})

	if (error) {
		throw new Error(error)
	}

	return data
}
