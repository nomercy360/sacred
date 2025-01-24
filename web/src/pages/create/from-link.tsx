import FormLayout from '~/components/form-layout'
import { FormTextArea } from '~/components/form-input'
import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import CategoriesSelect from '~/components/categories-select'
import { fetchAddWish, fetchPresignedUrl, NewItemRequest, uploadToS3 } from '~/lib/api'
import { currencySymbol } from '~/lib/utils'
import { queryClient } from '~/App'
import { useNavigate } from '@solidjs/router'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import {
	NumberField, NumberFieldDecrementTrigger,
	NumberFieldGroup,
	NumberFieldIncrementTrigger,
	NumberFieldInput,
} from '~/components/ui/number-field'
import { createStore } from 'solid-js/store'

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
	const [createWishStore, setCreateWishStore] = createStore<NewItemRequest>({
		name: '',
		notes: null,
		url: null,
		images: [],
		price: null,
		currency: '',
		is_public: true,
		category_ids: [],
	})

	const navigate = useNavigate()

	const mainButton = useMainButton()

	const backButton = useBackButton()

	const [activeFlow, setActiveFlow] = createSignal<FlowName>(FlowNames.START_WITH_LINK)
	const [step, setStep] = createSignal<StepName>(StepNames.ADD_LINK)
	const [previousStep, setPreviousStep] = createSignal<StepName | null>(null)
	const [metaWithImages, setMetaWithImages] = createSignal<MetadataResponse | null>(null)

	const updateStep = (newStep: StepName, fromStep: StepName) => {
		setStep(newStep)
		setPreviousStep(fromStep)
	}

	function updateLink(newLink: string) {
		setCreateWishStore({ url: newLink })
	}

	const handleFileChange = async (event: any) => {
		setActiveFlow(FlowNames.START_WITH_PHOTOS)
		const files = event.target.files
		if (files && files.length > 0) {
			mainButton.showProgress(false)
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
				setCreateWishStore('images', (prev: any) => [...prev, ...newImages])
				mainButton.hideProgress()
				updateStep(StepNames.CHOOSE_CATEGORIES, StepNames.ADD_LINK)
			} else {
				window.Telegram.WebApp.showAlert('No valid files were selected.')
			}
		}
	}

	const onContinue = async () => {
		switch (step()) {
			case StepNames.ADD_LINK:
				updateStep(StepNames.CHOOSE_CATEGORIES, StepNames.ADD_LINK)
				setMetaWithImages(null)
				fetchMetadata(createWishStore.url!).then((data) => {
					setMetaWithImages(data)
					const title = data.metadata['og:title'] || data.metadata['title']
					if (title) setCreateWishStore({ name: title })
				})
				break

			case StepNames.CHOOSE_CATEGORIES:
				const nextStep = activeFlow() === FlowNames.START_WITH_LINK ? StepNames.SELECT_IMAGES : StepNames.ADD_NAME
				updateStep(nextStep, StepNames.CHOOSE_CATEGORIES)
				break

			case StepNames.SELECT_IMAGES:
				if (createWishStore.name) {
					updateStep(StepNames.CONFIRM, StepNames.SELECT_IMAGES)
				} else {
					updateStep(StepNames.ADD_NAME, StepNames.SELECT_IMAGES)
				}
				break

			case StepNames.ADD_NAME:
				updateStep(StepNames.CONFIRM, StepNames.ADD_NAME)
				break

			case StepNames.ADD_PRICE:
				updateStep(StepNames.CONFIRM, StepNames.ADD_PRICE)
				break

			case StepNames.CONFIRM:
				try {
					window.Telegram.WebApp.MainButton.showProgress(false)
					await fetchAddWish(createWishStore)
					await queryClient.invalidateQueries({ queryKey: ['wishes'] })
					navigate('/')
				} finally {
					window.Telegram.WebApp.MainButton.hideProgress()
				}
				break
		}
	}

	function decrementStep() {
		if (previousStep() !== null) {
			setStep(previousStep()!)
		}
	}

	function goBack() {
		navigate('/new')
	}

	createEffect(() => {
		switch (step()) {
			case StepNames.ADD_LINK:
				backButton.setVisible()
				backButton.offClick(decrementStep)
				backButton.onClick(goBack)
				mainButton.toggle(!!createWishStore.url?.match(/^https?:\/\//), 'Continue')
				break

			case StepNames.CHOOSE_CATEGORIES:
				backButton.offClick(goBack)
				backButton.onClick(decrementStep)
				mainButton.toggle(createWishStore.category_ids.length > 0, 'Continue', 'Select at least 1')
				break

			case StepNames.SELECT_IMAGES:
				mainButton.toggle(createWishStore.images.length > 0, 'Continue', 'Select at least 1')
				break

			case StepNames.ADD_NAME:
				mainButton.toggle(!!createWishStore.name, 'Add title to continue')
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
		window.Telegram.WebApp.readTextFromClipboard(updateLink)
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
		const res = await fetch('https://ecom-scraper-api.mxksim.dev/extract-content', {
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
						value={createWishStore.url || ''}
						onInput={(e) => setCreateWishStore({ url: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>

				<Match when={step() === StepNames.CHOOSE_CATEGORIES}>
					<CategoriesSelect
						selectedCategories={createWishStore.category_ids}
						setSelectedCategories={(ids) => setCreateWishStore({ category_ids: ids })}
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
												<label class="relative rounded-2xl bg-secondary aspect-[3/4]">
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
													<Show when={createWishStore.images.find((i: any) => i.url === url)}>
														<div
															class="absolute inset-0 bg-black bg-opacity-20 flex items-start justify-end rounded-2xl p-3">
															<span
																class="text-xs font-medium bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center">
																	{createWishStore.images.findIndex((i: any) => i.url === url) + 1}
															</span>
														</div>
													</Show>
													<input
														type="checkbox"
														class="absolute size-fit opacity-0 cursor-pointer z-50"
														checked={!!createWishStore.images.find((i: any) => i.url === url)}
														onChange={(e) => {
															if (e.currentTarget.checked) {
																setCreateWishStore('images', [...createWishStore.images, {
																	url,
																	width: 0,
																	height: 0,
																	size: 0,
																}])
															} else {
																setCreateWishStore('images', createWishStore.images.filter((i: any) => i.url !== url))
															}
															window.Telegram.WebApp.HapticFeedback.selectionChanged()
														}}
													/>
												</label>
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
						value={createWishStore.name || ''}
						onInput={(e) => setCreateWishStore({ name: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>
				<Match when={step() === StepNames.ADD_PRICE}>
					<Select
						value={createWishStore.currency}
						onChange={(e) => setCreateWishStore({ currency: e })}
						options={['USD', 'EUR', 'RUB', 'THB']}
						itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
					>
						<SelectTrigger
							aria-label="Currency"
							class="size-12 rounded-full bg-secondary text-xs font-medium absolute right-4 top-4"
						>
							<SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
						</SelectTrigger>
						<SelectContent />
					</Select>
					<NumberField
						class="mt-12 flex w-36 flex-col gap-2"
						onRawValueChange={(value) => setCreateWishStore({ price: value })}
						maxValue={1000000}
						minValue={0}
						step={100}
					>
						<NumberFieldGroup>
							<NumberFieldInput />
							<NumberFieldIncrementTrigger />
							<NumberFieldDecrementTrigger />
						</NumberFieldGroup>
					</NumberField>
				</Match>
				<Match when={step() === StepNames.CONFIRM}>
					<div class="overflow-y-scroll w-full flex items-center justify-start flex-col">
						<button class="mx-10 mb-2 text-xl font-extrabold border"
										onClick={() => updateStep(StepNames.ADD_NAME, StepNames.CONFIRM)}
						>
							{createWishStore.name}
						</button>
						<button class="mx-10 border text-sm text-muted-foreground"
										onClick={() => updateStep(StepNames.ADD_PRICE, StepNames.CONFIRM)}>
							{createWishStore.price && createWishStore.currency ? formatPrice(createWishStore.price, createWishStore.currency) : 'Add price'}
						</button>
						<div class="mt-7 flex flex-col space-y-0.5 w-full items-center">
							<For each={createWishStore.images}>
								{(img) => (
									<div class="relative rounded-2xl bg-secondary aspect-[3/4]">
										<img
											src={img.url}
											alt=""
											loading="lazy"
											class="w-full h-auto max-h-[500px] object-contain rounded-2xl aspect-auto shrink-0 pointer-events-none select-none"
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
