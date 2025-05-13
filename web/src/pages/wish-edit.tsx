import { useNavigate, useParams } from "@solidjs/router"
import { createMutation, useQuery } from "@tanstack/solid-query"
import { createEffect, createSignal, For, onCleanup, Show } from "solid-js"
import { fetchUpdateWish, fetchWish, deleteWishPhoto } from "~/lib/api"
import { Wish, WishImage } from "~/lib/api"
import { useMainButton } from "~/lib/useMainButton"
import { queryClient } from "~/App"
import { addToast } from "~/components/toast"
import { setStore } from "~/store"

// Simple loader component
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

  const item = useQuery<Wish>(() => ({
    queryKey: ['item', params.id],
    queryFn: () => fetchWish(params.id),
  }))

  console.log("PARAMS ID", params.id)

  const updateWishMutation = createMutation(() => ({
    mutationFn: async () => {
      setIsSaving(true)
      const requestData = {
        name: wishName(),
        url: wishLink(),
        notes: null,
        price: null,
        currency: null,
        category_ids: item.data?.categories?.map(cat => cat.id) || []
      }

      return fetchUpdateWish(params.id, requestData)
        .then(result => {
          console.log("Полный ответ сервера:", result)
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
              url: wishLink()
            };
          }
          return wish;
        });
      });
      
      addToast("Wish updated successfully")
      navigate('/')
    },
    onError: (error) => {
      console.error("Ошибка при сохранении:", error)
      addToast("Failed to update wish")
    }
  }))


  createEffect(() => {
    if (item.data) {
      setWishName(item.data.name || '')
      setWishLink(item.data.url || '')
    }
  })


  const saveWish = async () => {
    mainButton.showProgress(true)
    try {
      const result = await updateWishMutation.mutateAsync()
      // Успешное сохранение обрабатывается в onSuccess мутации
    } catch (error) {
      // Ошибка уже обрабатывается в onError мутации
    } finally {
      mainButton.hideProgress()
    }
  }

  const deleteImage = async (imageId: string) => {
    if (isDeleting()) return;
    
    setIsDeleting(true)
    try {
      const result = await deleteWishPhoto(params.id, imageId);
      if (result.error) {
        addToast("Failed to delete image");
      } else {
        addToast("Image deleted successfully");
        
        // Обновляем все квери, связанные с вишами
        await queryClient.invalidateQueries({ queryKey: ['item', params.id] });
        await queryClient.invalidateQueries({ queryKey: ['wishes'] });
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
        
        // Обновляем данные в локальном сторе
        setStore('wishes', (old: Wish[]) => {
          return old.map((wish: Wish) => {
            if (wish.id === params.id) {
              return {
                ...wish,
                images: wish.images.filter((img: WishImage) => img.id !== imageId)
              };
            }
            return wish;
          });
        });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      addToast("Failed to delete image");
    } finally {
      setIsDeleting(false);
    }
  };

  createEffect(() => {
    mainButton.offClick(saveWish)

    if (item.isSuccess) {
      mainButton.onClick(saveWish)
      if (isSaving()) {
        mainButton.disable('Saving...')
      } else {
        mainButton.enable('Save wish')
      }
    } else {
      mainButton.disable('Save wish')
    }
  })

  onCleanup(() => {
    mainButton.hide()
    mainButton.offClick(saveWish)
  })

  return (
    <div class="flex flex-col items-center p-4 min-h-screen">
      <h1 class="text-xl font-bold mb-6">Edit Wish</h1>

      <Show when={item.isSuccess} fallback={
        <div class="flex items-center justify-center h-40">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <div class="w-full space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pb-6">
          <div>
            <label class="block text-sm font-medium mb-1">Wish name</label>
            <input
              type="text"
              value={wishName()}
              onChange={(e) => setWishName(e.target.value)}
              class="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter wish name"
              disabled={isSaving()}
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Link</label>
            <input
              type="url"
              value={wishLink()}
              onChange={(e) => setWishLink(e.target.value)}
              class="w-full px-3 py-2 border rounded-lg"
              placeholder="https://example.com"
              disabled={isSaving()}
            />
          </div>

          <Show when={isSaving()}>
            <div class="flex items-center justify-center py-4">
              <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              <span class="ml-2">Saving changes...</span>
            </div>
          </Show>

          <Show when={item.data?.images} fallback={<ImageLoader />}>
					<For each={item.data?.images}>
						{(image: WishImage) => (
							<div class="relative">
								<img
									src={`https://assets.peatch.io/${image.url}`}
									alt={item.data?.name}
									class="w-full rounded-[25px] border-[0.5px] border-border/60"
									style={{ 'aspect-ratio': `${image.width}/${image.height}` }}
								/>
								<button 
									onClick={() => deleteImage(image.id)}
									disabled={isDeleting() || isSaving()}
									class="absolute top-3 right-3 bg-black/70 hover:bg-black rounded-full p-1.5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
									title="Delete image"
								>
									<span class="material-symbols-rounded text-[10px]">delete</span>
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