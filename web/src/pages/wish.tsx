import { createEffect, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js'
import { createMutation, createQuery } from '@tanstack/solid-query'
import { copyWish, deleteWish, fetchWish, removeBookmark, fetchBookmarks, saveBookmark, Wish } from '~/lib/api'
import { useNavigate, useParams } from '@solidjs/router'
import { cn, currencySymbol, getDomainName } from '~/lib/utils'
import { queryClient } from '~/App'
import { setStore, setWishes, store } from '~/store'
import { useMainButton } from '~/lib/useMainButton'
import { addToast } from '~/components/toast'

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
			addToast('Removed from board')
		} else {
			saveToBoard.mutate()
			addToast('Added to board')
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
				color: '#000000'
			})
		}
	})


	createEffect(() => {
		if (item.isSuccess && item.data?.user_id !== store.user?.id) {
			const isSaved = Boolean(item.data?.copied_wish_id)

			window.Telegram.WebApp.MainButton.setText(isSaved ? 'Remove from board' : 'Save to board')
			mainButton.onClick(handleCopy)
			mainButton.enable()
			mainButton.setParams?.({
				color: '#000000',
				textColor: '#ffffff',
			})
		}
	})

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
						class='flex items-center justify-center bg-secondary rounded-full size-10'


						onClick={() => {
							if (item.data?.is_bookmarked) {
								removeFromBookmark.mutate()
								addToast('Removed from bookmarks')
							} else {
								saveToBookmark.mutate()
								addToast('Added to bookmarks')
							}
						}}
					>
						<span class="material-symbols-rounded text-[20px]"
							style={{ 'font-variation-settings': `'FILL' ${item.data?.is_bookmarked ? 1 : 0}` }}
						>
							{item.data?.is_bookmarked ? 'favorite' : 'favorite_border'}
						</span>
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

			<div class="mt-7 flex flex-col items-center justify-start space-y-0.5 ">
				<Show when={item.data?.images} fallback={<ImageLoader />}>
					<For each={item.data?.images}>
						{(image) => (
							<img
								src={`https://assets.peatch.io/${image.url}`}
								alt={item.data?.name}
								class="w-full rounded-[25px] border shadow-sm rounded-[25px]"
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
