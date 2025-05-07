import { Component, For } from 'solid-js'
import { WishImage } from '~/lib/api'
import { currencySymbol } from '~/lib/utils'

interface ConfirmStepProps {
	name: string | null
	price: number | null
	currency: string | null
	uploadImages: WishImage[]
	onNameClick: () => void
	onPriceClick: () => void
}

const ConfirmStep: Component<ConfirmStepProps> = (props) => {
	const formatPrice = (price: number | null, currency: string) => {
		if (price === null) return ''
		return `${currencySymbol(currency)}${price}`
	}

	return (
		<div class="overflow-y-scroll w-full flex items-center justify-start flex-col">
			<button
				class="mx-10 mb-2 text-xl font-extrabold"
				onClick={props.onNameClick}
			>
				{props.name}
			</button>
			<button
				class="mx-10 text-sm text-muted-foreground"
				onClick={props.onPriceClick}
			>
				{props.price && props.currency ? formatPrice(props.price, props.currency) : 'Add price'}
			</button>
			<div class="mt-7 flex flex-col space-y-0.5 w-full items-center">
				<For each={props.uploadImages}>
					{(img) => (
						<div class="relative rounded-2xl bg-secondary w-full aspect-[3/4]">
							<img
								src={`https://assets.peatch.io/${img.url}`}
								alt=""
								loading="lazy"
								class="w-full object-contain rounded-2xl aspect-auto shrink-0 pointer-events-none select-none"
								onLoad={(e) => {
									const img = e.target as HTMLImageElement
									img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
								}}
							/>
						</div>
					)}
				</For>
			</div>
		</div>
	)
}

export default ConfirmStep
