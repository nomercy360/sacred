import { fetchUserProfile, UserProfile, Wish, WishImage } from '~/lib/api'
import { createEffect, For, Match, Show, Switch, onCleanup, createSignal, onMount } from 'solid-js'
import { createMutation, useQuery } from '@tanstack/solid-query'
import { Link } from '~/components/link'
import { useParams, useLocation } from '@solidjs/router'
import { useMainButton } from '~/lib/useMainButton'
import { store } from '~/store'
import { followUser, unfollowUser } from '~/lib/api'
import { queryClient } from '~/App'


export function resolveImage(images: WishImage[]) {
	const img = images.length > 0 ? images[0] : null
	return img ? `https://assets.peatch.io/cdn-cgi/image/width=400/${img.url}` : '/placeholder.jpg'
}

export function resolveAspectRatio(images: WishImage[]) {
	const img = images.length > 0 ? images[0] : null
	return img ? `${img.width}/${img.height}` : `1/1`
}

export function splitIntoGroups(array: Wish[] | undefined, groupCount: number) {
	if (!array) return []
	const groups: Wish[][] = Array.from({ length: groupCount }, () => [])
	array.forEach((item, index) => groups[index % groupCount].push(item))
	return groups
}

export default function UserProfilePage() {

	const params = useParams()
	const location = useLocation()
	const mainButton = useMainButton()

	const followMutation = createMutation(() => ({
		mutationFn: async () => {
			mainButton.showProgress()
			return await followUser(params.id)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['profile', params.id] })
		},
		onSettled: () => {
			mainButton.hideProgress()
		},
	}))

	const unfollowMutation = createMutation(() => ({
		mutationFn: async () => {
			mainButton.showProgress()
			return await unfollowUser(params.id)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['profile', params.id] })
		
		},
		onSettled: () => {
			mainButton.hideProgress()
		},
	}))



	const user = useQuery<UserProfile>(() => ({
		queryKey: ['profile', params.id],
		queryFn: () => fetchUserProfile(params.id),
		refetchOnWindowFocus: true,
	}))

	createEffect(() => {
		if (user.data?.id === store.user?.id) return

		mainButton.enable()
		const isFollowing = user.data?.is_following
		const name = user.data?.name ?? ''
		const text = `${isFollowing ? 'Unfollow' : 'Follow'} ${name}`
		const color = isFollowing ? '#808080' : '#000000'
		const action = isFollowing ? unfollowMutation.mutate : followMutation.mutate

		mainButton.setParams({ text, color })
		mainButton.offClick(followMutation.mutate)
		mainButton.offClick(unfollowMutation.mutate)
		mainButton.onClick(action)
	})

	onCleanup(() => {
		mainButton.hide()
		mainButton.offClick(followMutation.mutate)
		mainButton.offClick(unfollowMutation.mutate)
	})

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div class="flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">report</span>
				</button>
				<p class="text-black text-2xl font-extrabold">
					<Show when={!user.isLoading} fallback={<span>Loading...</span>}>
						{user.data?.name}
					</Show>
				</p>
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
				</button>
			</div>

			<div class="text-center pb-[200px] flex-1 overflow-y-auto w-full">
				<Switch>
					<Match when={user.isLoading}>
						<p class="mt-4">Loading your wishlist...</p>
					</Match>

					<Match when={user.error}>
						<div class="mt-4">
							<p class="text-red-500">Failed to load wishlist.</p>
							<button
								class="mt-2 px-4 py-2 bg-primary text-white rounded-2xl"
								onClick={() => user.refetch()}
							>
								Retry
							</button>
						</div>
					</Match>
					<Match when={!user.isLoading && user.data?.wishlist_items.length}>
						<div class="grid grid-cols-2 gap-0.5">
							<For each={splitIntoGroups(user.data?.wishlist_items, 2)}>
								{(group) => (
									<div class="flex flex-col gap-0.5">
										<For each={group}>
											{(item) => (
												<Link
													class="bg-center bg-cover rounded-[25px] border shadow-sm rounded-[25px]"
													style={{
														'background-image': `url(${resolveImage(item.images)})`,
														'aspect-ratio': resolveAspectRatio(item.images),
													}}
													href={`/wishes/${item.id}`}
													state={{ from: location.pathname }}
												>
												</Link>
											)}
										</For>
									</div>
								)}
							</For>
						</div>
					</Match>

					<Match when={!user.isLoading && !user.data?.wishlist_items.length}>
						<p class="text-center text-sl text-gray-500">
							Oops, this user has no wishlist yet. 😔
						</p>
					</Match>
				</Switch>
			</div>
		</div>
	)
}
