import { createQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { For, Show } from 'solid-js'
import { store } from '~/store'
import { Link } from '~/components/link'

const FeedPage = () => {
	const wishes = createQuery<Wish[]>(() => ({
		queryKey: ['feed'],
		queryFn: () => fetchFeed(),
	}))

	return (
		<div
			class="relative flex flex-col items-center w-full h-screen overflow-hidden"
		>
			<div
				class="bg-background h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
				<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						search
					</span>
				</button>
				<p class="text-black text-xl font-extrabold">
					Discover
				</p>
				<Link
					href="/categories-edit"
					state={{ from: '/feed' }}
					class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						page_info
					</span>
				</Link>
			</div>
			<div class="grid grid-cols-2 gap-0.5 pb-[200px] h-full w-full overflow-y-scroll">
				<Show when={wishes.isSuccess && wishes.data?.length > 0}>
					<div class="flex flex-col gap-0.5">
						<For each={wishes.data?.slice(0, Math.ceil(wishes.data.length / 2))}>
							{(wish) => (
								<Link href={`/wishes/${wish.id}`} class="border-[0.5px] border-border/70 rounded-3xl"
											state={{ from: '/feed' }}
											style="aspect-ratio: 1/1">
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={wish.name}
											 src={wish.images[0].url}
											 onLoad={(e) => {
												 const img = e.target as HTMLImageElement
												 img.parentElement!.style.aspectRatio = `${wish.images[0].width}/${wish.images[0].height}`
											 }}
									/>
								</Link>
							)}
						</For>
					</div>
					<div class="flex flex-col gap-0.5 h-full flex-grow">
						<For each={wishes.data?.slice(Math.ceil(wishes.data.length / 2))}>
							{(wish) => (
								<Link href={`/wishes/${wish.id}`} class="border-[0.5px] border-border/70 rounded-3xl"
											state={{ from: '/feed' }}
											style="aspect-ratio: 1/1">
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={wish.name}
											 src={wish.images[0].url}
											 onLoad={(e) => {
												 const img = e.target as HTMLImageElement
												 img.parentElement!.style.aspectRatio = `${wish.images[0].width}/${wish.images[0].height}`
											 }}
									/>
								</Link>
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	)
}

export default FeedPage
