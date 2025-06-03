import { Show, createSignal, For } from "solid-js"
import { cn } from "~/lib/utils"
import CategoriesSelect from "~/components/categories-select"
import { WishesGrid } from '~/pages/bookmarks'
import {useNavigate } from "@solidjs/router"
import { useQuery } from "@tanstack/solid-query"
import { Wish, fetchFeed } from "~/lib/api"
import { useBackButton } from "~/lib/useBackButton"
import { store, setSearch } from "~/store"
import { Link } from "~/components/link"

const mockNames = [
	"Arc'teryx", 'Beaded Breakast', 'Gel', 'Razor Keyboard',
	'Airpods', 'Louis Vuitton', 'Barbour', 'Handmade'
]

const mockSuggestions = [
	'Louis Vuitton', 'Louis Partridge', 'Louis Tomlinson', 'Louis Vuitton Bag',
	'Louis Garrel', 'Louis Vuitton Aesthetic', 'Louis Vuitton Wallpaper',
	'Louis Vuitton Shoes', 'Louis Hofmann', 'Louis Wain', 'Corona'
]

export const SearchFeed = () => {
	const [searchMode, setSearchMode] = createSignal(true)
	const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(null)

	const navigate = useNavigate()
	const backButton = useBackButton()

	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['feed', store.search],
		queryFn: () => fetchFeed(store.search),
	}))

	backButton.onClick(() => {
		setSearch('')
		navigate('/feed')
	})

	const handleSuggestionClick = (suggestion: string) => {
		setSearch(suggestion)
		setSearchMode(false)
		navigate('/feed', { state: { from: '/search-feed' } })
	}

	const handleInput = (e: any) => {
		setSearch(e.target.value)
	}

	const filteredSuggestions = () =>
		store.search.length > 0
			? mockSuggestions.filter(s =>
				s.toLowerCase().includes(store.search.toLowerCase())
			)
			: []

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<Show when={searchMode()}>
				<div class={cn('w-full h-20 p-5 z-20')}>
					<form
						onSubmit={e => {
							e.preventDefault()
							handleSuggestionClick(store.search)
						}}
						class="flex w-full rounded-2xl bg-secondary items-center pl-3"
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
							class="rounded-full size-10 flex items-center justify-center"
							onClick={() => {
								setSearch('')
								navigate('/feed')
							}}
						>
							<span class="material-symbols-rounded text-[20px]">close</span>
						</button>
					</form>
				</div>

				<Show when={store.search.length > 0} fallback={
					<div class="flex flex-col items-center w-full overflow-y-auto pt-2">
						<p class="text-[#A6A6A6] text-[12px] pb-3">Recent queries</p>
						<div class="flex flex-wrap gap-2 mt-2 justify-center w-[300px]">
							<For each={mockNames}>
								{item => (
									<button
										class="px-3 py-1 rounded-full bg-[#F4F4F5] text-xs hover:bg-[#e4e4e7]"
										onClick={() => handleSuggestionClick(item)}
									>
										{item}
									</button>
								)}
							</For>
						</div>
						<div class="mt-5 w-full justify-center">
							<p class="text-[#A6A6A6] text-[12px] text-center pb-5">Explore ideas</p>
							<CategoriesSelect selectedCategories={[]} setSelectedCategories={() => { }} />
						</div>
					</div>
				}>
					<div class="flex flex-col w-full overflow-y-auto pt-2">
						<For each={filteredSuggestions()}>
							{suggestion => (
								<button
									class="w-full text-left px-5 py-2 hover:bg-gray-100"
									onClick={() => handleSuggestionClick(suggestion)}
								>
									{suggestion}
								</button>
							)}
						</For>
						<Show when={filteredSuggestions().length === 0}>
							<div class="text-center text-gray-400 py-4">No suggestions</div>
						</Show>
					</div>
				</Show>
			</Show>

			<Show when={!searchMode()}>
				<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
					<div class="h-20 flex justify-between items-center p-5">
						<button
							class="bg-secondary rounded-full size-10 flex justify-center items-center"
							onClick={() => setSearchMode(true)}
						>
							<span class="material-symbols-rounded text-[20px]">search</span>
						</button>
						<p class="text-black text-xl font-extrabold">Discover</p>
						<Link href="/categories-edit" state={{ from: '/feed' }}
							class="bg-secondary rounded-full size-10 flex justify-center items-center"
						>
							<span class="material-symbols-rounded text-[20px]">page_info</span>
						</Link>
					</div>
				</div>
				<WishesGrid wishes={wishes as any} source="/feed" />
			</Show>
		</div>
	)
}