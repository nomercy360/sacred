import { Show } from 'solid-js'
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
				<div class="text-lg font-semibold">Item Details</div>
				<Show when={store.user?.id === item.data?.user_id}>
					<Link
						class="flex items-center justify-center bg-primary rounded-full size-10"
						href={`/wishlist/item/${item.data?.id}/edit`}
					>
						<span class="material-symbols-rounded text-[20px]">edit</span>
					</Link>
				</Show>
			</div>

			<div class="p-5 flex flex-col items-center justify-start space-y-4 overflow-y-scroll h-full">
				<Show when={item.data?.image_url} fallback={<div class="text-muted">No image available</div>}>
					<img
						src={item.data?.image_url!}
						alt={item.data?.name}
						class="w-full max-h-[300px] rounded-xl object-cover"
					/>
				</Show>
				<h1 class="text-2xl font-bold text-center">{item.data?.name}</h1>
				<Show when={item.data?.url}>
					<a
						href={item.data?.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline"
					>
						View item online
					</a>
				</Show>
				<Show when={item.data?.price !== null}>
					<div class="text-lg">
						Price: <span class="font-semibold">{item.data?.price}</span>{' '}
						<span>{item.data?.currency || 'USD'}</span>
					</div>
				</Show>
				<Show when={item.data?.notes}>
					<div class="text-sm text-muted">{item.data?.notes}</div>
				</Show>
				<div class="mt-4">
          <span
						class={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
							item.data?.is_public ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
						}`}
					>
            {item.data?.is_public ? 'Public' : 'Private'}
          </span>
				</div>
			</div>
			<div class="p-5 flex justify-end">
				<Show when={store.user?.id === item.data?.user_id}>
					<button
						onClick={() => {
							if (window.confirm('Are you sure you want to delete this item?')) {
								// Add delete logic here
							}
						}}
						class="bg-red-500 text-white px-4 py-2 rounded-lg"
					>
						Delete Item
					</button>
				</Show>
			</div>
		</div>
	)
}

export default ViewItem
