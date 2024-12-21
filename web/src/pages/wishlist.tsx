import { fetchUserWishlist } from '~/lib/api'
import { Match, Switch, Show, For } from 'solid-js'
import { ImageButton } from '~/components/image-button'
import { createQuery } from '@tanstack/solid-query'
import { currencySymbol } from '~/lib/utils'

type WishlistItem = {
	id: string
	wishlist_id: string
	name: string
	description: string
	image_url: string
	created_at: string
	currency: string
	price: number
	is_public: boolean
	is_fulfilled: boolean
	is_claimed: boolean
}

type Wishlist = {
	id: string
	user_id: string
	name: string
	description: string
	is_public: boolean
	created_at: string
	items: WishlistItem[]
}

export default function WishlistPage() {
	const wishlist = createQuery<Wishlist>(() => ({
		queryKey: ['wishlist'],
		queryFn: () => fetchUserWishlist(),
	}))

	// Define available categories
	const categories = [
		{ name: 'Fashion', image: 'fashion' },
		{ name: 'Sport', image: 'sports' },
		{ name: 'Technology', image: 'technology' },
	]

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div class="flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">page_info</span>
				</button>
				<p class="text-black text-2xl font-extrabold">
					<Show when={!wishlist.isLoading} fallback={<span>Loading...</span>}>
						{wishlist.data?.name}
					</Show>
				</p>
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
				</button>
			</div>

			<div class="text-center pb-[200px] flex-1 overflow-y-auto w-full">
				<Switch>
					<Match when={wishlist.isLoading}>
						<p class="mt-4">Loading your wishlist...</p>
					</Match>

					<Match when={wishlist.error}>
						<div class="mt-4">
							<p class="text-red-500">Failed to load wishlist.</p>
							<button
								class="mt-2 px-4 py-2 bg-primary text-white rounded-2xl"
								onClick={() => wishlist.refetch()}
							>
								Retry
							</button>
						</div>
					</Match>

					<Match when={!wishlist.isLoading && !wishlist.data?.items.length}>
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

					<Match when={!wishlist.isLoading && wishlist.data?.items.length}>
						<div class="grid grid-cols-2 gap-2 px-2">
							<For each={wishlist.data?.items}>
								{(item) => (
									<div class="p-4 flex flex-col items-center border-[0.5px] rounded-2xl">
										<img src={item.image_url} alt={item.name}
												 class="rounded-2xl mb-4 aspect-square object-cover size-full" />
										<div class="text-sm font-semibold">
											{item.name}
											<span
												class="text-xs text-secondary-foreground">{' '}{item.price}{currencySymbol(item.currency)}</span>
										</div>
									</div>
								)}
							</For>
						</div>
					</Match>
				</Switch>
			</div>
		</div>
	)
}
