import { createStore } from 'solid-js/store'
import { Wish, Wishlist } from '~/lib/api'

type User = {
	id: string
	name: string
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
	onboarding: boolean
	user: User | null
	token: string
	following: number[]
	wishes: Wish[]
}>({
	onboarding: false,
	user: null as any,
	token: null as any,
	following: [],
	wishes: [],
})

export const setUser = (user: any) => setStore('user', user)

export const setToken = (token: string) => setStore('token', token)

export const setWishes = (wishes: Wish[]) => setStore('wishes', wishes)

export const setOnboarding = (onboarding: boolean) => setStore('onboarding', onboarding)

