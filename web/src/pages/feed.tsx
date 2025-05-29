import { useQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/pages/bookmarks'
import { createSignal } from 'solid-js'
import { cn } from '~/lib/utils'

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
			<div
				class={cn('w-full h-20 p-5 z-20', searchMode() ? 'block' : 'hidden')}>
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
			<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-b from-white to-transparent h-20">
			<div
				class={cn('h-20 flex-shrink-0 w-full flex flex-row justify-between items-center p-5', searchMode() ? 'hidden' : 'flex')}>
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
			<WishesGrid wishes={wishes as any} source="/feed" />
		</div>
	)
}

export default FeedPage
