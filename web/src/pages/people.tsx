import { fetchProfiles, UserProfile } from '~/lib/api'
import { Match, Switch, createEffect } from 'solid-js'
import { ImageButton } from '~/components/image-button'
import { createQuery } from '@tanstack/solid-query'
import { Link } from '~/components/link'
import { useNavigate } from '@solidjs/router'

export default function PeoplePage() {
	const navigate = useNavigate()
	const users = createQuery<UserProfile[]>(() => ({
		queryKey: ['users'],
		queryFn: () => fetchProfiles(),
	}))

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-hidden">
			<div
				class="bg-background h-20 fixed flex-shrink-0 w-full flex flex-row justify-between items-center p-5 z-10">
				<button onClick={() => navigate('/search')} class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">search</span>
				</button>
				<p class="text-black text-2xl font-extrabold">
					People
				</p>
				<Link class="flex items-center justify-center bg-secondary rounded-full size-10"
					href="/share">
					<span class="material-symbols-rounded text-[20px]">mail</span>
				</Link>
			</div>

			<div class="text-center pb-[200px] flex-1 overflow-y-auto w-full mt-5">
				<Switch>
					<Match when={users.isLoading}>
						<p class="mt-4">Loading your wishlist...</p>
					</Match>

					<Match when={users.error}>
						<div class="mt-4">
							<p class="text-red-500">Failed to load wishlist.</p>
							<button
								class="mt-12 px-4 py-2 bg-primary text-white rounded-2xl"
								onClick={() => users.refetch()}
							>
								Retry
							</button>
						</div>
					</Match>

					<Match when={!users.isLoading && users.data?.length}>
						<div class="space-y-4 mt-20">
							{/* <p>
								There is nothing here yet. Start saving or explore collections.
							</p> */}
							<div class="space-y-0.5 w-full">
								{users.data?.map((user) => (
									<ImageButton
										href={`/profiles/${user.id}`}
										images={user.wishlist_items.map((wish) =>
											wish.images && wish.images[0] ?
												`https://assets.peatch.io/${wish.images[0].url}` :
												'/placeholder.jpg'
										)}
									>
										<div class="flex flex-col items-center justify-center gap-0.5">
											<img src={user.avatar_url || '/placeholder.jpg'} alt={user.name || 'User'} class="size-9 rounded-full" />
											<p class="mt-3 text-xl font-bold">{user.name || 'Anonymous'}</p>
											<p class="text-sm font-extralight">
												{user.followers || 0} followers
											</p>
										</div>
									</ImageButton>
								))}
							</div>
						</div>
					</Match>
				</Switch>
			</div>
		</div>
	)
}
