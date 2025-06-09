import { createStore } from 'solid-js/store'
import { Wish } from '~/lib/api'

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
	search: string
	lastSearches: string[]
}>({
	onboarding: false,
	user: null,
	token: '',
	following: [],
	wishes: [],
	search: '',
	lastSearches: [
		"Arc'teryx", 'Beaded Breakast', 'Asics', 'Razor Keyboard',
		'Airpods', 'Louis Vuitton', 'Barbour', 'Handmade'
	]
})

export const setUser = (user: User) => setStore('user', user)
export const setToken = (token: string) => setStore('token', token)
export const setWishes = (wishes: Wish[]) => setStore('wishes', wishes)
export const setOnboarding = (onboarding: boolean) => setStore('onboarding', onboarding)
export const setSearch = (value: string) => setStore('search', value)
export const setLastSearches = (value: string[]) => setStore('lastSearches', value)