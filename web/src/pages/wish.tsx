import { createEffect, For, Match, onCleanup, Show, Switch } from 'solid-js'
import { useMutation, useQuery } from '@tanstack/solid-query'
import {
	copyWish,
	deleteWish,
	fetchWish,
	removeBookmark,
	fetchBookmarks,
	saveBookmark,
	Wish,
	WishResponse,
} from '~/lib/api'
import { useNavigate, useParams } from '@solidjs/router'
import { currencySymbol, getDomainName } from '~/lib/utils'
import { queryClient } from '~/App'
import { setStore, store } from '~/store'
import { useMainButton } from '~/lib/useMainButton'
import { addToast } from '~/components/toast'

const ViewItem = () => {

	const params = useParams()
	const navigate = useNavigate()
	const mainButton = useMainButton()


	const item = useQuery<WishResponse>(() => ({
		queryKey: ['item', params.id],
		queryFn: () => fetchWish(params.id),
	}))

	const bookmarks = useQuery<WishResponse[]>(() => ({
		queryKey: ['bookmarks'],
		queryFn: () => fetchBookmarks(),
	}))

	// createEffect(() => {
	// 	if (bookmarks.isSuccess) {
	// 		console.log('BOOKMARKS', JSON.parse(JSON.stringify(bookmarks.data)))
	// 	}
	// })

	const saveToBoard = useMutation(() => ({
		mutationFn: () => copyWish(item.data!.wish.id),
		retry: 0,
		onSuccess: (data) => {
			queryClient.setQueryData(['item', params.id], (old: WishResponse | undefined) => {
				if (!old) return old;
				return {
					...old,
					wish: {
						...old.wish,
						copy_id: data.id
					}
				};
			});
			setStore('wishes', (old) => {
				if (old) {
					return [data, ...old];
				}
				return old;
			});
			queryClient.invalidateQueries({ queryKey: ['user', 'wishes'] })
			queryClient.invalidateQueries({ queryKey: ['feed', store.search] });
			addToast('Added to board', false, '10px', 'white', '165px');
		},
	}));

	const removeFromBoard = useMutation(() => ({
		mutationFn: () => deleteWish(item.data!.wish.copy_id!),
		retry: 0,
		onSuccess: () => {
			queryClient.setQueryData(['item', params.id], (old: WishResponse | undefined) => {
				if (!old) return old;
				return {
					...old,
					wish: {
						...old.wish,
						copy_id: null
					}
				};
			});
			setStore('wishes', (old) => {
				if (old) {
					return old.filter((w) => w.id !== item.data!.wish.copy_id);
				}
				return old;
			});
			queryClient.invalidateQueries({ queryKey: ['user', 'wishes'] })
			queryClient.invalidateQueries({ queryKey: ['feed', store.search] });
			addToast('Removed from board', false, '10px', 'white', '200px');
		},
	}));



	const saveToBookmark = useMutation(() => ({
		mutationFn: () => saveBookmark(item.data!.wish.id),
		retry: 0,
		onSuccess: (data) => {
			queryClient.setQueryData(['item', params.id], (old: Wish | undefined) => {
				if (old) {
					return { ...old, is_bookmarked: true }
				}
				return old
			})
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
			addToast('Added to bookmarks', false, '10px', 'white', '220px');
		},
	}))

	const removeFromBookmark = useMutation(() => ({
		mutationFn: () => removeBookmark(item.data!.wish.id),
		retry: 0,
		onSuccess: (data) => {
			queryClient.setQueryData(['item', params.id], (old: Wish | undefined) => {
				if (old) {
					return { ...old, is_bookmarked: false }
				}
				return old
			})
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
			addToast('Removed from bookmarks', false, '20px', 'white', '240px');
			navigate('/bookmarks')
		},
	}))

	async function handleCopy() {
		if (item.data?.wish.copy_id) {
			await removeFromBoard.mutateAsync(undefined, {
				onSuccess: () => {
					queryClient.setQueryData(['item', params.id], (old: WishResponse | undefined) => {
						if (!old) return old;
						return {
							...old,
							wish: {
								...old.wish,
								copy_id: null
							}
						};
					});

				}
			});
		} else {
			await saveToBoard.mutateAsync(undefined, {
				onSuccess: (data) => {
					queryClient.setQueryData(['item', params.id], (old: WishResponse | undefined) => {
						if (!old) return old;
						return {
							...old,
							wish: {
								...old.wish,
								copy_id: data.id
							}
						};
					});

				}
			});
		}
	}

	function shareWishURL() {
		const url =
			'https://t.me/share/url?' +
			new URLSearchParams({
				url: 'https://t.me/tingzbot/app?startapp=w_' + item.data?.wish.id,
			}).toString() +
			`&text=${item.data?.wish.name}`

		window.Telegram.WebApp.openTelegramLink(url)
	}

	const despawnWish = async () => {
		await deleteWish(item.data!.wish.id)

		queryClient.setQueryData(['item', params.id], (old: WishResponse | undefined) => {
			if (!old) return old
			return {
				...old,
				wish: {
					...old.wish,
					copy_id: null
				}
			}
		})

		setStore('wishes', (old) => {
			if (old) {
				return old.filter((w) => w.id !== item.data!.wish.id)
			}
			return old
		})
		queryClient.invalidateQueries({ queryKey: ['user', 'wishes'] })
		if (item.data?.wish.source_id !== null) {
			queryClient.invalidateQueries({ queryKey: ['item', item.data?.wish.source_id] })
		}
		navigate('/')
		addToast('Delete');
	}

	createEffect(() => {
		if (item.isSuccess && item.data?.wish.user_id === store.user?.id) {
			mainButton.onClick(despawnWish)
			mainButton.enable('Delete from board')
			mainButton.setParams?.({
				color: '#000000',
			})
		}

	})


	createEffect(() => {
		if (item.isSuccess && item.data?.wish.user_id !== store.user?.id) {
			const isSaved = Boolean(item.data?.wish.copy_id || item.data?.wish.copy_id);

			window.Telegram.WebApp.MainButton.setText(isSaved ? 'Remove from board' : 'Save to board');

			mainButton.setParams?.({
				color: '#000000',
				textColor: isSaved ? '#ffffff' : '#ffffff',
			});

			mainButton.onClick(handleCopy);
			mainButton.enable();
		}
	});

	onCleanup(() => {
		mainButton.hide()
		mainButton.offClick(handleCopy)
		mainButton.offClick(despawnWish)
	})

	onCleanup(() => {
		mainButton.hide()
		mainButton.offClick(despawnWish)
	})

	return (
		<div class="relative w-full flex flex-col h-screen overflow-y-scroll">
			<div class="mb-2 mt-5 px-5 flex flex-row items-center justify-between">
				<Show when={item.data?.wish.user_id === store.user?.id}>
					<button
						class="flex items-center justify-center bg-secondary rounded-full size-10"
						onClick={() => navigate(`/wishes/${item.data?.wish.id}/edit`)}
					>
						<span class="material-symbols-rounded text-base">edit</span>
					</button>
				</Show>

				<Show when={item.data?.wish.user_id !== store.user?.id}>
					<button
						class="flex items-center justify-center bg-secondary rounded-full size-10"


						onClick={() => {
							if (item.data?.wish.is_bookmarked) {
								removeFromBookmark.mutate(undefined, {
									onSuccess: () => {
										queryClient.setQueryData(['item', params.id], (old: WishResponse | undefined) => {
											if (!old) return old;
											return {
												...old,
												wish: {
													...old.wish,
													is_bookmarked: false
												}
											};
										});
									}
								});
							} else {
								saveToBookmark.mutate(undefined, {
									onSuccess: () => {
										queryClient.setQueryData(['item', params.id], (old: WishResponse | undefined) => {
											if (!old) return old;
											return {
												...old,
												wish: {
													...old.wish,
													is_bookmarked: true
												}
											};
										});
									}
								});
							}
						}}
					>
						<span class="material-symbols-rounded text-[20px]"
							style={{ 'font-variation-settings': `'FILL' ${item.data?.wish.is_bookmarked ? 1 : 0}` }}
						>
							{item.data?.wish.is_bookmarked ? 'favorite' : 'favorite_border'}
						</span>
					</button>
				</Show>
				<div class="flex flex-row items-center justify-center flex-1">
					<For each={item.data?.savers.users}>
						{(saver) => (
							<img
								src={saver.avatar_url || '/placeholder.jpg'}
								alt={saver.name}
								class="size-7 shrink-0 rounded-full border-[1.5px] border-background shadow-sm first-of-type:z-10 last-of-type:z-20 -ml-2"
							/>
						)}
					</For>
					<Show when={item.data?.savers.total && item.data?.savers.total > item.data?.savers.users.length}>
						<span
							class="size-7 shrink-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full border-[1.5px] text-xs border-background shadow-sm -ml-2 z-20">
							+{item.data?.savers.total! - item.data?.savers.users.length!}
						</span>
					</Show>
				</div>
				<button
					class="shrink-0 flex items-center justify-center bg-secondary rounded-full size-10"
					onClick={shareWishURL}
				>
					<span class="material-symbols-rounded text-base">arrow_outward</span>
				</button>
			</div>

			<div class="flex flex-col items-center text-center px-8">
				<h1 class="leading-tight text-xl font-bold text-center">{item.data?.wish.name}</h1>
				<Switch>
					<Match when={item.data?.wish.price && item.data?.wish.url}>
						<a href={item.data?.wish.url!} class="text-sm text-muted-foreground" target="_blank" rel="noreferrer">
							{item.data?.wish.price}{currencySymbol(item.data?.wish.currency!)} at {getDomainName(item.data?.wish.url!)}
						</a>
					</Match>
					<Match when={item.data?.wish.price}>
						<p class="text-sm text-primary">{item.data?.wish.price}{currencySymbol(item.data?.wish.currency!)}</p>
					</Match>
					<Match when={item.data?.wish.url}>
						<a href={item.data?.wish.url!} class="text-sm text-primary underline" target="_blank" rel="noreferrer">
							at {getDomainName(item.data?.wish.url!)}
						</a>
					</Match>
				</Switch>
			</div>

			<div class="mt-7 flex flex-col items-center justify-start space-y-0.5 px-[1.5px]">
				<Show when={item.data?.wish.images} fallback={<ImageLoader />}>
					<For each={item.data?.wish.images}>
						{(image) => (
							<img
								src={`https://assets.peatch.io/${image.url}`}
								alt={item.data?.wish.name}
								class="w-full rounded-[25px] border border-[#00000010]"
								style={{ 'aspect-ratio': `${image.width}/${image.height}` }}
							/>

						)}
					</For>
				</Show>
			</div>
		</div>
	)
}


function ImageLoader() {
	return (
		<>
			<div
				class="rounded-[25px] border-[0.5px] border-border/60 animate-pulse bg-background max-h-[500px] w-full h-full aspect-[3/4]" />
			<div
				class="rounded-[25px] border-[0.5px] border-border/60 animate-pulse bg-background max-h-[500px] w-full h-full aspect-[3/4]" />
		</>
	)
}

export default ViewItem
