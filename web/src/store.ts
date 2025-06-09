import { createStore } from 'solid-js/store'
import { Wish } from '~/lib/api'
import { getCloudItem, setCloudItem } from '~/lib/cloudStorage'

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
    lastSearches: [],
})

export const setOnboarding = (onboarding: boolean) =>
    setStore('onboarding', onboarding)
export const setSearch = (value: string) => setStore('search', value)
export const setLastSearches = async (value: string[]) => {
    setStore('lastSearches', value)
    await setCloudItem('lastSearches', value)
}

export const loadSavedSearches = async () => {
    const savedSearches = await getCloudItem<string[]>('lastSearches')
    if (savedSearches?.length) {
        setStore('lastSearches', savedSearches)
    }
}

export const setToken = (token: string) => setStore('token', token)
export const setUser = (user: User | null) => setStore('user', user)
export const setWishes = (wishes: Wish[]) => setStore('wishes', wishes)
