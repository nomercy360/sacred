import { createEffect, For, Match, onCleanup, Show, Switch } from 'solid-js'
import { createMutation, createQuery } from '@tanstack/solid-query'
import { copyWish, deleteWish, fetchWish, removeBookmark, fetchBookmarks, saveBookmark, Wish } from '~/lib/api'
import { useNavigate, useParams } from '@solidjs/router'
import { cn, currencySymbol, getDomainName } from '~/lib/utils'
import { queryClient } from '~/App'
import { setStore, setWishes, store } from '~/store'
import { useMainButton } from '~/lib/useMainButton'

const ViewItem = () => {
	const params = useParams()

	const item = createQuery<Wish>(() => ({
		queryKey: ['item', params.id],
		queryFn: () => fetchWish(params.id),
	}))

	const navigate = useNavigate()

	const mainButton = useMainButton()


	const bookmarks = createQuery<Wish[]>(() => ({
		queryKey: ['bookmarks'],
		queryFn: () => fetchBookmarks(),
	}))

	createEffect(() => {
		if (bookmarks.isSuccess) {
			console.log('BOOKMARKS', JSON.parse(JSON.stringify(bookmarks.data)))
		}
	})

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
			setStore('wishes', (old) => {
				if (old) {
					return [data, ...old]
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
				setStore('wishes', (old) => {
					if (old) {
						return old.filter((w) => w.id !== item.data!.copied_wish_id)
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
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
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
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	}))

	async function handleCopy() {
		if (item.data?.copied_wish_id) {
			removeFromBoard.mutate()
		} else {
			saveToBoard.mutate()
		}
	}

	function shareWishURL() {
		const url =
			'https://t.me/share/url?' +
			new URLSearchParams({
				url: 'https://t.me/tingzbot/app?startapp=w_' + item.data?.id,
			}).toString() +
			`&text=${item.data?.name}`

		window.Telegram.WebApp.openTelegramLink(url)
	}

	const despawnWish = async () => {
		await deleteWish(item.data!.id)
		setStore('wishes', (old) => {
			if (old) {
				return old.filter((w) => w.id !== item.data!.id)
			}
			return old
		})
		if (item.data?.source_id !== null) {
			queryClient.invalidateQueries({ queryKey: ['item', item.data?.source_id] })
		}
		navigate('/')
	}

	createEffect(() => {
		if (item.isSuccess && item.data?.user_id === store.user?.id) {
			mainButton.onClick(despawnWish)
			mainButton.enable('Delete from board')
			mainButton.setParams?.({
				color: '#F87171'
			})
		}
	})

	onCleanup(() => {
		mainButton.hide()
		mainButton.offClick(despawnWish)
	})

	return (
		<div class="relative w-full flex flex-col h-screen overflow-y-scroll">
			<div class="mb-2 mt-5 px-5 flex flex-row items-center justify-between">
				<Show when={item.data?.user_id === store.user?.id}>
					<button
						class="flex items-center justify-center bg-secondary rounded-full size-10"
						onClick={() => navigate(`/wishes/${item.data?.id}/edit`)}
					>
						<span class="material-symbols-rounded text-base">edit</span>
					</button>
				</Show>
				<Show when={item.data?.user_id !== store.user?.id}>
					<button
						class="shrink-0 flex items-center justify-center bg-secondary rounded-full size-10"
					>
						<span class="material-symbols-rounded text-base">report</span>
					</button>
				</Show>
				<button
					class="shrink-0 flex items-center justify-center bg-secondary rounded-full size-10"
					onClick={shareWishURL}
				>
					<span class="material-symbols-rounded text-base">arrow_outward</span>
				</button>
			</div>
			<div class="flex flex-col items-center text-center px-8">
				<h1 class="leading-tight text-xl font-bold text-center">{item.data?.name}</h1>
				<Switch>
					<Match when={item.data?.price && item.data?.url}>
						<a href={item.data?.url!} class="text-sm text-muted-foreground" target="_blank" rel="noreferrer">
							{item.data?.price}{currencySymbol(item.data?.currency!)} at {getDomainName(item.data?.url!)}
						</a>
					</Match>
					<Match when={item.data?.price}>
						<p class="text-sm text-primary">{item.data?.price}{currencySymbol(item.data?.currency!)}</p>
					</Match>
					<Match when={item.data?.url}>
						<a href={item.data?.url!} class="text-sm text-primary underline" target="_blank" rel="noreferrer">
							at {getDomainName(item.data?.url!)}
						</a>
					</Match>
				</Switch>
			</div>

			<div class="mt-7 flex flex-col items-center justify-start space-y-0.5">
				<Show when={item.data?.images} fallback={<ImageLoader />}>
					<For each={item.data?.images}>
						{(image) => (
							<img
								src={`https://assets.peatch.io/${image.url}`}
								alt={item.data?.name}
								class="w-full rounded-[25px]"
								style={{ 'aspect-ratio': `${image.width}/${image.height}` }}
							/>
						)}
					</For>
				</Show>
			</div>
			<Show when={item.isSuccess && item.data?.user_id !== store.user?.id}>
				<div
					class="pt-2 px-4 flex flex-col items-start justify-start h-[95px] fixed bottom-0 w-full bg-background z-50"
				>
					<div class="grid grid-cols-2 w-full gap-2">
						<button
							class={cn(
								'text-sm font-medium rounded-xl h-12 px-4 w-full flex flex-row items-center justify-between',
								{
									'bg-red-500 text-white': item.data?.copied_wish_id,
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
							{item.data?.is_bookmarked ? 'Remove liked' : 'Add liked'}
							<span class="material-symbols-rounded text-[20px]">
								{item.data?.is_bookmarked ? 'favorite' : 'favorite_border'}
							</span>
						</button>
					</div>
				</div>
			</Show>
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
