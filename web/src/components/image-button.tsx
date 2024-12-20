// Reusable CategoryButton Component
import { Component } from 'solid-js'

type ImageButtonProps = {
	children: any
	leftImage: string
	image: string
	rightImage: string
}

export const ImageButton: Component<ImageButtonProps> = (props) => (
	<button class="w-full h-[200px] grid grid-cols-3 gap-0.5 rounded-full overflow-hidden">
    <span
			class="size-full bg-cover bg-center bg-no-repeat rounded-l-full"
			style={{ 'background-image': `url(${props.leftImage}), url(/placeholder.jpg)` }}
		></span>
		<span
			class="size-full bg-cover bg-center bg-no-repeat flex items-center justify-center text-white font-bold text-xl"
			style={{ 'background-image': `url(${props.image}), url(/placeholder.jpg)` }}
		>
      {props.children}
    </span>
		<span
			class="size-full bg-cover bg-center bg-no-repeat rounded-r-full"
			style={{ 'background-image': `url(${props.rightImage}), url(/placeholder.jpg)` }}
		></span>
	</button>
)
