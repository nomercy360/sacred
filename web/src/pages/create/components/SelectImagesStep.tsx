import { Component, createEffect, For, Show } from 'solid-js'

interface SelectImagesStepProps {
  metaWithImages: {
    image_urls: string[]
    metadata: {
      [key: string]: string
    }
  } | null
  urlImages: string[]
  setUrlImages: (fn: (old: string[]) => string[]) => void
}

const SelectImagesStep: Component<SelectImagesStepProps> = (props) => {
  const splitImages = (images: string[]) => {
    const middle = Math.ceil(images.length / 2)
    return [images.slice(0, middle), images.slice(middle)]
  }

  return (
    <Show when={props.metaWithImages} fallback={<ImageGridLoader />}>
      <div class="grid grid-cols-2 gap-0.5 w-full overflow-y-scroll">
        <For each={splitImages(props.metaWithImages!.image_urls)}>
          {(group) => (
            <div class="flex flex-col gap-0.5">
              <For each={group}>
                {(url) => (
                  <button
                    class="relative rounded-2xl bg-secondary aspect-[3/4]"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (props.urlImages.find((i: string) => i === url)) {
                        props.setUrlImages((old) => old.filter((i: string) => i !== url))
                      } else {
                        props.setUrlImages((old) => [...old, url])
                      }
                      window.Telegram.WebApp.HapticFeedback.selectionChanged()
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      class="w-full h-auto max-h-[500px] object-contain rounded-2xl aspect-auto shrink-0 pointer-events-none select-none"
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement
                        img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
                      }}
                    />
                    <Show when={props.urlImages.find((i: string) => i === url)}>
                      <div
                        class="absolute inset-0 bg-black bg-opacity-20 flex items-start justify-end rounded-2xl p-3">
                        <span
                          class="text-xs font-medium bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center">
                            {props.urlImages.findIndex((i: string) => i === url) + 1}
                        </span>
                      </div>
                    </Show>
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}

function ImageGridLoader() {
  return (
    <div class="w-full grid grid-cols-2 gap-0.5 overflow-y-scroll">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div
          class="border border-border/60 bg-secondary relative w-full bg-center bg-cover aspect-[3/4] rounded-2xl animate-pulse" />
      ))}
    </div>
  )
}

export default SelectImagesStep
export { ImageGridLoader }