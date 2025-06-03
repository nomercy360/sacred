import { createSignal, Show } from 'solid-js'

type ImageWithPlaceholderProps = {
	src: string;
	alt: string;
	width: number; // Original width of the image
	height: number; // Original height of the image
	// Optional: add a class for the wrapper div for further styling if needed
	class?: string;
	// Optional: class for the image itself
	imageClass?: string;
};

export function ImageWithPlaceholder(props: ImageWithPlaceholderProps) {
	const [isLoaded, setIsLoaded] = createSignal(false)
	const [hasError, setHasError] = createSignal(false)

	const aspectRatio = () => {
		if (props.height > 0 && props.width > 0) {
			return `${props.width} / ${props.height}`
		}
		return '1 / 1' // Default aspect ratio if dimensions are invalid
	}

	return (
		<div
			class={`relative w-full bg-gray-200 ${props.class || ''}`} // Placeholder background
			style={{ 'aspect-ratio': aspectRatio() }}
		>
			<Show when={!hasError()}>
				<img
					src={props.src}
					alt={props.alt}
					width={props.width}   // Good for SEO and hints to browser
					height={props.height} // Good for SEO and hints to browser
					loading="lazy"        // Native lazy loading
					class={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out ${props.imageClass || ''}`}
					classList={{
						'opacity-0': !isLoaded(),
						'opacity-100': isLoaded(),
					}}
					onLoad={() => setIsLoaded(true)}
					onError={() => {
						console.error(`Failed to load image: ${props.src}`)
						setIsLoaded(true) // Still transition out the placeholder to show broken state or alt text
						setHasError(true) // Indicate an error
					}}
				/>
			</Show>
			<Show when={hasError()}>
				<div class="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-500">
					{/* You can put an icon or text here for error state */}
					<span class="material-symbols-rounded">broken_image</span>
				</div>
			</Show>
		</div>
	)
}
