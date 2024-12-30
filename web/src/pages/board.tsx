import { fetchUserWishes, Wish, WishImage } from '~/lib/api'
import { Match, Switch, Show, For } from 'solid-js'
import { ImageButton } from '~/components/image-button'
import { createQuery } from '@tanstack/solid-query'
import { currencySymbol } from '~/lib/utils'
import { Link } from '~/components/link'
import { store } from '~/store'

export default function UserBoardPage() {
	const wishes = createQuery<Wish[]>(() => ({
		queryKey: ['wishes'],
		queryFn: () => fetchUserWishes(),
	}))

	// Define available categories
	const categories = [
		{ name: 'Fashion', image: 'fashion' },
		{ name: 'Sport', image: 'sports' },
		{ name: 'Technology', image: 'technology' },
	]

	function resolveImage(images: WishImage[]) {
		// find image with position 1 or else return link to placeholder
		const img = images.find((img) => img.position === 1)
		return img ? img.url : '/placeholder.jpg'
	}

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div class="flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">page_info</span>
				</button>
				<p class="text-black text-2xl font-extrabold">
					<Show when={!wishes.isLoading} fallback={<span>Loading...</span>}>
						{store.user?.first_name} board
					</Show>
				</p>
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
				</button>
			</div>

			<div class="text-center pb-[200px] flex-1 overflow-y-auto w-full">
				<Switch>
					<Match when={wishes.isLoading}>
						<p class="mt-4">Loading your wishlist...</p>
					</Match>

					<Match when={wishes.error}>
						<div class="mt-4">
							<p class="text-red-500">Failed to load wishlist.</p>
							<button
								class="mt-2 px-4 py-2 bg-primary text-white rounded-2xl"
								onClick={() => wishes.refetch()}
							>
								Retry
							</button>
						</div>
					</Match>

					<Match when={!wishes.isLoading && !wishes.data?.length}>
						<div class="space-y-4 mt-4">
							<p>
								There is nothing here yet. Start saving or explore collections.
							</p>
							<div class="space-y-0.5 w-full">
								{categories.map((category) => (
									<ImageButton
										children={category.name}
										image={category.image}
										leftImage={`/placeholder.jpg`}
										rightImage={`/placeholder.jpg`}
									/>
								))}
							</div>
						</div>
					</Match>

					<Match when={!wishes.isLoading && wishes.data?.length}>
						<div class="grid grid-cols-2 gap-2 px-2 overflow-y-scroll">
							<For each={wishes.data}>
								{(item) => (
									<Link class="p-4 flex flex-col items-center"
												href={`/wishes/${item.id}`}>
										<img src={resolveImage(item.images)} alt={item.name}
												 class="rounded-2xl mb-4 aspect-square object-cover size-full" />
										<div class="flex flex-col items-center justify-center text-sm font-semibold">
											<p>{item.name}</p>
											<span
												class="text-xs text-secondary-foreground">{' '}{item.price}{currencySymbol(item.currency!)}</span>
										</div>
									</Link>
								)}
							</For>
						</div>
					</Match>
				</Switch>
			</div>
		</div>
	)
}
