import { Component, For, Show } from 'solid-js'
import { WishImage } from '~/lib/api'

interface ConfirmStepProps {
	name: string | null
	link: string | null
	imageUrls: string[]
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

const ConfirmStep: Component<ConfirmStepProps> = (props) => {
	return (
		<div class="w-full flex items-center justify-start flex-col">
			<div class="px-8 flex flex-col items-center">
				<button
					class="px-3 mb-5 text-xl font-extrabold relative flex flex-col items-center justify-center"
					onClick={props.onNameClick}
				>
					{props.name}
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
				<Show when={props.link && props.link !== ''}>
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
				{/* Display URL images */}
				<For each={props.imageUrls}>
					{(url, index) => (
						<div class="relative rounded-[48px] bg-secondary w-full aspect-[3/4]">
							<button
								class="absolute top-7 right-7 bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center"
								onClick={() => props.onDeleteImage(index())}
							>
								<span class="material-symbols-rounded text-[16px]">close</span>
							</button>
							<img
								src={url}
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
				{/* Display file images */}
				<For each={props.imageFiles}>
					{(file, index) => (
						<div class="relative rounded-[48px] bg-secondary w-full aspect-[3/4]">
							<button
								class="absolute top-7 right-7 bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center"
								onClick={() => props.onDeleteImage(props.imageUrls.length + index())}
							>
								<span class="material-symbols-rounded text-[16px]">close</span>
							</button>
							<img
								src={URL.createObjectURL(file)}
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
			<div
				class="pt-2 px-4 flex flex-col items-start justify-start h-[95px] fixed bottom-0 w-full bg-background z-50"
			>
				<div class="grid grid-cols-2 w-full gap-2">
					<label
						class="bg-primary cursor-pointer text-primary-foreground text-sm font-medium rounded-xl h-12 px-4 w-full flex flex-row items-center justify-between"
					>
						<input
							type="file"
							class="sr-only w-full h-full"
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
						class="bg-primary text-primary-foreground text-sm font-medium rounded-xl h-12 px-4 w-full flex flex-row items-center justify-between"
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
