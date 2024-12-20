import { createQuery } from '@tanstack/solid-query'
import { fetchIdeas } from '~/lib/api'
import { For, Show } from 'solid-js'

const FeedPage = () => {
	const ideas = createQuery(() => ({
		queryKey: ['ideas'],
		queryFn: () => fetchIdeas(),
	}))

	return (
		<div
			class="relative flex flex-col items-center w-full h-screen overflow-hidden"
		>
			<div class="flex-shrink-0 w-full flex flex-row justify-between items-center p-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						search
					</span>
				</button>
				<p class="text-black text-2xl font-extrabold">
					Ideas
				</p>
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						bookmark
					</span>
				</button>
			</div>
			<div class="grid grid-cols-2 gap-0.5 pb-[200px] h-full w-full overflow-y-scroll">
				<Show when={ideas.isSuccess}>
					<div class="flex flex-col gap-0.5">
						<For each={ideas.data.slice(0, Math.ceil(ideas.data.length / 2))}>
							{(idea) => (
								<div class="border-[0.5px] rounded-3xl">
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={idea.name}
											 src={idea.image_url} />
								</div>
							)}
						</For>
					</div>
					<div class="flex flex-col gap-0.5 h-full flex-grow">
						<For each={ideas.data.slice(Math.ceil(ideas.data.length / 2))}>
							{(idea) => (
								<div class="border-[0.5px] rounded-3xl">
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={idea.name}
											 src={idea.image_url} />
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
