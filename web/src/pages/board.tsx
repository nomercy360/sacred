import { Match, Switch, For, Show } from 'solid-js'
import { Link } from '~/components/link'
import { setStore, store } from '~/store'
import { getFirstImage, splitIntoGroups } from '~/lib/utils'
import { Wish } from '~/lib/api'
import { ImageWithPlaceholder } from '~/components/image-placeholder'
import OnboardingPopup from '~/components/onboarding-popup'

export default function UserBoardPage() {

	async function closeOnboardingPopup() {
		window.Telegram.WebApp.CloudStorage.setItem('onboarding', 'done')
		setStore('onboarding', false)
	}

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
					<Match when={!store.wishes.length}>
						<div
							class="absolute top-[15%] rotate-[-4deg] left-[10%] w-[240px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px]  bg-[#FEF5F3]">
							<span class="material-symbols-rounded text-[20px]">
								note_stack
							</span>
							<p class="font-medium leading-tight text-[#563730]">
								No content has been saved yet. Your saved items will appear here.
							</p>
						</div>
						<div
							class="absolute top-[30%] rotate-[8deg] -right-2 w-[220px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px] bg-[#F7FCE5]">
							<span class="material-symbols-rounded text-[20px]">
								bookmark
							</span>
							<p class="font-medium leading-tight text-[#4C552E]">
								You can bookmark ideas. They won't appear on your board, but you'll have access to them
							</p>
						</div>
						<div
							class="absolute top-[38%] rotate-[-3deg] -left-2 w-[230px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px] bg-[#F8F3FF]">
							<span class="material-symbols-rounded text-[20px]">
								mood
							</span>
							<p class="font-medium leading-tight text-[#584179]">
								Click your profile picture to access settings and change your visible name and profile link
							</p>
						</div>
						<div
							class="absolute top-[58%] rotate-[4deg] right-[10%] w-[230px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px] bg-[#FFFCEE]">
							<span class="material-symbols-rounded text-[20px]">
								arrow_outward
							</span>
							<p class="font-medium leading-tight text-[#686140]">
								Click the arrow to share ideas and profiles (including your own)
							</p>
						</div>
					</Match>
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

