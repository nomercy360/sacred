import { useQuery } from '@tanstack/solid-query'
import { fetchBookmarks, Wish } from '~/lib/api'
import { For, Show } from 'solid-js'
import { Link } from '~/components/link'
import { ImageWithPlaceholder } from '~/components/image-placeholder'
import { getFirstImage } from '~/lib/utils'

const BookmarksPage = () => {
	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['bookmarks'],
		queryFn: () => fetchBookmarks(),
	}))

	return (
		<div
			class="relative flex flex-col items-center w-full h-screen overflow-hidden"
		>
			<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
				<div
					class="h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5">
					<button class="flex items-center justify-center bg-secondary rounded-full size-10">
					<span class="material-symbols-rounded text-[20px]">
						search
					</span>
					</button>
					<p class="text-black text-xl font-extrabold">
						Liked
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
			</div>
			<WishesGrid wishes={wishes as any} source="/bookmarks" />
		</div>
	)
}

type WishesGridProps = {
	wishes: { isSuccess: boolean; data: Wish[] | undefined };
	source: string;
};

export function WishesGrid(props: WishesGridProps) {
	return (
		<>
			<Show when={props.wishes.isSuccess && (!props.wishes.data || props.wishes.data.length === 0)}>
				<div class="w-full text-center items-center flex justify-center pt-20">
					<p class="text-xl font-extrabold">
						No content is here yet..
					</p>
				</div>
			</Show>

			<Show when={props.wishes.isSuccess && props.wishes.data && props.wishes.data.length > 0}>
				<div
					class={`grid grid-cols-2 gap-0.5 pb-[200px] h-full w-full overflow-y-scroll ${
						props.source === '/bookmarks' || props.source === '/feed' ? 'pt-20' : ''
					}`}
				>
					<div class="flex flex-col gap-0.5">
						<For each={props.wishes.data?.slice(0, Math.ceil((props.wishes.data?.length || 0) / 2))}>
							{(wish) => {
								const image = getFirstImage(wish)
								return (
									<Link
										href={`/wishes/${wish.id}`}
										class="block border shadow-sm rounded-[25px] overflow-hidden"
										state={{ from: props.source }}
									>
										<ImageWithPlaceholder
											src={`https://assets.peatch.io/cdn-cgi/image/width=400/${image.url}`}
											alt={wish.name}
											width={image.width}
											height={image.height}
										/>
									</Link>
								)
							}}
						</For>
					</div>

					<div class="flex flex-col gap-0.5 h-full">
						<For each={props.wishes.data?.slice(Math.ceil((props.wishes.data?.length || 0) / 2))}>
							{(wish) => {
								const image = getFirstImage(wish)
								return (
									<Link
										href={`/wishes/${wish.id}`}
										class="block border shadow-sm rounded-[25px] overflow-hidden"
										state={{ from: props.source }}
									>
										<ImageWithPlaceholder
											src={`https://assets.peatch.io/cdn-cgi/image/width=400/${image.url}`}
											alt={wish.name}
											width={image.width}
											height={image.height}
										/>
									</Link>
								)
							}}
						</For>
					</div>
				</div>
			</Show>
		</>
	)
}

export default BookmarksPage // Assuming BookmarksPage is the default export of its file
