import { useQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/pages/bookmarks'
import { Show } from 'solid-js'
import { cn } from '~/lib/utils'
import { store } from '~/store'
import { useLocation, useNavigate } from '@solidjs/router'
import { useBackButton } from '~/lib/useBackButton'

const FeedPage = () => {
	const backButton = useBackButton()
	const navigate = useNavigate()
	const location = useLocation()

	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['feed', store.search],
		queryFn: () => fetchFeed(store.search),
	}))


	const state = location.state as { from?: string } | undefined;
	backButton.onClick(() => {
		if (state?.from === '/search-feed') {
			navigate('/search-feed')
		} else {
			navigate('/') 
		}
	})

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
				<div class={cn('h-20 w-full flex justify-between items-center p-5')}>
					<button
						class="flex items-center justify-center bg-secondary rounded-full size-10"
						onClick={() => navigate('/search-feed')}
					>
						<span class="material-symbols-rounded text-[20px]">search</span>
					</button>
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