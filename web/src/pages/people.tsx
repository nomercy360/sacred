import { fetchProfiles, fetchUserWishlist } from '~/lib/api'
import { createResource, Match, Switch, Show, For, Component } from 'solid-js'
import { ImageButton } from '~/components/image-button'
import { createQuery } from '@tanstack/solid-query'
import { Link } from '~/components/link'

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

type UserInfoProps = {
	avatar_url: string
	first_name: string
	last_name: string
	followers: number
}

export type UserProfile = {
	id: string
	first_name: string
	last_name: string
	username: string
	created_at: string
	avatar_url: string
	interests: Array<{
		id: string
		name: string
		image_url: string
		created_at: string
		updated_at: string
		deleted_at: any
	}>
	followers: number
	wishlist_items: Array<{
		id: string
		wishlist_id: string
		name: string
		url: string
		price: number
		currency: any
		image_url: string
		notes: string
		source_id?: string
		source_type?: string
		is_purchased: boolean
		created_at: string
		updated_at: string
		deleted_at: any
	}>
}


const UserInfo = (props: UserInfoProps) => {
	return (
		<div class="flex flex-col items-center justify-center gap-0.5">
			<img src={props.avatar_url} alt={props.first_name} class="size-9 rounded-full" />
			<p class="mt-2 text-xl font-bold">{props.first_name}{' '}{props.last_name}</p>
			<p class="text-sm font-normal">
				{props.followers} followers
			</p>
		</div>
	)
}

export default function WishlistPage() {
	const users = createQuery<UserProfile[]>(() => ({
		queryKey: ['users'],
		queryFn: () => fetchProfiles(),
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

				</p>
				<Link class="flex items-center justify-center bg-secondary rounded-full size-10"
							href="/share">
					<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
				</Link>
			</div>

			<div class="text-center pb-[200px] flex-1 overflow-y-auto w-full">
				<Switch>
					<Match when={users.isLoading}>
						<p class="mt-4">Loading your wishlist...</p>
					</Match>

					<Match when={users.error}>
						<div class="mt-4">
							<p class="text-red-500">Failed to load wishlist.</p>
							<button
								class="mt-2 px-4 py-2 bg-primary text-white rounded"
								onClick={() => users.refetch()}
							>
								Retry
							</button>
						</div>
					</Match>

					<Match when={!users.isLoading && users.data?.length}>
						<div class="space-y-4 mt-4">
							<p>
								There is nothing here yet. Start saving or explore collections.
							</p>
							<div class="space-y-0.5 w-full">
								{users.data?.map((user) => (
									<ImageButton
										children={<UserInfo
											first_name={user.first_name} avatar_url={user.avatar_url}
											last_name={user.last_name} followers={user.followers} />}
										leftImage={user.wishlist_items[0]?.image_url}
										image={user.wishlist_items[1]?.image_url}
										rightImage={user.wishlist_items[2]?.image_url}
									/>
								))}
							</div>
						</div>
					</Match>
				</Switch>
			</div>
		</div>
	)
}
