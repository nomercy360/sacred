import { fetchUserProfile, UserProfile, Wish } from '~/lib/api'
import { createEffect, For, Match, Show, Switch, onCleanup } from 'solid-js' // Removed unused createSignal, onMount for this snippet
import { createMutation, useQuery } from '@tanstack/solid-query'
import { Link } from '~/components/link'
import { useParams, useLocation } from '@solidjs/router'
import { useMainButton } from '~/lib/useMainButton'
import { store } from '~/store'
import { followUser, unfollowUser } from '~/lib/api'
import { queryClient } from '~/App'
import { ImageWithPlaceholder } from '~/components/image-placeholder'
import { getFirstImage, splitIntoGroups } from '~/lib/utils'

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
		if (!user.data || user.data?.id === store.user?.id) {
			mainButton.hide()
			return
		}

		mainButton.enable()
		mainButton.enable()
		const isFollowing = user.data?.is_following
		const name = user.data?.name ?? ''
		const text = `${isFollowing ? 'Unfollow' : 'Follow'} ${name}`
		const color = isFollowing ? '#808080' : '#000000' // Consider Tailwind classes for colors if consistent
		const action = isFollowing ? unfollowMutation.mutate : followMutation.mutate

		mainButton.setParams({ text, color })
		mainButton.offClick(followMutation.mutate) // Ensure previous listeners are off
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
			{/* Header remains the same */}
			<div class="flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">report</span>
				</button>
				<p class="text-black text-2xl font-extrabold">
					<Show when={!user.isLoading && user.data} fallback={<span>Loading...</span>}>
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
						<p class="mt-4">Loading user profile...</p> {/* Adjusted text slightly */}
					</Match>

					<Match when={user.isError}> {/* Use user.isError for clarity */}
						<div class="mt-4">
							<p class="text-red-500">Failed to load profile.</p>
							<button
								class="mt-2 px-4 py-2 bg-primary text-white rounded-2xl"
								onClick={() => user.refetch()}
							>
								Retry
							</button>
						</div>
					</Match>

					<Match when={user.isSuccess && user.data && user.data.wishlist_items.length > 0}>
						<div class="grid grid-cols-2 gap-0.5 p-0.5">
							<For each={splitIntoGroups(user.data?.wishlist_items, 2)}>
								{(group) => (
									<div class="flex flex-col gap-0.5">
										<For each={group}>
											{(item: Wish) => {
												const imageDetails = getFirstImage(item)
												return (
													<Link
														class="block border shadow-sm rounded-[25px] overflow-hidden"
														href={`/wishes/${item.id}`}
														state={{ from: location.pathname }}
													>
														<ImageWithPlaceholder
															src={`https://assets.peatch.io/cdn-cgi/image/width=400/${imageDetails.url}`}
															alt={item.name}
															width={imageDetails.width}
															height={imageDetails.height}
														/>
													</Link>
												)
											}}
										</For>
									</div>
								)}
							</For>
						</div>
					</Match>

					<Match when={user.isSuccess && user.data && user.data.wishlist_items.length === 0}>
						<p class="text-center text-lg text-gray-500 pt-10">
							Oops, this user has no wishes yet. 😔
						</p>
					</Match>
				</Switch>
			</div>
		</div>
	)
}
