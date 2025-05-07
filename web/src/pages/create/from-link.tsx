import FormLayout from '~/components/form-layout'
import { FormTextArea } from '~/components/form-input'
import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import CategoriesSelect from '~/components/categories-select'
import {
	fetchAddWish, fetchUpdateWish, UpdateWishRequest,
	uploadWishPhoto, uploadWishPhotosByUrls, WishImage,
} from '~/lib/api'
import { currencySymbol } from '~/lib/utils'
import { useNavigate } from '@solidjs/router'
import { createStore } from 'solid-js/store'
import { setStore } from '~/store'
import { addToast } from '~/components/toast'

type MetadataResponse = {
	image_urls: string[]
	metadata: {
		[key: string]: string
	}
}

const StepNames = {
	ADD_LINK: 'ADD_LINK',
	ADD_SIMPLE_LINK: 'ADD_LINK',
	CHOOSE_CATEGORIES: 'CHOOSE_CATEGORIES',
	SELECT_IMAGES: 'SELECT_IMAGES',
	ADD_NAME: 'ADD_NAME',
	ADD_PRICE: 'ADD_PRICE',
	CONFIRM: 'CONFIRM',
} as const

type StepName = typeof StepNames[keyof typeof StepNames];

const FlowNames = {
	START_WITH_LINK: 'START_WITH_LINK',
	START_WITH_PHOTOS: 'START_WITH_PHOTOS',
} as const

type FlowName = typeof FlowNames[keyof typeof FlowNames];

export default function CreateFromLinkPage() {
	const [updateWish, setUpdateWish] = createStore<UpdateWishRequest>({ category_ids: [] } as any)

	const [urlImages, setUrlImages] = createSignal<string[]>([])
	const [uploadImages, setUploadImages] = createSignal<WishImage[]>([])

	const navigate = useNavigate()

	const mainButton = useMainButton()

	const backButton = useBackButton()

	const [activeFlow, setActiveFlow] = createSignal<FlowName>(FlowNames.START_WITH_LINK)
	const [step, setStep] = createSignal<StepName>(StepNames.ADD_LINK)
	const [metaWithImages, setMetaWithImages] = createSignal<MetadataResponse | null>(null)
	const [createdWishId, setCreatedWishId] = createSignal<string | null>(null)

	function updateLink(newLink: string) {
		setUpdateWish({ url: newLink })
	}

	async function createWishIfNeeded() {
		if (!createdWishId()) {
			const { data, error } = await fetchAddWish()
			if (error) {
				addToast('Failed to create wish. Please try again.')
				return
			}
			setCreatedWishId(data.id)
		}
	}

	const handleFileChange = async (event: any) => {
		setActiveFlow(FlowNames.START_WITH_PHOTOS)
		const files = event.target.files
		if (files && files.length > 0) {
			mainButton.showProgress(false)
			const maxSize = 1024 * 1024 * 7 // 7MB
			const validFiles = [] as File[]

			for (const file of files) {
				if (file.size > maxSize) {
					addToast(
						`File ${file.name} is too large. Try to select a smaller file.`,
					)
					continue
				}
				validFiles.push(file)
			}

			if (validFiles.length === 0) {
				addToast('No valid files were selected.')
				mainButton.hideProgress()
				return
			}

			try {
				await createWishIfNeeded()

				const wishId = createdWishId()!
				const newImages = [] as WishImage[]

				for (const file of validFiles) {
					const reader = new FileReader()
					const filePromise = new Promise<void>((resolve, reject) => {
						reader.onload = () => {
							const img = new Image()
							img.onload = async () => {
								try {
									const { data, error } = await uploadWishPhoto(wishId, file)
									if (error) {
										console.error(`Error uploading photo for ${file.name}:`, error)
										reject(error)
										return
									}

									newImages.push(data)

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

				if (newImages.length > 0) {
					setUploadImages((old) => [...old, ...newImages])
					setStep(StepNames.CHOOSE_CATEGORIES)
				} else {
					addToast('Failed to upload files.')
				}
			} finally {
				mainButton.hideProgress()
			}
		}
	}

	const onContinue = async () => {
		switch (step()) {
			case StepNames.ADD_LINK:
				setStep(StepNames.CHOOSE_CATEGORIES)
				setMetaWithImages(null)
				await createWishIfNeeded()
				fetchMetadata(updateWish.url!).then((data) => {
					setMetaWithImages(data)
					const title = data.metadata['og:title'] || data.metadata['title']
					if (title) setUpdateWish({ name: title })
				})
				break

			case StepNames.CHOOSE_CATEGORIES:
				const nextStep = activeFlow() === FlowNames.START_WITH_LINK ? StepNames.SELECT_IMAGES : StepNames.ADD_NAME
				setStep(nextStep)
				break

			case StepNames.SELECT_IMAGES:
				window.Telegram.WebApp.MainButton.showProgress(true)
				if (urlImages().length > 0) {
					const { data, error } = await uploadWishPhotosByUrls(createdWishId()!, urlImages())

					if (error) {
						addToast(`Failed to upload images: ${error}`)
						return
					}

					setUploadImages((old) => [...old, ...data])
				}
				window.Telegram.WebApp.MainButton.hideProgress()
				if (updateWish.name) {
					setStep(StepNames.CONFIRM)
				} else {
					setStep(StepNames.ADD_NAME)
				}
				break

			case StepNames.ADD_NAME:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.ADD_PRICE:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.CONFIRM:
				try {
					window.Telegram.WebApp.MainButton.showProgress(false)

					if (createdWishId()) {
						const { data, error } = await fetchUpdateWish(createdWishId()!, updateWish)

						if (error) {
							addToast(`Failed to update wish: ${error}`)
							return
						}

						setStore('wishes', (old) => [...old, data])
						navigate('/')
					} else {
						addToast('Something went wrong. Please try again.')
					}
				} finally {
					window.Telegram.WebApp.MainButton.hideProgress()
				}
				break
		}
	}

	function decrementStep() {
		switch (step()) {
			case StepNames.ADD_LINK:
				navigate('/')
				break

			case StepNames.CHOOSE_CATEGORIES:
				setStep(StepNames.ADD_LINK)
				break

			case StepNames.SELECT_IMAGES:
				setStep(StepNames.CHOOSE_CATEGORIES)
				break

			case StepNames.ADD_NAME:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.ADD_PRICE:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.CONFIRM:
				setStep(StepNames.ADD_PRICE)
				break
		}
	}

	createEffect(() => {
		switch (step()) {
			case StepNames.ADD_LINK:
				backButton.setVisible()
				backButton.onClick(decrementStep)
				mainButton.toggle(!!updateWish.url?.match(/^https?:\/\//), 'Continue')
				break

			case StepNames.CHOOSE_CATEGORIES:
				mainButton.toggle(updateWish.category_ids.length > 0, 'Continue', 'Select at least 1')
				break

			case StepNames.SELECT_IMAGES:
				mainButton.toggle(urlImages().length > 0, 'Continue', 'Select at least 1')
				break

			case StepNames.ADD_NAME:
				mainButton.toggle(!!updateWish.name, 'Continue', 'Add title to continue')
				break

			case StepNames.ADD_PRICE:
				mainButton.enable('Continue')
				break

			case StepNames.CONFIRM:
				mainButton.enable('Save & Publish')
				break
		}
	})

	onMount(() => {
		mainButton.onClick(onContinue)
	})

	onCleanup(() => {
		mainButton.offClick(onContinue)
		mainButton.hide()
		backButton.offClick(decrementStep)
		backButton.hide()
	})

	const formHeaders: Record<StepName, string | undefined> = {
		[StepNames.ADD_LINK]: 'Add the link',
		[StepNames.CHOOSE_CATEGORIES]: 'Choose categories',
		[StepNames.SELECT_IMAGES]: 'Select images',
		[StepNames.ADD_NAME]: 'Give name to the wish',
		[StepNames.ADD_PRICE]: 'Add price',
		[StepNames.CONFIRM]: undefined,
	}

	const splitImages = (images: string[]) => {
		const middle = Math.ceil(images.length / 2)
		return [images.slice(0, middle), images.slice(middle)]
	}

	const fetchMetadata = async (url: string): Promise<MetadataResponse> => {
		const res = await fetch('http://127.0.0.1:8081/extract-content', {
			method: 'POST',
			body: JSON.stringify({ url }),
			headers: {
				'Content-Type': 'application/json',
			},
		})

		return res.json()
	}

	function formatPrice(price: number | null, currency: string) {
		if (price === null) return ''
		return `${currencySymbol(currency)}${price}`
	}

	return (
		<FormLayout title={formHeaders[step()]} step={Object.values(StepNames).indexOf(step()) + 1} maxSteps={6}>
			<Switch>
				<Match when={step() === StepNames.ADD_LINK}>
					<label
						class="absolute top-8 right-5 text-center size-10 flex flex-col items-center justify-center bg-secondary rounded-full">
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
					</label>
					<FormTextArea
						placeholder="https://nike.com/product/nike-air-max-90"
						value={updateWish.url || ''}
						onInput={(e) => setUpdateWish({ url: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>

				<Match when={step() === StepNames.CHOOSE_CATEGORIES}>
					<CategoriesSelect
						selectedCategories={updateWish.category_ids}
						setSelectedCategories={(ids) => setUpdateWish({ category_ids: ids })}
					/>
				</Match>
				<Match when={step() === StepNames.SELECT_IMAGES}>
					<Show when={metaWithImages()} fallback={<ImageGridLoader />}>
						<div class="grid grid-cols-2 gap-0.5 w-full overflow-y-scroll">
							<For each={splitImages(metaWithImages()!.image_urls)}>
								{(group) => (
									<div class="flex flex-col gap-0.5">
										<For each={group}>
											{(url) => (
												<button
													class="relative rounded-2xl bg-secondary aspect-[3/4]"
													onClick={(e) => {
														e.preventDefault()
														e.stopPropagation()
														if (urlImages().find((i: string) => i === url)) {
															setUrlImages((old) => old.filter((i: string) => i !== url))
														} else {
															setUrlImages((old) => [...old, url])
														}
														window.Telegram.WebApp.HapticFeedback.selectionChanged()
													}}
												>
													<img
														src={url}
														alt=""
														loading="lazy"
														class="w-full h-auto max-h-[500px] object-contain rounded-2xl aspect-auto shrink-0 pointer-events-none select-none"
														onLoad={(e) => {
															const img = e.target as HTMLImageElement
															img.parentElement!.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`
														}}
													/>
													<Show when={urlImages().find((i: string) => i === url)}>
														<div
															class="absolute inset-0 bg-black bg-opacity-20 flex items-start justify-end rounded-2xl p-3">
															<span
																class="text-xs font-medium bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center">
																	{urlImages().findIndex((i: string) => i === url) + 1}
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
					</Show>
				</Match>
				<Match when={step() === StepNames.ADD_NAME}>
					<FormTextArea
						placeholder="start typing"
						value={updateWish.name || ''}
						onInput={(e) => setUpdateWish({ name: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>
				<Match when={step() === StepNames.CONFIRM}>
					<div class="overflow-y-scroll w-full flex items-center justify-start flex-col">
						<button class="mx-10 mb-2 text-xl font-extrabold"
										onClick={() => setStep(StepNames.ADD_NAME)}
						>
							{updateWish.name}
						</button>
						<button class="mx-10 text-sm text-muted-foreground"
										onClick={() => setStep(StepNames.ADD_PRICE)}>
							{updateWish.price && updateWish.currency ? formatPrice(updateWish.price, updateWish.currency) : 'Add price'}
						</button>
						<div class="mt-7 flex flex-col space-y-0.5 w-full items-center">
							<For each={uploadImages()}>
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
				</Match>
			</Switch>
		</FormLayout>
	)
}

function ImageGridLoader() {
	return (
		<div class="w-full grid grid-cols-2 gap-0.5 overflow-y-scroll">
			{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
				<div
					class="border border-border/60 bg-secondary relative w-full bg-center bg-cover aspect-[3/4] rounded-2xl animate-pulse" />
			))}
		</div>
	)
}
