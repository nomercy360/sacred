import { fetchUserWishlist } from '~/lib/api'
import { createResource, Match, Switch } from 'solid-js'

type Wishlist = {
	id: number
	user_id: number
	name: string
	description: string
	is_public: boolean
	created_at: string
	items: {
		id: number
		wishlist_id: number
		name: string
		description: string
		image_url: string
		created_at: string
	}[]
}

export default function WishlistPage() {
	const [board, {}] = createResource<Wishlist>(fetchUserWishlist)
	return (
		<div
			class="relative flex flex-col items-center w-full h-screen overflow-hidden"
		>
			<div class="flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						page_info
					</span>
				</button>
				<p class="text-black text-xl font-bold">
					{board()?.name}
				</p>
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						arrow_outward
					</span>
				</button>
			</div>
			<div class="text-center pb-[200px] size-full flex-shrink-0 overflow-y-scroll">
				<Switch>
					<Match when={board()?.items.length === 0}>
						<p class='mb-7 mt-2'>
							There is nothing here yet. Start saving or explore collections
						</p>
						<div class="space-y-0.5 w-full">
							<button class="w-full h-[200px] grid grid-cols-3 gap-0.5 rounded-full">
							<span style={{ 'background-image': 'url(/left.png)' }}
										class="bg-cover bg-center bg-no-repeat rounded-l-full w-full h-full">
							</span>
								<span style={{ 'background-image': 'url(/fashion.png)' }}
											class="bg-cover bg-center bg-no-repeat size-full text-white font-bold text-xl flex items-center justify-center">
								Fashion
							</span>
								<span style={{ 'background-image': 'url(/right.png)' }}
											class="bg-cover bg-center bg-no-repeat rounded-r-full w-full h-full">
							</span>
							</button>
							<button class="w-full h-[200px] grid grid-cols-3 gap-0.5 rounded-full">
							<span style={{ 'background-image': 'url(/left.png)' }}
										class="bg-cover bg-center bg-no-repeat rounded-l-full w-full h-full">
							</span>
								<span style={{ 'background-image': 'url(/sports.png)' }}
											class="bg-cover bg-center bg-no-repeat size-full text-white font-bold text-xl flex items-center justify-center">
								Sport
							</span>
								<span style={{ 'background-image': 'url(/right.png)' }}
											class="bg-cover bg-center bg-no-repeat rounded-r-full w-full h-full">
							</span>
							</button>
							<button class="w-full h-[200px] grid grid-cols-3 gap-0.5 rounded-full">
							<span style={{ 'background-image': 'url(/left.png)' }}
										class="bg-cover bg-center bg-no-repeat rounded-l-full w-full h-full">
							</span>
								<span style={{ 'background-image': 'url(/technology.png)' }}
											class="bg-cover bg-center bg-no-repeat size-full text-white font-bold text-xl flex items-center justify-center">
								Sport
							</span>
								<span style={{ 'background-image': 'url(/right.png)' }}
											class="bg-cover bg-center bg-no-repeat rounded-r-full w-full h-full">
							</span>
							</button>
						</div>
					</Match>
				</Switch>
			</div>
		</div>
	)
}
