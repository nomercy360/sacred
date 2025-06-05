import { useNavigate, useParams } from '@solidjs/router'
import { useMutation, useQuery } from '@tanstack/solid-query'
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js'
import { fetchUpdateWish, fetchWish, WishResponse } from '~/lib/api'
import { Wish, WishImage } from '~/lib/api'
import { useMainButton } from '~/lib/useMainButton'
import { queryClient } from '~/App'
import { addToast } from '~/components/toast'
import { setStore } from '~/store'


const ImageLoader = () => (
	<div class="flex items-center justify-center h-40">
		<div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
	</div>
)

export default function WishEditPage() {
	const [wishName, setWishName] = createSignal('')
	const [wishLink, setWishLink] = createSignal('')
	const [isDeleting, setIsDeleting] = createSignal(false)
	const [isSaving, setIsSaving] = createSignal(false)

	const params = useParams()
	const navigate = useNavigate()
	const mainButton = useMainButton()

	const item = useQuery<WishResponse>(() => ({
		queryKey: ['item', params.id],
		queryFn: () => fetchWish(params.id),
	}))

	const updateWishMutation = useMutation(() => ({
		mutationFn: async () => {
			setIsSaving(true)
			const requestData = {
				name: wishName(),
				url: wishLink(),
				notes: null,
				price: null,
				currency: null,
				category_ids: item.data?.wish.categories?.map(category => category.id) || [],
			}

			return fetchUpdateWish(params.id, requestData)
				.then(result => {
					console.log('Полный ответ сервера:', result)
					if (result.error) throw new Error(result.error)
					return result.data
				})
				.finally(() => {
					setIsSaving(false)
				})
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['item', params.id] })
			queryClient.invalidateQueries({ queryKey: ['wishes'] })
			queryClient.invalidateQueries({ queryKey: ['feed'] })

			setStore('wishes', (old: Wish[]) => {
				return old.map((wish: Wish) => {
					if (wish.id === params.id) {
						return {
							...wish,
							name: wishName(),
							url: wishLink(),
						}
					}
					return wish
				})
			})

			addToast('Saved')
			navigate('/')
		},
		onError: (error) => {
			console.error('Ошибка при сохранении:', error)
			addToast('Failed to update wish', false, '10px', '#f26868')
		},
	}))


	createEffect(() => {
		if (item.data) {
			setWishName(item.data.wish.name || '')
			setWishLink(item.data.wish.url || '')
		}
	})


	const saveWish = async () => {
		mainButton.showProgress(true)
		try {
			const result = await updateWishMutation.mutateAsync()

		} catch (error) {

		} finally {
			mainButton.hideProgress()
		}
	}

	const deleteImage = async (imageId: string) => {
		if (isDeleting()) return

		setIsDeleting(true)
		try {
			// Update wish with delete_image_ids
			const requestData = {
				name: wishName() || item.data?.wish.name || null,
				url: wishLink() || item.data?.wish.url || null,
				notes: item.data?.wish.notes || null,
				price: item.data?.wish.price || null,
				currency: item.data?.wish.currency || null,
				category_ids: item.data?.wish.categories?.map(category => category.id) || [],
				delete_image_ids: [imageId],
			}

			const result = await fetchUpdateWish(params.id, requestData)
			if (result.error) {
				addToast('Failed to delete image')
			} else {
				addToast('Deleted success')

				await queryClient.invalidateQueries({ queryKey: ['item', params.id] })
				await queryClient.invalidateQueries({ queryKey: ['wishes'] })
				await queryClient.invalidateQueries({ queryKey: ['feed'] })

				setStore('wishes', (old: Wish[]) => {
					return old.map((wish: Wish) => {
						if (wish.id === params.id) {
							return {
								...wish,
								images: wish.images.filter((img: WishImage) => img.id !== imageId),
							}
						}
						return wish
					})
				})
			}
		} catch (error) {
			console.error('Error deleting image:', error)
			addToast('Failed to delete image')
		} finally {
			setIsDeleting(false)
		}
	}

	createEffect(() => {
		mainButton.offClick(saveWish)

		if (item.isSuccess) {
			mainButton.onClick(saveWish)
			if (isSaving()) {
				mainButton.disable('Saving...')
			} else {
				mainButton.enable('Save')
			}
		} else {
			mainButton.disable('Save')
		}
	})

	onCleanup(() => {
		mainButton.hide()
		mainButton.offClick(saveWish)
	})

	return (
		<div class="flex flex-col items-center p-4 min-h-screen">
			<Show when={item.isSuccess} fallback={
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
					<div class="bg-black text-white rounded-xl shadow-md px-4 py-3 flex items-center gap-3">
						<div class="h-4 w-4 rounded-full animate-spin"></div>
						<span class="text-sm">
              Uploading...
            </span>
					</div>
				</div>
			}>
				<div class="w-full space-y-4 overflow-y-auto h-screen pb-6">
					<div class="flex flex-col w-full space-y-1.5">
						<label class="text-xs font-medium text-secondary-foreground mb-1">Visible wish name</label>
						<input
							value={wishName()}
							onInput={(e) => setWishName(e.currentTarget.value)}
							class="focus:outline-none text-sm font-semibold h-12 px-3 py-2 bg-secondary rounded-xl"
						/>
					</div>

					<div class="flex flex-col w-full space-y-1.5">
						<label class="font-medium text-xs text-secondary-foreground">Wish link</label>
						<div class="font-semibold text-sm bg-secondary flex items-center rounded-xl h-12 px-3 py-2">
							<span class="text-muted-foreground"></span>
							<input
								value={wishLink()}
								onInput={(e) => setWishLink(e.currentTarget.value)}
								class="text-foreground bg-transparent focus:outline-none flex-1"
							/>
						</div>
					</div>

					{/* <div class="flex flex-col space-y-1.5">
            <label class="text-xs font-medium text-secondary-foreground mb-1">Upload wish photo</label>
            <button class="text-sm font-semibold h-12 px-3 py-2 bg-primary text-white rounded-xl">add photo</button>
          </div> */}

					<Show when={item.data?.wish.images} fallback={<ImageLoader />}>
						<For each={item.data?.wish.images}>
							{(image: WishImage) => (
								<div class="relative">
									<img
										src={`https://assets.peatch.io/${image.url}`}
										alt={item.data?.wish.name}
										class="w-full rounded-[25px] "
										style={{ 'aspect-ratio': `${image.width}/${image.height}` }}
									/>
									<button
										onClick={() => deleteImage(image.id)}
										disabled={isDeleting() || isSaving()}
										class="absolute top-3 right-3 bg-black rounded-full size-6 flex items-center justify-center"
										title="Delete image"
									>
										<span class="material-symbols-rounded text-white text-[16px]">close</span>
									</button>
								</div>
							)}
						</For>
					</Show>
				</div>
			</Show>
		</div>
	)
}
