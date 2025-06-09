import {
    Show,
    createSignal,
    For,
    createResource,
    createEffect,
    onMount,
} from 'solid-js'
import { cn } from '~/lib/utils'
import CategoriesSelect from '~/components/categories-select'
import { WishesGrid } from '~/components/wish-grid'
import { useNavigate } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { Wish, autocompleteSearch, fetchFeed } from '~/lib/api'
import { useBackButton } from '~/lib/useBackButton'
import {
    store,
    setSearch,
    setStore,
    setLastSearches,
    loadSavedSearches,
} from '~/store'
import { Link } from '~/components/link'

export const SearchFeed = () => {
    const { lastSearches } = store

    onMount(() => {
        if (window.Telegram.WebApp.ready) {
            loadSavedSearches()
        } else {
            window.Telegram.WebApp.onEvent('viewportChanged', loadSavedSearches)
        }
    })

    const search = () => store.search.trim()

    const [searchMode, setSearchMode] = createSignal(true)
    const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(
        null,
    )

    const [searchTerm, setSearchTerm] = createSignal('')
    const [suggestions] = createResource(searchTerm, autocompleteSearch)

    const wishes = useQuery<Wish[]>(() => ({
        queryKey: ['feed', search()],
        queryFn: () => fetchFeed(search()),
    }))

    const navigate = useNavigate()
    const backButton = useBackButton()

    backButton.onClick(() => {
        setSearch('')
        navigate('/feed')
    })

    const handleSuggestionClick = async (suggestion: string) => {
        const trimmedSuggestion = suggestion.trim()
        if (!trimmedSuggestion) return

        const updatedSearches = [
            trimmedSuggestion,
            ...lastSearches.filter(s => s !== trimmedSuggestion)
        ].slice(0, 8)
        
        await setLastSearches(updatedSearches)
        setSearch(trimmedSuggestion)
        setSearchMode(false)
        navigate('/feed', { state: { from: '/search-feed' } })
    }

    const handleInput = async (e: any) => {
        const value = e.target.value
        setSearch(value)
        setSearchTerm(value)

        const trimmedValue = value.trim()
        if (!trimmedValue) return

        const updatedSearches = [
            trimmedValue,
            ...lastSearches.filter(s => s !== trimmedValue)
        ].slice(0, 8)
        
        await setLastSearches(updatedSearches)
    }

    const resetSearch = () => {
        setSearch('')
        setSearchTerm('')
    }

    return (
        <div class="relative flex h-screen w-full flex-col items-center overflow-hidden">
            <Show when={searchMode()}>
                <div class={cn('z-20 h-20 w-full p-5')}>
                    <form
                        onSubmit={e => {
                            e.preventDefault()
                            if (store.search.trim().length > 0) {
                                handleSuggestionClick(store.search)
                            }
                        }}
                        class="flex w-full items-center rounded-2xl bg-secondary pl-3"
                    >
                        <input
                            ref={setSearchInput}
                            type="search"
                            enterkeyhint="search"
                            value={store.search}
                            onInput={handleInput}
                            class="h-full w-full bg-transparent focus:outline-none"
                            placeholder="Search ideas"
                        />
                        <button
                            type="button"
                            class="flex size-10 items-center justify-center rounded-full"
                            onClick={() => {
                                setSearch('')
                                navigate('/feed')
                            }}
                        >
                            <span class="material-symbols-rounded text-[20px]">
                                close
                            </span>
                        </button>
                    </form>
                </div>

                <Show
                    when={store.search.length > 0}
                    fallback={
                        <div class="flex w-full flex-col items-center overflow-y-auto pt-2">
                            <p class="pb-3 text-[12px] text-[#A6A6A6]">
                                Recent queries
                            </p>
                            <div class="mt-2 flex w-[300px] flex-wrap justify-center gap-2">
                                <For each={lastSearches}>
                                    {item => (
                                        <button
                                            class="rounded-full bg-[#F3F3F3] px-3 py-1 text-[12px] font-medium hover:bg-[#e4e4e7]"
                                            onClick={() =>
                                                handleSuggestionClick(item)
                                            }
                                        >
                                            {item.length > 20
                                                ? item.slice(0, 20) + '...'
                                                : item}
                                        </button>
                                    )}
                                </For>
                            </div>
                            <div class="mt-5 w-full justify-center">
                                <p class="pb-5 text-center text-[12px] text-[#A6A6A6]">
                                    Explore ideas
                                </p>
                                <CategoriesSelect
                                    selectedCategories={[]}
                                    setSelectedCategories={() => {}}
                                />
                            </div>
                        </div>
                    }
                >
                    <div class="flex w-full flex-col overflow-y-auto pt-2">
                        <For each={suggestions()}>
                            {suggestion => (
                                <button
                                    class="w-full px-5 py-2 text-left hover:bg-gray-100"
                                    onClick={() =>
                                        handleSuggestionClick(suggestion.text)
                                    }
                                >
                                    {suggestion.text}
                                </button>
                            )}
                        </For>
                        <Show when={suggestions()?.length === 0}>
                            <div class="py-4 text-center text-gray-400">
                                No suggestions
                            </div>
                        </Show>
                    </div>
                </Show>
            </Show>

            <Show when={!searchMode()}>
                <div class="fixed left-0 right-0 top-0 z-10 h-20 bg-gradient-to-t from-transparent to-white">
                    <div class="flex h-20 items-center justify-between p-5">
                        <button
                            class="flex size-10 items-center justify-center rounded-full bg-secondary"
                            onClick={() => {
                                resetSearch()
                                setSearchMode(true)
                            }}
                        >
                            <span class="material-symbols-rounded text-[20px]">
                                search
                            </span>
                        </button>
                        <p class="text-xl font-extrabold text-black">
                            Discover
                        </p>
                        <Link
                            href="/categories-edit"
                            state={{ from: '/feed' }}
                            class="flex size-10 items-center justify-center rounded-full bg-secondary"
                        >
                            <span class="material-symbols-rounded text-[20px]">
                                page_info
                            </span>
                        </Link>
                    </div>
                </div>
                <WishesGrid wishes={wishes as any} source="/feed" />
            </Show>
        </div>
    )
}
