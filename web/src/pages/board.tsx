import { Match, Switch, For, Show, onMount, createEffect } from 'solid-js'
import { Link } from '~/components/link'
import { setStore, store } from '~/store'
import { getFirstImage, splitIntoGroups } from '~/lib/utils'
import { fetchUserWishes, Wish } from '~/lib/api'
import { ImageWithPlaceholder } from '~/components/image-placeholder'
import OnboardingPopup from '~/components/onboarding-popup'
import { createQuery, useQueryClient } from '@tanstack/solid-query'

export default function UserBoardPage() {

	async function closeOnboardingPopup() {
		window.Telegram.WebApp.CloudStorage.setItem('onboarding', 'done')
		setStore('onboarding', false)
	}

	const wishesQuery = createQuery(() => ({
		queryKey: ['user', 'wishes'],
		queryFn: () => fetchUserWishes(),
		refetchOnWindowFocus: true, // подгружает заново при фокусе
	}))
	
	// потом присвоить в стор
	createEffect(() => {
		if (wishesQuery.data) {
			setStore('wishes', wishesQuery.data)
		}
	})

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-y-auto pb-20">
			<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
				<div
					class="h-20 flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
					<Link href={'/profile/edit'} class="flex flex-row space-x-2 items-center justify-start">
						<img
							src={store.user?.avatar_url}
							alt={store.user?.name}
							class="size-9 rounded-full"
						/>
						<span class="text-nowrap text-xl font-extrabold">{store.user?.name}</span>
					</Link>
					<div class="flex flex-row items-center space-x-3">
						<Link
							href={'/bookmarks'}
							state={{ from: '/' }}
							class="flex items-center justify-center bg-secondary rounded-full size-10">
							<span class="material-symbols-rounded text-[20px]">favorite</span>
						</Link>
						<button class="flex items-center justify-center bg-secondary rounded-full size-10">
							<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
						</button>
					</div>
				</div>
			</div>

			<div class="text-center flex-1 w-full pb-20 pt-20">
				<Switch>

					<Match when={store.wishes.length}>
						<div class="grid grid-cols-2 gap-0.5">
							<For each={splitIntoGroups(store.wishes, 2)}>
								{(group) => (
									<div class="flex flex-col gap-0.5">
										<For each={group}>
											{(item: Wish) => {
												const imageDetails = getFirstImage(item)
												return (
													<Link
														class="block border shadow-sm rounded-[25px] overflow-hidden"
														href={`/wishes/${item.id}`}
														state={{ from: '/' }}
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
				</Switch>
			</div>
			<Show when={store.onboarding}>
				<OnboardingPopup onClose={closeOnboardingPopup} />
			</Show>
		</div>
	)
}

