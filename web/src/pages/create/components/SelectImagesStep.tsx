import { Component, For, Match, Show, Switch } from 'solid-js'

interface SelectImagesStepProps {
	parsedImageUrls: string[]
	isLoading: boolean
	urlImages: string[]
	setUrlImages: (fn: (old: string[]) => string[]) => void
}

const SelectImagesStep: Component<SelectImagesStepProps> = (props) => {
	const splitImages = (images: string[]) => {
		const middle = Math.ceil(images.length / 2)
		return [images.slice(0, middle), images.slice(middle)]
	}

	return (
		<Switch>
			<Match when={props.parsedImageUrls.length > 0 && !props.isLoading}>
				<div class="grid grid-cols-2 gap-0.5 w-full">
					<For each={splitImages(props.parsedImageUrls)}>
						{(group) => (
							<div class="flex flex-col gap-0.5">
								<For each={group}>
									{(url) => (
										<button
											class="relative rounded-2xl bg-secondary"
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
												class="w-full h-auto max-h-[500px] object-contain border rounded-2xl aspect-auto shrink-0 pointer-events-none select-none"
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
	isLoading?: boolean;
}

function ImageGridLoader(props: ImageGridLoaderProps = { isLoading: true }) {
	return (
	  <div class="w-full">
		{props.isLoading && (
		  <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-3">
			{/* Анимированный круг */}
			<div class="relative h-8 w-8">
			  <div class="absolute inset-0 border-2 border-white/20 rounded-full"></div>
			  <div class="absolute inset-0 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
			</div>
			
			{/* Текст */}
			<p class="text-white font-medium text-sm">
			  Getting images...
			</p>
		  </div>
		)}
		<div class="w-full grid grid-cols-2 gap-0.5 overflow-y-scroll">
		  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
			<div
			  class="bg-secondary relative w-full bg-center bg-cover aspect-[3/4] rounded-2xl animate-pulse" />
		  ))}
		</div>
	  </div>
	)
  }

function NoImagesFound() {
	return (
		<div class="flex flex-col items-center justify-center w-full py-8 px-4 text-center">
			<div class="mb-4 text-4xl">📷</div>
			<h3 class="text-lg font-medium mb-2">No images found</h3>
			<p class="text-sm text-muted-foreground mb-4">
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
