import { For, Show } from 'solid-js'
import { Link } from '~/components/link'
import { store } from '~/store'
import { createQuery } from '@tanstack/solid-query'
import { fetchWish, Wish } from '~/lib/api'
import { useParams } from '@solidjs/router'

const ViewItem = () => {
	const params = useParams()

	const item = createQuery<Wish>(() => ({
		queryKey: ['item', params.id],
		queryFn: () => fetchWish(params.id),
	}))

	return (
		<div class="relative w-full flex flex-col h-screen overflow-hidden">
			<div class="p-5 flex flex-row items-center justify-between">
				<Link
					class="flex items-center justify-center bg-secondary rounded-full size-10"
					href={'/'}
				>
					<span class="material-symbols-rounded text-[20px]">arrow_back</span>
				</Link>
				<h1 class="text-2xl font-bold text-center">{item.data?.name}</h1>
				<Show when={store.user?.id === item.data?.user_id}>
					<Link
						class="flex items-center justify-center bg-primary rounded-full size-10"
						href={`/wishlist/item/${item.data?.id}/edit`}
					>
						<span class="material-symbols-rounded text-[20px]">edit</span>
					</Link>
				</Show>
			</div>

			<div class="flex flex-col items-center justify-start space-y-4 overflow-y-scroll h-full">
				<Show when={item.data?.images} fallback={<div class="text-muted">No image available</div>}>
					<For each={item.data?.images}>
						{(image) => (
							<img
								src={image.url}
								alt={item.data?.name}
								class="w-full rounded-[25px] border-[0.5px] border-border/60"
								style={{ 'aspect-ratio': `${image.width}/${image.height}` }}
							/>
						)}
					</For>
				</Show>
			</div>
		</div>
	)
}

export default ViewItem
