import { store } from '~/store'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
export const CDN_URL = 'https://assets.peatch.io'

export const apiFetch = async ({
																 endpoint,
																 method = 'GET',
																 body = null,
																 showProgress = true,
																 responseContentType = 'json' as 'json' | 'blob',
															 }: {
	endpoint: string
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
	body?: any
	showProgress?: boolean
	responseContentType?: string
}) => {
	const headers: { [key: string]: string } = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${store.token}`,
	}

	try {
		// showProgress && window.Telegram.WebApp.MainButton.showProgress(false)

		const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		})

		if (!response.ok) {
			const errorResponse = await response.json()
			throw { error: errorResponse.message, data: null }
		}

		switch (response.status) {
			case 204:
				return { data: null, error: null }
			default:
				switch (responseContentType) {
					case 'json':
						const reps = await response.json()
						return { data: reps, error: null }
					case 'blob':
						const resp = await response.blob()
						return { data: resp, error: null }
					default:
						throw new Error('Invalid response content type')
				}
		}
	} finally {
		// showProgress && window.Telegram.WebApp.MainButton.hideProgress()
	}
}


export async function fetchPresignedUrl(filename: string) {
	const response = await apiFetch({
		endpoint: '/presigned-url',
		method: 'POST',
		body: { file_name: filename },
	})

	return response as any
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
	return await apiFetch({
		endpoint: '/user/settings',
		method: 'PUT',
		body: preferences,
	})
}

export const fetchCategories = async () => {
	const { data } = await apiFetch({
		endpoint: '/categories',
		method: 'GET',
	})

	return data
}

export const fetchUserWishes = async () => {
	const { data } = await apiFetch({
		endpoint: `/user/wishes`,
		method: 'GET',
	})

	return data
}

export const fetchIdeas = async () => {
	const { data } = await apiFetch({
		endpoint: `/ideas`,
		method: 'GET',
	})

	return data
}

export const fetchProfiles = async () => {
	const { data } = await apiFetch({
		endpoint: `/profiles`,
		method: 'GET',
	})

	return data
}

export type NewItemRequest = {
	name: string
	notes: string | null
	url: string | null
	image_url: string | null
	price: number | null
	currency: string | null
	is_public: boolean
}


export const fetchAddWish = async (item: NewItemRequest) => {
	const { data } = await apiFetch({
		endpoint: `/wishes`,
		method: 'POST',
		body: {
			...item,
		},
	})

	return data
}


export type Wish = {
	id: string
	user_id: string
	name: string
	notes: string | null
	image_url: string | null
	url: string | null
	created_at: string
	currency: string | null
	price: number | null
	is_public: boolean
	is_fulfilled: boolean
	is_reserved: boolean
	reserved_by: string | null
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
	const { data } = await apiFetch({
		endpoint: `/wishes/${id}`,
		method: 'GET',
	})

	return data
}
