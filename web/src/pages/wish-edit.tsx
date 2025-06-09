import { useNavigate, useParams } from '@solidjs/router'
import { useMutation, useQuery } from '@tanstack/solid-query'
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js'
import { fetchUpdateWish, fetchWish, Wish, WishImage, WishResponse } from '~/lib/api'
import { useMainButton } from '~/lib/useMainButton'
import { cn } from '~/lib/utils'
import { addToast } from '~/components/toast'
import { setStore } from '~/store'
import { queryClient } from '~/App'

const ImageLoader = () => (
    <div class="flex h-40 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
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
                category_ids:
                    item.data?.wish.categories?.map(category => category.id) ||
                    [],
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
        onError: error => {
            console.error('Ошибка при сохранении:', error)
            addToast('Failed to update wish', true, '10px', '#f26868', '200px')
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
                category_ids:
                    item.data?.wish.categories?.map(category => category.id) ||
                    [],
                delete_image_ids: [imageId],
            }

            const result = await fetchUpdateWish(params.id, requestData)
            if (result.error) {
                addToast(
                    'Failed to delete image',
                    false,
                    '10px',
                    '#f26868',
                    '250px',
                )
            } else {
                addToast('Deleted success', false, '10px', '#b0f268', '200px')

                await queryClient.invalidateQueries({
                    queryKey: ['item', params.id],
                })
                await queryClient.invalidateQueries({ queryKey: ['wishes'] })
                await queryClient.invalidateQueries({ queryKey: ['feed'] })

                setStore('wishes', (old: Wish[]) => {
                    return old.map((wish: Wish) => {
                        if (wish.id === params.id) {
                            return {
                                ...wish,
                                images: wish.images.filter(
                                    (img: WishImage) => img.id !== imageId,
                                ),
                            }
                        }
                        return wish
                    })
                })
            }
        } catch (error) {
            console.error('Error deleting image:', error)
            addToast(
                'Failed to delete image',
                false,
                '10px',
                '#f26868',
                '250px',
            )
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
        <div class="flex min-h-screen flex-col items-center p-4">
            <Show
                when={item.isSuccess}
                fallback={
                    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <div class="flex items-center gap-3 rounded-xl bg-black px-4 py-3 text-white shadow-md">
                            <div class="h-4 w-4 animate-spin rounded-full" />
                            <span class="text-sm">Uploading...</span>
                        </div>
                    </div>
                }
            >
                <div class="h-screen w-full space-y-4 overflow-y-auto pb-6">
                    <div class="flex w-full flex-col space-y-1.5">
                        <label class="mb-1 text-xs font-medium text-secondary-foreground">
                            Visible wish name
                        </label>
                        <input
                            value={wishName()}
                            onInput={e => setWishName(e.currentTarget.value)}
                            class="h-12 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold focus:outline-none"
                        />
                    </div>

                    <div class="flex w-full flex-col space-y-1.5">
                        <label class="text-xs font-medium text-secondary-foreground">
                            Wish link
                        </label>
                        <div class="flex h-12 items-center rounded-xl bg-secondary px-3 py-2 text-sm font-semibold">
                            <span class="text-muted-foreground" />
                            <input
                                value={wishLink()}
                                onInput={e =>
                                    setWishLink(e.currentTarget.value)
                                }
                                class="flex-1 bg-transparent text-foreground focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* <div class="flex flex-col space-y-1.5">
            <label class="text-xs font-medium text-secondary-foreground mb-1">Upload wish photo</label>
            <button class="text-sm font-semibold h-12 px-3 py-2 bg-primary text-white rounded-xl">add photo</button>
          </div> */}

                    <Show
                        when={item.data?.wish.images}
                        fallback={<ImageLoader />}
                    >
                        <div
                            class={cn(
                                item.data?.wish.images?.length &&
                                    item.data?.wish.images.length > 1
                                    ? 'grid grid-cols-2 gap-4'
                                    : 'grid grid-cols-1',
                            )}
                        >
                            <For each={item.data?.wish.images}>
                                {(image: WishImage) => (
                                    <div class="relative w-full rounded-[25px] border border-[#00000010]">
                                        <img
                                            src={`https://assets.peatch.io/${image.url}`}
                                            alt={item.data?.wish.name}
                                            class={cn(
                                                'w-full rounded-[25px]',
                                                item.data?.wish.images
                                                    .length === 1
                                                    ? 'max-w-full'
                                                    : 'w-[200px]',
                                            )}
                                            style={{
                                                'aspect-ratio': `${image.width}/${image.height}`,
                                            }}
                                        />
                                        <button
                                            onClick={() =>
                                                deleteImage(image.id)
                                            }
                                            disabled={
                                                isDeleting() || isSaving()
                                            }
                                            class="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-black"
                                            title="Delete image"
                                        >
                                            <span class="material-symbols-rounded text-[16px] text-white">
                                                close
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    )
}
