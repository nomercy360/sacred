import { Component, For, Show } from 'solid-js'
import { WishImage } from '~/lib/api'

interface ConfirmStepProps {
	name: string | null
	link: string | null
	uploadImages: WishImage[]
	onDeleteImage: (id: string) => void
	onNameClick: () => void
	onAddLinkClick: () => void
}

function linkToDomain(link: string) {
	const url = new URL(link)
	return url.hostname.replace('www.', '')
}

const ConfirmStep: Component<ConfirmStepProps> = (props) => {
	return (
		<div class="w-full flex items-center justify-start flex-col">
			<div class="px-8 flex flex-col items-center">
				<button
					class="px-3 mb-5 text-xl font-extrabold relative flex flex-col items-center justify-center"
					onClick={props.onNameClick}
				>
					{props.name}
					<span class="text-xs text-secondary-foreground font-normal">
					Edit
					<span class="material-symbols-rounded text-[8px] ml-1">
						arrow_forward_ios
					</span>
				</span>
				</button>
				<Show when={!props.link}>
					<button
						class="shrink-0 h-8 px-3 text-sm text-foreground font-semibold flex flex-row items-center bg-secondary rounded-2xl"
						onClick={() => props.onAddLinkClick()}
					>
						Add link
						<span class="material-symbols-rounded text-[16px] ml-2">
							add
						</span>
					</button>
				</Show>
				<Show when={props.link}>
					<a
						href={props.link!}
						class="shrink-0 h-8 px-3 text-sm text-foreground font-semibold flex flex-row items-center rounded-2xl"
						target="_blank"
						rel="noopener noreferrer"
					>
						at {linkToDomain(props.link!)}
						<span class="material-symbols-rounded text-[16px] ml-2">
							open_in_new
						</span>
					</a>
				</Show>
			</div>
			<div class="mt-7 flex flex-col space-y-0.5 w-full items-center">
				<For each={props.uploadImages}>
					{(img) => (
						<div class="border relative rounded-[48px] bg-secondary w-full aspect-[3/4]">
							<button
								class="absolute top-7 right-7 bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center"
								onClick={() => props.onDeleteImage(img.id)}
							>
								<span class="material-symbols-rounded text-[16px]">close</span>
							</button>
							<img
								src={`https://assets.peatch.io/${img.url}`}
								alt=""
								loading="lazy"
								class="w-full object-contain rounded-[48px] aspect-auto shrink-0 pointer-events-none select-none"
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
