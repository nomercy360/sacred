import { Link } from '~/components/link'
import { fetchPresignedUrl, NewItemRequest, uploadToS3 } from '~/lib/api'
import { useNavigate } from '@solidjs/router'
import { createStore } from 'solid-js/store'

export const [createWishStore, setCreateWishStore] = createStore<NewItemRequest>({
	name: '',
	notes: null,
	url: null,
	images: [],
	price: null,
	currency: '',
	is_public: true,
	category_ids: [],
})

const NewItem = () => {
	const navigate = useNavigate()

	const handleFileChange = async (event: any) => {
		setCreateWishStore('images', [])
		const files = event.target.files
		if (files && files.length > 0) {
			const maxSize = 1024 * 1024 * 7 // 7MB
			const newImages = [] as { url: string, width: number, height: number, size: number }[]

			for (const file of files) {
				if (file.size > maxSize) {
					window.Telegram.WebApp.showAlert(
						`File ${file.name} is too large. Try to select a smaller file.`,
					)
					continue
				}

				const reader = new FileReader()
				const filePromise = new Promise<void>((resolve, reject) => {
					reader.onload = () => {
						const img = new Image()
						img.onload = async () => {
							const width = img.width
							const height = img.height

							try {
								const { data, error } = await fetchPresignedUrl(file.name)
								if (error) {
									console.error(`Error fetching presigned URL for ${file.name}:`, error)
									reject(error)
									return
								}

								await uploadToS3(data.url, file)

								newImages.push({
									url: data.asset_url,
									width,
									height,
									size: file.size,
								})

								resolve()
							} catch (err) {
								console.error(`Error uploading ${file.name}:`, err)
								reject(err)
							}
						}
						img.src = reader.result as string
					}
					reader.readAsDataURL(file)
				})

				await filePromise.catch((error) => console.error(`Error processing file ${file.name}:`, error))
			}

			// Update state with all valid images
			if (newImages.length > 0) {
				setCreateWishStore('images', (prev) => [...prev, ...newImages])
				navigate('/create/from-images')
			} else {
				window.Telegram.WebApp.showAlert('No valid files were selected.')
			}
		}
	}

	return (
		<div
			class="relative w-full h-screen grid grid-rows-3 overflow-hidden gap-0.5 pt-8 pb-[120px]"
		>
			{/*<button class="w-full flex flex-col items-center justify-center bg-secondary rounded-full">*/}
			{/*	<span class="material-symbols-rounded text-[20px]">*/}
			{/*		attach_file*/}
			{/*	</span>*/}
			{/*	<p class="mt-2 text-sm max-w-[160px] font-medium">*/}
			{/*		Send an&nbsp;image or&nbsp;paste a&nbsp;URL in&nbsp;the chat*/}
			{/*	</p>*/}
			{/*</button>*/}
			<label
				class="text-center w-full flex flex-col items-center justify-center bg-secondary rounded-full">
				<input
					type="file"
					class="sr-only w-full"
					placeholder="Enter image"
					accept="image/*"
					onChange={(e) => handleFileChange(e)}
				/>
				<span class="material-symbols-rounded text-[20px]">
					add_a_photo
				</span>
				<span class="mt-2 text-sm max-w-[160px] font-medium">
					Upload from camera or&nbsp;library
				</span>
			</label>
			<Link class="text-center w-full flex flex-col items-center justify-center bg-secondary rounded-full"
						href="/create/from-link">
				<span class="material-symbols-rounded text-[20px]">
					language
				</span>
				<p class="mt-2 text-sm max-w-[160px] font-medium">
					Paste a&nbsp;link from clipboard
				</p>
			</Link>
		</div>
	)
}

export default NewItem
