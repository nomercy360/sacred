import { Component, For, Show } from 'solid-js'

interface ConfirmStepProps {
    name: string | null
    link: string | null
    imageUrls: string[]
    price: string | null
    imageFiles: File[]
    onNameClick: () => void
    onAddLinkClick: () => void
    onFileUpload: (e: Event) => void
    onPublishClick: () => void
    onDeleteImage: (index: number) => void
}

function linkToDomain(link: string) {
    if (!link.startsWith('http')) {
        return
    }
    const url = new URL(link)
    return url.hostname.replace('www.', '')
}

const ConfirmStep: Component<ConfirmStepProps> = props => {
    return (
        <div class="flex w-full flex-col items-center justify-start">
            <div class="flex flex-col items-center px-8">
                <button
                    class="relative mb-5 flex flex-col items-center justify-center px-3 text-xl font-extrabold"
                    onClick={props.onNameClick}
                >
                    {props.name}
                </button>
                <Show when={!props.link}>
                    <button
                        class="flex h-8 shrink-0 flex-row items-center rounded-2xl bg-secondary px-3 text-sm font-semibold text-foreground"
                        onClick={() => props.onAddLinkClick()}
                    >
                        Add link
                        <span class="material-symbols-rounded ml-2 text-[16px]">
                            add
                        </span>
                    </button>
                </Show>
                <Show when={props.link && props.link !== ''}>
                    <a
                        href={props.link!}
                        class="flex h-8 shrink-0 flex-row items-center rounded-2xl px-3 text-sm font-semibold text-foreground"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {props.price ? props.price + ' ' : ''} at{' '}
                        {linkToDomain(props.link!)}
                        <span class="material-symbols-rounded ml-2 text-[16px]">
                            open_in_new
                        </span>
                    </a>
                </Show>
            </div>
            <div class="mt-7 flex w-full flex-col items-center space-y-0.5">
                {/* Display URL images */}
                <For each={props.imageUrls}>
                    {(url, index) => (
                        <div class="relative aspect-[3/4] w-full rounded-[48px] bg-secondary">
                            <button
                                class="absolute right-7 top-7 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                onClick={() => props.onDeleteImage(index())}
                            >
                                <span class="material-symbols-rounded text-[16px]">
                                    close
                                </span>
                            </button>
                            <img
                                src={url}
                                alt=""
                                loading="lazy"
                                class="pointer-events-none aspect-auto w-full shrink-0 select-none rounded-[25px] rounded-[48px] border object-contain shadow-sm"
                                onLoad={e => {
                                    const img = e.target as HTMLImageElement
                                    img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
                                }}
                            />
                        </div>
                    )}
                </For>
                {/* Display file images */}
                <For each={props.imageFiles}>
                    {(file, index) => (
                        <div class="relative aspect-[3/4] w-full rounded-[48px] bg-secondary">
                            <button
                                class="absolute right-7 top-7 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                onClick={() =>
                                    props.onDeleteImage(
                                        props.imageUrls.length + index(),
                                    )
                                }
                            >
                                <span class="material-symbols-rounded text-[16px]">
                                    close
                                </span>
                            </button>
                            <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                loading="lazy"
                                class="pointer-events-none aspect-auto w-full shrink-0 select-none rounded-[48px] object-contain"
                                onLoad={e => {
                                    const img = e.target as HTMLImageElement
                                    img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
                                }}
                            />
                        </div>
                    )}
                </For>
            </div>
            <div class="fixed bottom-0 z-50 flex h-[95px] w-full flex-col items-start justify-start bg-background px-4 pt-2">
                <div class="grid w-full grid-cols-2 gap-2">
                    <label class="flex h-12 w-full cursor-pointer flex-row items-center justify-between rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                        <input
                            type="file"
                            class="sr-only h-full w-full"
                            placeholder="Enter image"
                            accept="image/*"
                            multiple
                            onChange={props.onFileUpload}
                        />
                        Add photos
                        <span class="material-symbols-rounded text-[20px]">
                            add
                        </span>
                    </label>
                    <button
                        class="flex h-12 w-full flex-row items-center justify-between rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                        onClick={() => props.onPublishClick()}
                    >
                        Publish
                        <span class="material-symbols-rounded text-[20px]">
                            arrow_forward
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmStep
