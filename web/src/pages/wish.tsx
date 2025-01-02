import { For, Show } from 'solid-js'
import { createMutation, createQuery } from '@tanstack/solid-query'
import { copyWish, deleteWish, fetchWish, removeBookmark, saveBookmark, Wish } from '~/lib/api'
import { useParams } from '@solidjs/router'
import { cn } from '~/lib/utils'
import { queryClient } from '~/App'

const ViewItem = () => {
	const params = useParams()

	const item = createQuery<Wish>(() => ({
		queryKey: ['item', params.id],
		queryFn: () => fetchWish(params.id),
	}))

	const saveToBoard = createMutation(() => ({
		mutationFn: () => copyWish(item.data!.id),
		retry: 0,
		onSuccess: (data) => {
			queryClient.setQueryData(['item', params.id], (old: Wish | undefined) => {
				if (old) {
					return { ...old, copied_wish_id: data.id }
				}
				return old
			})
		},
	}))

	const removeFromBoard = createMutation(() => {
		return ({
			mutationFn: () => deleteWish(item.data!.copied_wish_id!),
			retry: 0,
			onSuccess: () => {
				queryClient.setQueryData(['item', params.id], (old: Wish | undefined) => {
					if (old) {
						return { ...old, copied_wish_id: null }
					}
					return old
				})
			},
		})
	})

	const saveToBookmark = createMutation(() => ({
		mutationFn: () => saveBookmark(item.data!.id),
		retry: 0,
		onSuccess: (data) => {
			queryClient.setQueryData(['item', params.id], (old: Wish | undefined) => {
				if (old) {
					return { ...old, is_bookmarked: true }
				}
				return old
			})
		},
	}))

	const removeFromBookmark = createMutation(() => ({
		mutationFn: () => removeBookmark(item.data!.id),
		retry: 0,
		onSuccess: (data) => {
			queryClient.setQueryData(['item', params.id], (old: Wish | undefined) => {
				if (old) {
					return { ...old, is_bookmarked: false }
				}
				return old
			})
		},
	}))

	async function handleCopy() {
		if (item.data?.copied_wish_id) {
			removeFromBoard.mutate()
		} else {
			saveToBoard.mutate()
		}
	}

	return (
		<div class="relative w-full flex flex-col h-screen overflow-hidden">
			<div class="p-5 flex flex-row items-center justify-between">
				<button
					class="flex items-center justify-center bg-secondary rounded-full size-10"
				>
					<span class="material-symbols-rounded text-[20px]">report</span>
				</button>
				<h1 class="text-xl font-bold text-center">{item.data?.name}</h1>
				<button
					class="flex items-center justify-center bg-secondary rounded-full size-10"
				>
					<span class="material-symbols-rounded text-[20px]">arrow_outward</span>
				</button>
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
			<div
				class="pt-2 px-4 flex flex-col items-start justify-start border-t shadow-sm h-[95px] fixed bottom-0 w-full bg-background z-50"
			>
				<div class="grid grid-cols-2 w-full gap-2">
					<button
						class={cn(
							'text-sm font-medium rounded-xl h-12 px-4 w-full flex flex-row items-center justify-between',
							{
								'bg-secondary text-secondary-foreground': item.data?.copied_wish_id,
								'bg-primary text-primary-foreground': !item.data?.copied_wish_id,
							},
						)}
						onClick={handleCopy}
					>
						{item.data?.copied_wish_id ? 'Remove from board' : 'Save to board'}
						<span class="material-symbols-rounded text-[20px]">
							{item.data?.copied_wish_id ? 'remove' : 'add'}
						</span>
					</button>
					<button
						class={cn(
							'text-sm font-medium rounded-xl h-12 px-4 w-full flex flex-row items-center justify-between',
							{
								'bg-secondary text-secondary-foreground': item.data?.is_bookmarked,
								'bg-primary text-primary-foreground': !item.data?.is_bookmarked,
							},
						)}
						onClick={() => {
							if (item.data?.is_bookmarked) {
								removeFromBookmark.mutate()
							} else {
								saveToBookmark.mutate()
							}
						}}
					>
						{item.data?.is_bookmarked ? 'Remove bookmark' : 'Save bookmark'}
						<span class="material-symbols-rounded text-[20px]">
							{item.data?.is_bookmarked ? 'bookmark' : 'bookmark_border'}
						</span>
					</button>
				</div>
			</div>
		</div>
	)
}

export default ViewItem
