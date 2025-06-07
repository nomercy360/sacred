import { useQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/components/wish-grid'
import { cn } from '~/lib/utils'
import { store } from '~/store'

const FeedPage = () => {
	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['feed', store.search],
		queryFn: () => fetchFeed(store.search),
	}))

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden px-[1.5px]">
			<div class="fixed top-0 left-0 right-0 bg-gradient-to-t from-transparent to-white h-20 z-20">
				<div class={cn('h-20 w-full flex justify-between items-center p-5')}>
					<Link
						href="/search-feed"
						state={{ from: '/feed' }}
						class="flex items-center justify-center bg-secondary rounded-full size-10"
					>
						<span class="material-symbols-rounded text-[20px]">search</span>
					</Link>
					<p class="text-black text-xl font-extrabold">Discover</p>
					<Link
						href="/categories-edit"
						state={{ from: '/feed' }}
						class="flex items-center justify-center bg-secondary rounded-full size-10"
					>
						<span class="material-symbols-rounded text-[20px]">page_info</span>
					</Link>
				</div>
			</div>
			<WishesGrid wishes={wishes as any} source="/feed" />
		</div>
	)
}

export default FeedPage
