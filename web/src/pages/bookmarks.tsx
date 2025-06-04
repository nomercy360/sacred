import { useQuery } from '@tanstack/solid-query'
import { fetchBookmarks, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/components/wish-grid'

const BookmarksPage = () => {
	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['bookmarks'],
		queryFn: () => fetchBookmarks(),
	}))

	return (
		<div
			class="relative flex flex-col items-center w-full h-screen overflow-hidden"
		>
			<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
				<div
					class="h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
					<button class="flex items-center justify-center bg-secondary rounded-full size-10">
						<span class="material-symbols-rounded text-[20px]">
							search
						</span>
					</button>
					<p class="text-black text-xl font-extrabold">
						Liked
					</p>
					<Link
						href="/categories-edit"
						state={{ from: '/feed' }}
						class="flex items-center justify-center bg-secondary rounded-full size-10">
						<span class="material-symbols-rounded text-[20px]">
							page_info
						</span>
					</Link>
				</div>
			</div>
			<WishesGrid wishes={wishes as any} source="/bookmarks" />
		</div>
	)
}

export default BookmarksPage