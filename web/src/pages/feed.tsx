import { createQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/pages/bookmarks'

const FeedPage = () => {
	const wishes = createQuery<Wish[]>(() => ({
		queryKey: ['feed'],
		queryFn: () => fetchFeed(),
	}))

	return (
		<div
			class="relative flex flex-col items-center w-full h-screen overflow-hidden"
		>
			<div
				class="bg-background h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						search
					</span>
				</button>
				<p class="text-black text-xl font-extrabold">
					Discover
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
			<WishesGrid wishes={wishes as any} source="/feed" />
		</div>
	)
}

export default FeedPage
