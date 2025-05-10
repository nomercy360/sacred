import { useNavigate, useParams } from "@solidjs/router"
import { createMutation, useQuery } from "@tanstack/solid-query"
import { createEffect, createSignal, onCleanup, Show } from "solid-js"
import { fetchUpdateWish, fetchWish } from "~/lib/api"
import { Wish } from "~/lib/api"
import { useMainButton } from "~/lib/useMainButton"
import { queryClient } from "~/App"

export default function WishEditPage() {
  const [wishName, setWishName] = createSignal('')
  const [wishLink, setWishLink] = createSignal('')

  const params = useParams()
  const navigate = useNavigate()
  const mainButton = useMainButton()

  const item = useQuery<Wish>(() => ({
    queryKey: ['item', params.id],
    queryFn: () => fetchWish(params.id),
  }))

  console.log(params.id)

  const updateWishMutation = createMutation(() => ({
    mutationFn: async () => {
      const requestData = {
        name: wishName(),
        url: wishLink(),
        notes: null,
        price: null,
        currency: null,
        category_ids: []
      }
      
      return fetchUpdateWish(params.id, requestData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', params.id] })
      navigate('/')
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
      await updateWishMutation.mutateAsync()
    } catch (error) {
      console.error("Ошибка при сохранении:", error)
    } finally {
      mainButton.hideProgress()
    }
  }


  createEffect(() => {
    mainButton.offClick(saveWish)
    
    if (item.isSuccess) {
      mainButton.onClick(saveWish)
      mainButton.enable('Save wish')
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
        <div class="w-full space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Wish name</label>
            <input 
              type="text" 
              value={wishName()} 
              onInput={(e) => setWishName(e.target.value)}
              class="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter wish name"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Link</label>
            <input 
              type="url" 
              value={wishLink()} 
              onInput={(e) => setWishLink(e.target.value)}
              class="w-full px-3 py-2 border rounded-lg"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </Show>
    </div>
  )
}