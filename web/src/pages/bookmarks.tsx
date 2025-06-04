import { createMutation, useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { copyWish, deleteWish, fetchBookmarks, Wish, WishResponse } from '~/lib/api'
import { createEffect, For, Show } from 'solid-js'
import { Link } from '~/components/link'
import { ImageWithPlaceholder } from '~/components/image-placeholder'
import { cn, getFirstImage } from '~/lib/utils'
import { setStore, store } from '~/store'
import { addToast } from '~/components/toast'

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
	wishes: {
	  isSuccess: boolean;
	  data: (Wish & { copy_id: string | null })[] | undefined;
	  isFetching?: boolean;
	  refetch?: () => void;
	};
	source: string;
  };

export function WishesGrid(props: WishesGridProps) {

	const queryClient = useQueryClient()

	createEffect(() => {
		console.log(props.wishes.data)
	})

	const addToBoard = createMutation(() => ({
		mutationFn: (wishId: string) => copyWish(wishId),
		onSuccess: (data, wishId) => {
			queryClient.setQueryData(['feed', store.search], (old: Wish[] | undefined) => {
				if (!old) return old
				return old.map(w =>
					w.id === wishId ? { ...w, copied_wish_id: data.id } : w
				)
			})
			queryClient.setQueryData(['item', wishId], (old: WishResponse | undefined) => {
				if (!old) return old
				return {
					...old,
					wish: {
						...old.wish,
						copied_wish_id: data.id
					}
				}
			})
			queryClient.invalidateQueries({ queryKey: ['user', 'wishes'] })
			addToast('Added to board')
			setStore('wishes', (old: Wish[]) => {
				if (!old) return old
				return [data, ...old]
			})
		},

		onError: () => {
			addToast('Failed to add to board')
		}
	}))


	const removeFromBoard = createMutation(() => ({
		mutationFn: (wishId: string) => {
			const wish = queryClient.getQueryData<Wish[]>(['feed', store.search])
				?.find((w: Wish) => w.id === wishId)
			if (!wish?.copy_id) throw new Error('No copied wish id')
			return deleteWish(wish.copy_id)
		},
		onSuccess: (_, wishId) => {
			queryClient.setQueryData(['feed', store.search], (old: Wish[] | undefined) => {
				if (!old) return old;
				return old.map(w =>
					w.id === wishId ? { ...w, copy_id: null } : w
				);
			});
			setStore('wishes', (oldWishes) => {
				if (!oldWishes) return oldWishes;
				return oldWishes.filter(w => w.id !== wishId);
			});
			queryClient.invalidateQueries({ queryKey: ['user', 'wishes'] })
			queryClient.invalidateQueries({ queryKey: ['item', wishId] })

			addToast('Removed from board')
		},
		onError: () => {
			addToast('Failed to remove from board')
		}
	}))



	const handleAddRemove = async (wish: Wish) => {
		try {
			if (wish.copied_wish_id) {
				await removeFromBoard.mutateAsync(wish.id)
			} else {
				await addToBoard.mutateAsync(wish.id)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}


	createEffect(() => {
		if (props.wishes.isSuccess && props.wishes.data) {
		  // Обогащаем данные закладок информацией из store
		  const updatedWishes = props.wishes.data.map(wish => ({
			...wish,
			copy_id: store.wishes?.find(w => w.source_id === wish.id)?.id || null
		  }));
		  queryClient.setQueryData(['bookmarks'], updatedWishes);
		}
	  });

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
					class={`grid grid-cols-2 gap-0.5 pb-[200px] h-full w-full overflow-y-scroll ${props.source === '/bookmarks' || props.source === '/feed' ? 'pt-20' : ''
						}`}
				>
					<div class="flex flex-col gap-0.5">
						<For each={props.wishes.data?.slice(0, Math.ceil((props.wishes.data?.length || 0) / 2))}>
							{(wish) => {
								const image = getFirstImage(wish)
								return (
									<div class="relative">
										<Show when={props.source === '/feed'}>
											<button class={cn("absolute top-3 right-3 bg-white rounded-full size-5 flex items-center justify-center shadow z-10", wish.copy_id ? "bg-primary" : "bg-white")}
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													handleAddRemove(wish)
												}}
												type="button">
												<span class={cn("material-symbols-rounded text-sm", wish.copy_id ? "text-white" : "text-primary")}>{wish.copy_id ? "check" : "add"}</span>
											</button>
										</Show>
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
									</div>

								)
							}}
						</For>
					</div>

					<div class="flex flex-col gap-0.5 h-full">
						<For each={props.wishes.data?.slice(Math.ceil((props.wishes.data?.length || 0) / 2))}>
							{(wish) => {
								const image = getFirstImage(wish)
								return (
									<div class="relative">
										<Show when={props.source === '/feed'}>
											<button class={cn("absolute top-3 right-3 bg-white rounded-full size-5 flex items-center justify-center shadow z-10", wish.copied_wish_id ? "bg-primary" : "bg-white")}
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													handleAddRemove(wish)
												}}
												type="button">
												<span class={cn("material-symbols-rounded text-sm", wish.copied_wish_id ? "text-white" : "text-primary")}>{wish.copied_wish_id ? "check" : "add"}</span>
											</button>
										</Show>
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
									</div>
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
