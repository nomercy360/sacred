import { createQuery, useQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/pages/bookmarks'
import { createSignal, Show } from 'solid-js'
import { cn } from '~/lib/utils'

const FeedPage = () => {
	const [search, setSearch] = createSignal('')
	const [searchMode, setSearchMode] = createSignal(true)
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
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div
				class={cn('w-full h-20 p-5', searchMode() ? 'block' : 'hidden')}>
				<div class="flex w-full rounded-2xl bg-secondary h-10 flex-row items-center justify-between pl-3">
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
			<div
				class={cn('bg-background h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5', searchMode() ? 'hidden' : 'flex')}>
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
			<WishesGrid wishes={wishes as any} source="/feed" />
		</div>
	)
}

export default FeedPage
