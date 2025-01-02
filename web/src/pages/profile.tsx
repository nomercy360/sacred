import { fetchProfiles, fetchUserProfile, fetchUserWishes, UserProfile, Wish, WishImage } from '~/lib/api'
import { Match, Switch, Show, For } from 'solid-js'
import { ImageButton } from '~/components/image-button'
import { createQuery } from '@tanstack/solid-query'
import { currencySymbol } from '~/lib/utils'
import { Link } from '~/components/link'
import { store } from '~/store'
import { useParams } from '@solidjs/router'

export default function UserProfilePage() {
	const params = useParams()
	const wishes = createQuery<UserProfile>(() => ({
		queryKey: ['profile', params.id],
		queryFn: () => fetchUserProfile(params.id),
	}))

	function resolveImage(images: WishImage[]) {
		const img = images.find((img) => img.position === 1)
		return img ? img.url : '/placeholder.jpg'
	}

	function resolveAspectRatio(images: WishImage[]) {
		const img = images.find((img) => img.position === 1)
		return img ? `${img.width}/${img.height}` : `1/1`
	}

	function splitIntoGroups(array: Wish[] | undefined, groupCount: number) {
		if (!array) return []
		const groups: Wish[][] = Array.from({ length: groupCount }, () => [])
		array.forEach((item, index) => groups[index % groupCount].push(item))
		return groups
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
					<Match when={!wishes.isLoading && wishes.data?.wishlist_items.length}>
						<div class="grid grid-cols-2 gap-0.5">
							<For each={splitIntoGroups(wishes.data?.wishlist_items, 2)}>
								{(group) => (
									<div class="flex flex-col gap-0.5">
										<For each={group}>
											{(item) => (
												<Link
													class="bg-center bg-cover rounded-[25px] border-[0.5px] border-border/70"
													style={{
														'background-image': `url(${resolveImage(item.images)})`,
														'aspect-ratio': resolveAspectRatio(item.images),
													}}
													href={`/wishes/${item.id}`}
												>
												</Link>
											)}
										</For>
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
