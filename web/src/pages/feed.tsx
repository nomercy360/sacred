import { createQuery } from '@tanstack/solid-query'
import { fetchIdeas } from '~/lib/api'
import { For, Show } from 'solid-js'
import { store } from '~/store'

const FeedPage = () => {
	const ideas = createQuery(() => ({
		queryKey: ['ideas'],
		queryFn: () => fetchIdeas(),
	}))

	function shareBoardURL() {
		const url =
			'https://t.me/share/url?' +
			new URLSearchParams({
				url: 'https://t.me/sacred_wished/app?startapp=u_' + store.user?.username,
			}).toString() +
			`&text=Check out ${store.user?.first_name}'s wishes`

		window.Telegram.WebApp.openTelegramLink(url)
	}

	return (
		<div
			class="relative flex flex-col items-center w-full h-screen overflow-hidden"
		>
			<div
				class="bg-background h-20 fixed flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						search
					</span>
				</button>
				<p class="text-black text-xl font-extrabold">
					Ideas
				</p>
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						bookmark
					</span>
				</button>
			</div>
			<div class="grid grid-cols-2 gap-0.5 pb-[200px] h-full w-full overflow-y-scroll">
				<Show when={ideas.isSuccess && ideas.data?.length > 0}>
					<div class="flex flex-col gap-0.5">
						<For each={ideas.data.slice(0, Math.ceil(ideas.data.length / 2))}>
							{(idea) => (
								<div class="border-[0.5px] border-border/70 rounded-3xl" style="aspect-ratio: 1/1">
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={idea.name}
											 src={idea.image_url}
											 onLoad={(e) => {
												 const img = e.target as HTMLImageElement
												 img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
											 }}
									/>
								</div>
							)}
						</For>
					</div>
					<div class="flex flex-col gap-0.5 h-full flex-grow">
						<For each={ideas.data.slice(Math.ceil(ideas.data.length / 2))}>
							{(idea) => (
								<div class="border-[0.5px] border-border/70 rounded-3xl" style="aspect-ratio: 1/1">
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={idea.name}
											 src={idea.image_url}
											 onLoad={(e) => {
												 const img = e.target as HTMLImageElement
												 img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
											 }}
									/>
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	)
}

export default FeedPage
