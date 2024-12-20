import { fetchUserWishlist } from '~/lib/api'
import { createResource, Match, Switch, Show, For, Component } from 'solid-js'
import { ImageButton } from '~/components/image-button'

type WishlistItem = {
	id: string
	wishlist_id: string
	name: string
	description: string
	image_url: string
	created_at: string
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
	const [wishlist, { refetch, mutate }] = createResource<Wishlist>(fetchUserWishlist)

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
					<Show when={!wishlist.loading} fallback={<span>Loading...</span>}>
						{wishlist()?.name}
					</Show>
				</p>
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
				</button>
			</div>

			<div class="text-center pb-[200px] flex-1 overflow-y-auto w-full">
				<Switch>
					<Match when={wishlist.loading}>
						<p class="mt-4">Loading your wishlist...</p>
					</Match>

					<Match when={wishlist.error}>
						<div class="mt-4">
							<p class="text-red-500">Failed to load wishlist.</p>
							<button
								class="mt-2 px-4 py-2 bg-primary text-white rounded"
								onClick={() => refetch()}
							>
								Retry
							</button>
						</div>
					</Match>

					<Match when={!wishlist.loading && wishlist()?.items.length === 0}>
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

					<Match when={!wishlist.loading && wishlist()?.items.length}>
						<div class="space-y-4 mt-4">
							<For each={wishlist()?.items}>
								{(item) => (
									<div class="flex items-center p-4 bg-white shadow rounded">
										<img src={item.image_url} alt={item.name} class="w-16 h-16 rounded mr-4" />
										<div>
											<h3 class="text-lg font-semibold">{item.name}</h3>
											<p class="text-gray-600">{item.description}</p>
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
