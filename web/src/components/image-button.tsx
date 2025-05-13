// Reusable ImageButton Component
import { Component, createMemo } from 'solid-js'
import { Link } from '~/components/link'

type ImageButtonProps = {
	children: any;
	images?: string[]; // Make images optional
	href: string;
};

export const ImageButton: Component<ImageButtonProps> = (props) => {
	const limitedImages = createMemo(() => props.images?.slice(0, 3) || [])

	const imageCount = createMemo(() => limitedImages().length)

	const gridCols = createMemo(() => {
		switch (imageCount()) {
			case 1:
				return 'grid-cols-1'
			case 2:
				return 'grid-cols-2'
			case 3:
				return 'grid-cols-3'
			default:
				return 'grid-cols-1' // Default to 1 column if no images
		}
	})

	const renderImages = () => {
		const imgs = limitedImages()

		if (imageCount() === 0) {
			// No images: show a default placeholder
			return (
				<span
					class="text-secondary-foreground size-full bg-cover bg-center bg-no-repeat bg-secondary flex items-center justify-center font-bold text-xl rounded-full"
				>
					{props.children}
				</span>
			)
		}

		return imgs.map((img, index) => {
			let containerClasses = 'relative size-full bg-secondary flex items-center justify-center'

			if (imageCount() === 1) {
				containerClasses += 'rounded-full'
			} else if (imageCount() === 2) {
				containerClasses += index === 0 ? 'rounded-l-full' : 'rounded-r-full'
			} else if (imageCount() === 3) {
				if (index === 0) containerClasses += 'rounded-l-full'
				else if (index === 2) containerClasses += 'rounded-r-full'
			}

			// Image layer with stronger darkening overlay
			const imageLayer = (
				<span
					class="absolute inset-0 bg-cover bg-center bg-no-repeat after:content-[''] after:absolute after:inset-0 after:bg-black after:bg-opacity-50"
					style={{ 'background-image': `url(${img})` }}
				></span>
			)

			// Conditionally render the content layer
			const contentLayer = ((imageCount() === 2 && index === 0) || (imageCount() === 3 && index === 1)) ? (
				<div class="relative z-10 text-primary-foreground flex items-center justify-center h-full w-full">
					{props.children}
				</div>
			) : null

			return (
				<span class={containerClasses} style={{ 'background-image': `url(${img})` }}>
					{imageLayer}
					{contentLayer}
				</span>
			)
		})
	}

	return (
		<Link
			class={`w-full h-[200px] grid ${gridCols()} gap-0.5 rounded-full overflow-hidden relative`}
			href={props.href}
		>
			{renderImages()}
		</Link>
	)
}
