import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from '~/components/ui/text-field'
import { createStore } from 'solid-js/store'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { useMainButton } from '~/lib/useMainButton'
import { fetchAddWishlistItem, fetchPresignedUrl, NewItemRequest, uploadToS3 } from '~/lib/api'
import { Link } from '~/components/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { store } from '~/store'

const NewItem = () => {
	const mainButton = useMainButton()

	const [state, setState] = createStore<NewItemRequest>({
		name: '',
		notes: null,
		url: null,
		image_url: null,
		price: null,
		currency: null,
		is_public: true,
	})

	const [imgFile, setImgFile] = createSignal<File | null>(null)
	const [previewUrl, setPreviewUrl] = createSignal('')

	const [currency, setCurrency] = createSignal('USD')

	async function save() {
		if (imgFile() && imgFile() !== null) {
			mainButton.showProgress(false)
			try {
				const { data, error } = await fetchPresignedUrl(imgFile()!.name)
				await uploadToS3(data.url, imgFile()!)
				setState('image_url', `https://assets.peatch.io/${data.file_name}`)
				await fetchAddWishlistItem('Eg190oo0R9cl', state)
			} catch (e) {
				console.error(e)
			} finally {
				mainButton.hideProgress()
			}
		}
	}

	onMount(() => {
		mainButton.setVisible('Save')
		mainButton.onClick(save)
	})

	onCleanup(() => {
		mainButton.hide()
		mainButton.offClick(save)
	})

	createEffect(() => {
		if (state.name) {
			mainButton.enable()
		} else {
			mainButton.disable()
		}
	})

	const handleFileChange = (event: any) => {
		const file = event.target.files[0]
		if (file) {
			const maxSize = 1024 * 1024 * 5 // 7MB

			if (file.size > maxSize) {
				window.Telegram.WebApp.showAlert('Try to select a smaller file')
				return
			}

			setImgFile(file)
			setPreviewUrl('')

			const reader = new FileReader()
			reader.onload = (e) => {
				setPreviewUrl(e.target?.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	return (
		<div
			class="relative w-full flex flex-col h-screen overflow-hidden"
		>
			<div class="p-5 flex flex-row items-center justify-between">
				<div></div>
				<Link
					class="flex items-center justify-center bg-secondary rounded-full size-10"
					href={'/people'}
				>
					<span class="material-symbols-rounded text-[20px]">close</span>
				</Link>
			</div>
			<div class="p-5 flex flex-col items-center justify-start space-y-4 overflow-y-scroll h-full">
				<Show when={!imgFile()}
							fallback={<ImagePreview img={previewUrl()} onRemove={() => setImgFile(null)} />}>
					<label
						class="bg-secondary w-full flex h-12 items-center justify-start gap-4 rounded-xl px-3 text-sm text-muted-foreground">
						<span class="text-nowrap">Choose picture</span>
						<input
							type="file"
							class="sr-only mt-2 w-full rounded-lg p-2 text-foreground"
							placeholder="Enter image"
							capture="environment"
							accept="image/*"
							onChange={(e) => handleFileChange(e)}
						/>
					</label>
				</Show>
				<TextField class="w-full">
					<TextFieldInput
						type="text"
						id="name"
						placeholder="Name*"
						value={state.name}
						onInput={(e) => setState('name', (e.target as HTMLInputElement).value)}
					/>
				</TextField>
				<TextField class="w-full">
					<TextFieldInput
						type="text"
						id="url"
						placeholder="URL"
						value={state.url || ''}
						onInput={(e) => setState('url', (e.target as HTMLInputElement).value)}
					/>
				</TextField>

				<div class="w-full flex flex-row items-center justify-start space-x-2">
					<TextField class="w-full">
						<TextFieldInput
							type="text"
							id="price"
							placeholder="Price"
							value={state.price ? state.price.toString() : ''}
							onInput={(e) => setState('price', parseFloat((e.target as HTMLInputElement).value))}
						/>
					</TextField>
					<Select
						value={currency()}
						onChange={setCurrency}
						options={['USD', 'EUR', 'GBP']}
						placeholder="Currency"
						itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
					>
						<SelectTrigger aria-label="Fruit" class="w-[120px]">
							<SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
						</SelectTrigger>
						<SelectContent />
					</Select>
				</div>
				<TextField class="w-full">
					<TextFieldTextArea
						id="notes"
						placeholder="Notes"
						value={state.notes || ''}
						onInput={(e) => setState('notes', (e.target as HTMLInputElement).value)}
					/>
				</TextField>
			</div>
		</div>
	)
}

function ImagePreview(props: { img: string; onRemove: () => void }) {
	const [isRemoving, setIsRemoving] = createSignal(false)

	const handleRemove = () => {
		setIsRemoving(true)
		setTimeout(() => {
			props.onRemove()
		}, 200) // Match animation duration
	}

	return (
		<div
			class={`relative mt-4 flex flex-col items-center justify-center border rounded-xl ${
				isRemoving() ? 'animate-content-hide' : 'animate-content-show'
			}`}
		>
			<img
				src={props.img}
				class="w-full rounded-xl object-cover"
				alt="Preview"
			/>
			<button
				onClick={() => handleRemove()}
				class="absolute right-0 top-0 flex size-8 items-center rounded-xl justify-center text-foreground"
			>
				<span class="material-symbols-rounded text-[20px]">close</span>
			</button>
		</div>
	)
}


export default NewItem
