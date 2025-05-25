import { useQuery } from '@tanstack/solid-query'
import { fetchBookmarks, Wish } from '~/lib/api'
import { For, Show } from 'solid-js'
import { Link } from '~/components/link'

const BookmarksPage = () => {
	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['bookmarks'],
		queryFn: () => fetchBookmarks(),
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
					Bookmarks
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
			<WishesGrid wishes={wishes as any} source="/bookmarks" />
		</div>
	)
}

type WishesGridProps = {
	wishes: { isSuccess: boolean; data: Wish[] }
	source: string
}

export function WishesGrid(props: WishesGridProps) {
	return (
		<>
			<Show when={props.wishes.isSuccess && props.wishes.data?.length === 0}>
				<div class="w-full text-center items-center flex justify-center">
					<p class="text-xl font-extrabold">
						No content is here yet..
					</p>
				</div>
			</Show>
			<Show when={props.wishes.isSuccess && props.wishes.data?.length > 0}>
				<div class="grid grid-cols-2 gap-0.5 pb-[200px] h-full w-full overflow-y-scroll">
					<div class="flex flex-col gap-0.5">
						<For each={props.wishes.data?.slice(0, Math.ceil(props.wishes.data.length / 2))}>
							{(wish) => (
								<Link href={`/wishes/${wish.id}`} class="rounded-3xl"
											state={{ from: props.source }}>
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={wish.name}
											 src={`https://assets.peatch.io/cdn-cgi/image/width=400/${wish.images[0].url}`}
									/>
								</Link>
							)}
						</For>
					</div>
					<div class="flex flex-col gap-0.5 h-full flex-grow">
						<For each={props.wishes.data?.slice(Math.ceil(props.wishes.data.length / 2))}>
							{(wish) => (
								<Link href={`/wishes/${wish.id}`} class="rounded-3xl"
											state={{ from: props.source }}>
									<img class="aspect-auto shrink-0 rounded-3xl"
											 alt={wish.name}
											 src={`https://assets.peatch.io/cdn-cgi/image/width=400/${wish.images[0].url}`}
									/>
								</Link>
							)}
						</For>
					</div>
				</div>
			</Show>
		</>
	)
}

export default BookmarksPage
