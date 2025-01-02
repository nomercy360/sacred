import { fetchUserWishes, Wish, WishImage } from '~/lib/api'
import { Match, Switch, For, createSignal, Show } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { Link } from '~/components/link'
import { setStore, store } from '~/store'
import { cn } from '~/lib/utils'

export default function UserBoardPage() {
	const wishes = createQuery<Wish[]>(() => ({
		queryKey: ['wishes'],
		queryFn: () => fetchUserWishes(),
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
			<div
				class="bg-background h-20 fixed flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
				<Link class="flex flex-row space-x-2 items-center justify-start" href="/settings">
					<img
						src={store.user?.avatar_url}
						alt={store.user?.first_name}
						class="size-9 rounded-full"
					/>
					<span class="text-nowrap text-xl font-extrabold">{store.user?.first_name} {store.user?.last_name}</span>
				</Link>
				<div class="flex flex-row items-center space-x-3">
					<button class="flex items-center justify-center bg-secondary rounded-full size-10">
						<span class="material-symbols-rounded text-[20px]">bookmark</span>
					</button>
					<button class="flex items-center justify-center bg-secondary rounded-full size-10">
						<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
					</button>
				</div>
			</div>

			<div class="overflow-y-scroll text-center flex-1 w-full pt-20 pb-20">
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

					<Match when={!wishes.isLoading && !wishes.data?.length}>
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
					<Match when={!wishes.isLoading && wishes.data?.length}>
						<div class="grid grid-cols-2 gap-0.5">
							<For each={splitIntoGroups(wishes.data, 2)}>
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
				<OnboardingPopup onClose={() => setStore('onboarding', false)} />
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

	const [step, setStep] = createSignal(0)

	const tabs = [
		{
			icon: 'interests',
		},
		{
			icon: 'note_stack',
		},
		{
			icon: 'group',
		},

		{
			icon: 'add',
		},
	]

	function onNext() {
		if (step() === 3) {
			setStep(0)
		} else {
			setStep(step() + 1)
		}
		window.Telegram.WebApp.HapticFeedback.selectionChanged()
	}

	return (
		<div class="flex justify-end flex-col h-screen fixed inset-0 w-full backdrop-blur-sm z-50">
			<div class="items-center bg-background rounded-t-2xl px-4 pt-4 pb-12 flex flex-col justify-between h-[300px]">
				<div class="w-full flex flex-row items-center justify-between">
					<button
						onClick={props.onClose}
						class="text-secondary-foreground  flex items-center justify-center bg-secondary rounded-full size-10">
						<span class="material-symbols-rounded text-[20px]">close</span>
					</button>
					<button
						class="text-secondary-foreground flex items-center justify-center bg-secondary rounded-2xl px-3 h-10"
						onClick={onNext}
					>
						Next
					</button>
				</div>
				<div class="max-w-[270px] text-center gap-1 flex flex-col items-center justify-center">
					<p class="text-xl font-extrabold">
						{texts[step()].title}
					</p>
					<p class="text-secondary-foreground">
						{texts[step()].description}
					</p>
				</div>
				<div class="flex flex-row items-center space-x-8">
					{tabs.map(({ icon }, index) => (
						<span
							class={cn('size-10 flex items-center justify-center rounded-full flex-col text-sm text-secondary-foreground', {
								'bg-primary': step() === index,
							})}
						>
							<span
								class={cn('material-symbols-rounded text-[20px]', { 'text-primary-foreground': step() === index })}>
								{icon}
							</span>
						</span>
					))}
				</div>
			</div>
		</div>
	)
}
