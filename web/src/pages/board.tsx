import { Match, Switch, For, createSignal, Show, createEffect, onCleanup } from 'solid-js'
import { Link } from '~/components/link'
import { setStore, store } from '~/store'
import { cn } from '~/lib/utils'
import { resolveAspectRatio, resolveImage, splitIntoGroups } from '~/pages/profile'

export default function UserBoardPage() {
	async function closeOnboardingPopup() {
		window.Telegram.WebApp.CloudStorage.setItem('onboarding', 'done')
		setStore('onboarding', false)
	}

	return (
		<div class="relative flex flex-col items-center w-full h-screen overflow-y-auto pb-20">
			<div
				class="bg-background h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
				<Link href={"/profile/edit"} class="flex flex-row space-x-2 items-center justify-start" >
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
						<span class="material-symbols-rounded text-[20px]">bookmark</span>
					</Link>
					<button class="flex items-center justify-center bg-secondary rounded-full size-10">
						<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
					</button>
				</div>
			</div>

			<div class="text-center flex-1 w-full pb-20">
				<Switch>
					<Match when={!store.wishes.length}>
						<div
							class="absolute top-[15%] rotate-[-4deg] left-[10%] w-[240px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px] border-2 border-background bg-[#FEF5F3]">
							<span class="material-symbols-rounded text-[20px]">
								note_stack
							</span>
							<p class="font-medium leading-tight text-[#563730]">
								No content has been saved yet. Your saved items will appear here.
							</p>
						</div>
						<div
							class="absolute top-[30%] rotate-[8deg] -right-2 w-[220px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px] border-2 border-background bg-[#F7FCE5]">
							<span class="material-symbols-rounded text-[20px]">
								bookmark
							</span>
							<p class="font-medium leading-tight text-[#4C552E]">
								You can bookmark ideas. They won't appear on your board, but you'll have access to them
							</p>
						</div>
						<div
							class="absolute top-[38%] rotate-[-3deg] -left-2 w-[230px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px] border-2 border-background bg-[#F8F3FF]">
							<span class="material-symbols-rounded text-[20px]">
								mood
							</span>
							<p class="font-medium leading-tight text-[#584179]">
								Click your profile picture to access settings and change your visible name and profile link
							</p>
						</div>
						<div
							class="absolute top-[58%] rotate-[4deg] right-[10%] w-[230px] text-start pl-5 pt-4 pr-10 pb-8 flex flex-col items-start justify-start gap-2 rounded-[25px] border-2 border-background bg-[#FFFCEE]">
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
			<Show when={store.onboarding}>
				<OnboardingPopup onClose={closeOnboardingPopup} />
			</Show>
		</div>
	)
}

function OnboardingPopup(props: { onClose: () => void }) {
	const texts = [
		{
			title: 'Explore ideas',
			description: 'Need legal or career advice? Just type your message in the chat!',
		},
		{
			title: 'Save them',
			description: 'Need legal or career advice? Just type your message in the chat!',
		},
		{
			title: 'Peep others',
			description: 'Need legal or career advice? Just type your message in the chat!',
		},
		{
			title: 'Upload things',
			description: 'Need legal or career advice? Just type your message in the chat!',
		},
	]

	const [popupRef, setPopupRef] = createSignal<HTMLDivElement | null>(null)
	const [step, setStep] = createSignal(0)

	const tabs = [
		{ icon: 'interests' },
		{ icon: 'note_stack' },
		{ icon: 'group' },
		{ icon: 'add' },
	]

	function handleClickOutside(event: MouseEvent) {
		if (popupRef() && !popupRef()?.contains(event.target as Node)) {
			props.onClose()
		}
	}

	createEffect(() => {
		document.addEventListener('mousedown', handleClickOutside)
		onCleanup(() => {
			document.removeEventListener('mousedown', handleClickOutside)
		})
	})

	function onNext() {
		if (step() === 3) {
			props.onClose()
			return
		}
		setStep(step() + 1)
		window.Telegram.WebApp.HapticFeedback.selectionChanged()
	}

	return (
		<div class="flex justify-end flex-col h-screen fixed inset-0 w-full backdrop-blur-sm z-50">
			<div
				class="items-center bg-background rounded-t-2xl px-4 pt-4 pb-12 flex flex-col justify-between h-[300px] animate-slide-up"
				ref={setPopupRef}
			>
				<div class="w-full flex flex-row items-center justify-between">
					<button
						onClick={props.onClose}
						class="text-secondary-foreground flex items-center justify-center bg-secondary rounded-full size-10"
					>
						<span class="material-symbols-rounded text-[20px]">close</span>
					</button>
					<button
						class="text-secondary-foreground flex items-center justify-center bg-secondary rounded-2xl px-3 h-10"
						onClick={onNext}
					>
						{step() === 3 ? 'Close' : 'Next'}
					</button>
				</div>
				<div class="max-w-[270px] text-center gap-1 flex flex-col items-center justify-center">
					<p class="text-xl font-extrabold">{texts[step()].title}</p>
					<p class="text-secondary-foreground">{texts[step()].description}</p>
				</div>
				<div class="flex flex-row items-center space-x-8">
					{tabs.map(({ icon }, index) => (
						<span
							class={cn(
								'size-10 flex items-center justify-center rounded-full flex-col text-sm text-secondary-foreground',
								{
									'bg-primary': step() === index,
								},
							)}
						>
							<span
								class={cn('material-symbols-rounded text-[20px]', {
									'text-primary-foreground': step() === index,
								})}
							>
								{icon}
							</span>
						</span>
					))}
				</div>
			</div>
		</div>
	)
}
