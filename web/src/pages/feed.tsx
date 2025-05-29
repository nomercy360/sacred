import { useQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/pages/bookmarks'
import { createSignal, Show } from 'solid-js'
import { cn } from '~/lib/utils'
import CategoriesSelect from '~/components/categories-select'

const mockNames = ['Arc\'teryx', 'Beaded Breakast', 'Nike', 'Razor Keyboard', 'Airpods', 'Louis Vuitton', 'Barbour', 'Handmade']

const FeedPage = () => {
	const [search, setSearch] = createSignal('')
	const [searchMode, setSearchMode] = createSignal(false)
	const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(null)

	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['feed', search()],
		queryFn: () => fetchFeed(search()),
	}))

	const toggleSearchMode = () => {
		setSearchMode(!searchMode())
		if (searchMode()) {
			searchInput()?.focus()
		}
	}

	return (
		<div class="relative flex flex-col items-center bg-none w-full h-screen overflow-hidden">
			<Show when={searchMode()}>
				<div class={cn('w-full h-20 p-5 z-20')}>
					<div class="flex w-full rounded-2xl bg-secondary flex-row items-center justify-between pl-3">
						<input
							ref={setSearchInput}
							type="text"
							value={search()}
							onInput={(e) => setSearch(e.target.value)}
							class="h-full w-full bg-transparent focus:outline-none"
							placeholder="Search ideas"
						/>
						<button
							class="bg-none rounded-full size-10 flex items-center justify-center"
							onClick={search() ? () => setSearch('') : toggleSearchMode}
						>
							<span class="material-symbols-rounded text-[20px]">close</span>
						</button>
					</div>
				</div>
			</Show>
			<Show when={!searchMode()}>
				<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
					<div
						class={cn('h-20 flex-shrink-0 w-full flex flex-row justify-between items-center p-5', 'flex')}>
						<button
							class="flex items-center justify-center bg-secondary rounded-full size-10"
							onClick={toggleSearchMode}
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
			</Show>
			<Show when={searchMode()}>
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
					<div class='flex flex-col w-full items-center mt-5 pb-24'>
						<p class="text-[#A6A6A6] text-[12px] pb-5">Explore ideas</p>
						<CategoriesSelect selectedCategories={[]} setSelectedCategories={() => { }} />
					</div>
				</div>
			</Show>
			<Show when={!searchMode()}>
				<WishesGrid wishes={wishes as any} source="/feed" />
			</Show>
		</div>
	)
}

export default FeedPage
