import { Show } from "solid-js/web"
import { cn } from "~/lib/utils"
import { createSignal, For, onMount } from "solid-js"
import CategoriesSelect from "~/components/categories-select"
import { WishesGrid } from '~/pages/bookmarks'
import { Link } from '~/components/link'
import { useNavigate } from "@solidjs/router"
import { fetchFeed } from "~/lib/api"
import { useQuery } from "@tanstack/solid-query"
import { Wish } from "~/lib/api"
import { useBackButton } from "~/lib/useBackButton"



const mockNames = [
	"Arc'teryx", 'Beaded Breakast', 'Nike', 'Razor Keyboard',
	'Airpods', 'Louis Vuitton', 'Barbour', 'Handmade'
]

const mockSuggestions = [
	'Louis Vuitton', 'Louis Partridge', 'Louis Tomlinson', 'Louis Vuitton Bag',
	'Louis Garrel', 'Louis Vuitton Aesthetic', 'Louis Vuitton Wallpaper',
	'Louis Vuitton Shoes', 'Louis Hofmann', 'Louis Wain', 'Corona'
]


export const SearchFeed = () => {


	const backButton = useBackButton()

	const [search, setSearch] = createSignal('')
	const [searchMode, setSearchMode] = createSignal(true)
	const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(null)

	const navigate = useNavigate()
	
	const handleSuggestionClick = (suggestion: string) => {
		setSearch(suggestion)
		setSearchMode(false)
	}

	const handleInput = (e: any) => {
		setSearch(e.target.value)
	}
	
	const handleSearchClose = () => {
		setSearch('')
		setSearchMode(false)
	}
	
	const filteredSuggestions = () =>
		search().length > 0
			? mockSuggestions.filter(s => s.toLowerCase().includes(search().toLowerCase()))
			: []

	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['feed', search()],
		queryFn: () => fetchFeed(search()),
	}))

	onMount(() => {
		backButton.onClick(() => {
			navigate('/feed')
		})
	})

	return (
		<div class="relative flex flex-col items-center bg-none w-full h-screen overflow-hidden">
			<Show when={searchMode()}>
				<div class={cn('w-full h-20 p-5 z-20')}>
					<form
						onSubmit={e => {
							e.preventDefault()
							handleSuggestionClick(search())
						}}
						class="flex w-full rounded-2xl bg-secondary flex-row items-center justify-between pl-3"
					>
						<input
							ref={setSearchInput}
							type="search"
							value={search()}
							onInput={handleInput}
							class="h-full w-full bg-transparent focus:outline-none"
							placeholder="Search ideas"
						/>
						<button
							type="button"
							class="bg-none rounded-full size-10 flex items-center justify-center"
							onClick={() => {
								navigate('/feed')
							}}
						>
							<span class="material-symbols-rounded text-[20px]">close</span>
						</button>
					</form>
				</div>

				<Show
					when={search().length > 0}
					fallback={
						<div class="flex flex-col w-full items-center flex-1 overflow-y-auto pt-2" style="max-height: calc(100vh - 80px)">
							<div class='flex flex-col w-full items-center'>
								<p class="text-[#A6A6A6] text-[12px] pb-3">Recent queries</p>
								<div class="flex flex-row flex-wrap gap-2 mt-2 justify-center w-[300px] z-999">
									{mockNames.map((item) => (
										<button
											class="px-3 py-1 rounded-full bg-[#F4F4F5] text-xs font-medium hover:bg-[#e4e4e7] transition"
											onClick={() => setSearch(item)}
										>
											{item}
										</button>
									))}
								</div>
							</div>
							<div class='flex flex-col w-full items-center mt-5'>
								<p class="text-[#A6A6A6] text-[12px] pb-5">Explore ideas</p>
								{/* тут нужен фикс */}
								<CategoriesSelect selectedCategories={[]} setSelectedCategories={() => { }} />
							</div>
						</div>
					}
				>
					<div class="flex flex-col w-full items-center flex-1 overflow-y-auto pt-2" style="max-height: calc(100vh - 80px)">
						<For each={filteredSuggestions()}>
							{(suggestion) => (
								<button
									class="w-full text-left px-5 py-2 hover:bg-gray-100"
									onClick={() => handleSuggestionClick(suggestion)}
								>
									{suggestion}
								</button>
							)}
						</For>
						<Show when={filteredSuggestions().length === 0}>
							<div class="w-full text-center text-gray-400 py-4">No suggestions</div>
						</Show>
					</div>
				</Show>
			</Show>
			<Show when={!searchMode()}>
				<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
					<div
						class={cn('h-20 flex-shrink-0 w-full flex flex-row justify-between items-center p-5', 'flex')}>
						<button
							class="flex items-center justify-center bg-secondary rounded-full size-10"
					
							onClick={() => {
								setSearchMode(true)
							}}
						>
							<span class="material-symbols-rounded text-[20px]">search</span>
						</button>
						<p class="text-black text-xl font-extrabold">Discover</p>
						<Link href="/categories-edit" state={{ from: '/feed' }}
							class="flex items-center justify-center bg-secondary rounded-full size-10">
							<span class="material-symbols-rounded text-[20px]">page_info</span>
						</Link>
					</div>
				</div>
				<WishesGrid wishes={wishes as any} source="/feed" />
			</Show>
		</div>
	)
}   