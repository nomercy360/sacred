import { useQuery } from '@tanstack/solid-query'
import { fetchBookmarks, type Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/components/wish-grid'
import { For, Show } from 'solid-js'

const BookmarksPage = () => {
	const wishes = useQuery(() => ({
		queryKey: ['bookmarks'],
		queryFn: fetchBookmarks,
		staleTime: 60_000,
	}))

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
				<div class="h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
					<button
						class="flex items-center justify-center bg-secondary rounded-full size-10"
						aria-label="Search"
					>
						<span class="material-symbols-rounded text-[20px]">
							search
						</span>
					</button>

					<h1 class="text-black text-xl font-extrabold">
						Liked
					</h1>

					<Link
						href="/categories-edit"
						state={{ from: '/feed' }}
						class="flex items-center justify-center bg-secondary rounded-full size-10"
						aria-label="Edit categories"
					>
						<span class="material-symbols-rounded text-[20px]">
							page_info
						</span>
					</Link>
				</div>
			</div>

			<Show when={wishes.isSuccess && wishes.data} fallback={
				<div class="grid grid-cols-2 gap-0.5 px-1 pt-24 w-full">
					<For each={Array(6)}>
						{() => (
							<div class="aspect-[3/4] bg-gray-200 rounded-[25px] animate-pulse" />
						)}
					</For>
				</div>
			}>
				<WishesGrid
					wishes={{
						isSuccess: wishes.isSuccess,
						data: wishes.data,
						isFetching: wishes.isFetching,
						refetch: wishes.refetch
					}}
					source="/bookmarks"
				/>
			</Show>

			<Show when={wishes.isSuccess && wishes.data?.length === 0}>
				<div class="w-full h-full flex flex-col items-center justify-center pt-20">
					<div class="text-gray-400 mb-4">
						<span class="material-symbols-rounded text-5xl">bookmark</span>
					</div>
					<p class="text-gray-500 text-lg font-medium">No bookmarks yet</p>
					<p class="text-gray-400 text-sm mt-2">Save wishes to see them here</p>
				</div>
			</Show>
		</div>
	)
}

export default BookmarksPage