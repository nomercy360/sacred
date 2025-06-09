import { Component, For, Match, Show, Switch } from 'solid-js'

interface SelectImagesStepProps {
    parsedImageUrls: string[]
    isLoading: boolean
    urlImages: string[]
    setUrlImages: (fn: (old: string[]) => string[]) => void
}

const SelectImagesStep: Component<SelectImagesStepProps> = props => {
    const splitImages = (images: string[]) => {
        const middle = Math.ceil(images.length / 2)
        return [images.slice(0, middle), images.slice(middle)]
    }

    return (
        <Switch>
            <Match when={props.parsedImageUrls.length > 0 && !props.isLoading}>
                <div class="grid w-full grid-cols-2 gap-0.5">
                    <For each={splitImages(props.parsedImageUrls)}>
                        {group => (
                            <div class="flex flex-col gap-0.5">
                                <For each={group}>
                                    {url => (
                                        <button
                                            class="relative rounded-2xl bg-secondary"
                                            onClick={e => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (
                                                    props.urlImages.find(
                                                        (i: string) =>
                                                            i === url,
                                                    )
                                                ) {
                                                    props.setUrlImages(old =>
                                                        old.filter(
                                                            (i: string) =>
                                                                i !== url,
                                                        ),
                                                    )
                                                } else {
                                                    props.setUrlImages(old => [
                                                        ...old,
                                                        url,
                                                    ])
                                                }
                                                window.Telegram.WebApp.HapticFeedback.selectionChanged()
                                            }}
                                        >
                                            <img
                                                src={url}
                                                alt=""
                                                loading="lazy"
                                                class="pointer-events-none aspect-auto h-auto max-h-[500px] w-full shrink-0 select-none rounded-2xl border object-contain"
                                                onLoad={e => {
                                                    const img =
                                                        e.target as HTMLImageElement
                                                    img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
                                                }}
                                            />
                                            <Show
                                                when={props.urlImages.find(
                                                    (i: string) => i === url,
                                                )}
                                            >
                                                <div class="absolute inset-0 flex items-start justify-end rounded-2xl bg-black bg-opacity-20 p-3">
                                                    <span class="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                                        {props.urlImages.findIndex(
                                                            (i: string) =>
                                                                i === url,
                                                        ) + 1}
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
            </Match>
            <Match when={!props.parsedImageUrls.length && !props.isLoading}>
                <NoImagesFound />
            </Match>
            <Match when={props.parsedImageUrls.length === 0 && props.isLoading}>
                <ImageGridLoader isLoading={props.isLoading} />
            </Match>
        </Switch>
    )
}

interface ImageGridLoaderProps {
    isLoading?: boolean
}

function ImageGridLoader(props: ImageGridLoaderProps = { isLoading: true }) {
    return (
        <div class="w-full">
            {props.isLoading && (
                <div class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
                    {/* Анимированный круг */}
                    <div class="relative h-8 w-8">
                        <div class="absolute inset-0 rounded-full border-2 border-white/20" />
                        <div class="absolute inset-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>

                    {/* Текст */}
                    <p class="text-sm font-medium text-white">
                        Getting images...
                    </p>
                </div>
            )}
            <div class="grid w-full grid-cols-2 gap-0.5 overflow-y-scroll">
                <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    {i => (
                        <div class="relative aspect-[3/4] w-full animate-pulse rounded-2xl bg-secondary bg-cover bg-center" />
                    )}
                </For>
            </div>
        </div>
    )
}

function NoImagesFound() {
    return (
        <div class="flex w-full flex-col items-center justify-center px-4 py-8 text-center">
            <div class="mb-4 text-4xl">📷</div>
            <h3 class="mb-2 text-lg font-medium">No images found</h3>
            <p class="mb-4 text-sm text-muted-foreground">
                We couldn't find any images from the link you provided.
            </p>
            <p class="text-sm text-muted-foreground">
                Try a different link or upload images manually.
            </p>
        </div>
    )
}

export default SelectImagesStep
export { ImageGridLoader }
