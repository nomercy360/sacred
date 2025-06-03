import { fetchProfiles, UserProfile, Wish } from '~/lib/api'
import { Match, Switch, For, Component } from 'solid-js'
import { ImageButton } from '~/components/image-button'
import { useQuery } from '@tanstack/solid-query'
import { Link } from '~/components/link'

export default function PeoplePage() {
	const users = useQuery<UserProfile[]>(() => ({ // createQuery is fine, useQuery also works
		queryKey: ['users'],
		queryFn: () => fetchProfiles(),
		// enabled: false, // if you only want to fetch onMount or specific trigger
	}))

	const skeletonItems = Array.from({ length: 5 })

	function resolveImageUrl(wish: Wish) {
		if (!wish.images || wish.images.length === 0) return '/placeholder.jpg'

		return `https://assets.peatch.io/cdn-cgi/image/width=100,height=100,fit=cover/${wish.images[0].url}`
	}

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
				<div class="h-20 flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
					<Link
						href="/search"
						state={{ from: '/people' }}
						class="flex items-center justify-center bg-secondary rounded-full size-10">
						<span class="material-symbols-rounded text-[20px]">search</span>
					</Link>
					<p class="text-2xl font-extrabold">
						People
					</p>
					<Link class="flex items-center justify-center bg-secondary rounded-full size-10"
								href="/share">
						<span class="material-symbols-rounded text-[20px]">link</span>
					</Link>
				</div>
			</div>

			<div class="text-center flex-1 overflow-y-auto w-full pt-20">
				<Switch>
					<Match when={users.isLoading && !users.data}>
						<div class="space-y-4 pb-24 px-2 md:px-4">
							<div class="space-y-0.5 w-full">
								<For each={skeletonItems}>
									{() => <PersonSkeletonCard />}
								</For>
							</div>
						</div>
					</Match>

					<Match when={users.isError}>
						<div class="mt-10 px-4">
							<p class="text-red-500">Failed to load people.</p>
							<button
								class="mt-4 px-4 py-2 bg-primary text-white rounded-2xl"
								onClick={() => users.refetch()}
							>
								Retry
							</button>
						</div>
					</Match>

					<Match
						when={users.isSuccess && users.data && users.data.length > 0}>
						<div class="space-y-4 pb-24 px-2 md:px-4">
							<div class="space-y-0.5 w-full">
								<For each={users.data}>
									{(user) => (
										<ImageButton
											href={`/profiles/${user.id}`}
											images={user.wishlist_items.slice(0, 3).map((wish) => resolveImageUrl(wish))}
										>
											<div
												class="flex flex-col items-center justify-center gap-0.5 p-4">
												<img
													src={user.avatar_url || '/placeholder.jpg'}
													alt={user.name || 'User avatar'}
													class="size-9 rounded-full object-cover"
													loading="lazy"
												/>
												<p
													class="mt-3 text-xl font-bold">{user.name || 'Anonymous'}</p>
												<p
													class="text-sm font-extralight">
													{user.followers || 0} {user.followers === 1 ? 'follower' : 'followers'}
												</p>
											</div>
										</ImageButton>
									)}
								</For>
							</div>
						</div>
					</Match>
					<Match when={users.isSuccess && (!users.data || users.data.length === 0)}>
						<div class="mt-10 px-4">
							<p class="text-secondary-foreground">No people found yet.</p>
						</div>
					</Match>
				</Switch>
			</div>
		</div>
	)
}

const PersonSkeletonCard: Component = () => {
	return (
		<div
			class="w-full h-[200px] grid gap-0.5 rounded-full overflow-hidden relative bg-secondary">
			<div class="flex flex-col items-center justify-center gap-2">
				<div class="bg-background rounded-full size-9"></div>

				<div class="mt-3 bg-background h-5 w-3/5 rounded"></div>

				<div class="bg-background h-3 w-2/5 rounded"></div>
			</div>
		</div>
	)
}
