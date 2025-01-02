import { createStore } from 'solid-js/store'
import { createSignal } from 'solid-js'
import { Wish, Wishlist } from '~/lib/api'

type User = {
	id: string
	first_name: string
	last_name: string
	username: string
	avatar_url: string
	chat_id: number
	language_code: string
	created_at: string
	interests: {
		id: string
		name: string
		image_url: string
	}[]
	email: string
}

export const [store, setStore] = createStore<{
	user: User | null
	token: string
	following: number[]
	wishes: Wish[]
}>({
	user: null as any,
	token: null as any,
	following: [],
	wishes: [],
})

export const setUser = (user: any) => setStore('user', user)

export const setToken = (token: string) => setStore('token', token)

export const setWishes = (wishlist: Wishlist) => setStore('wishes', wishlist)

export const setFollowing = (following: number[]) =>
	setStore('following', following)

export const [editUser, setEditUser] = createStore<any>({
	first_name: '',
	last_name: '',
	title: '',
	description: '',
	avatar_url: '',
	city: '',
	country: '',
	country_code: '',
	badge_ids: [],
	opportunity_ids: [],
})

export const [editCollaboration, setEditCollaboration] =
	createStore<any>({
		badge_ids: [],
		city: '',
		country: '',
		country_code: '',
		description: '',
		is_payable: false,
		opportunity_id: 0,
		title: '',
	})

export const [editPost, setEditPost] = createStore<{
	title: string
	description: string
	image_url: string | null
	country: string | null
	country_code: string | null
	city: string | null
}>({
	title: '',
	description: '',
	image_url: '',
	country: '',
	country_code: '',
	city: '',
})

export const [editCollaborationId, setEditCollaborationId] =
	createSignal<number>(0)

export const [editPostId, setEditPostId] = createSignal<number>(0)
