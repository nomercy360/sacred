import FormLayout from '~/components/form-layout'
import FormInput, { FormTextArea } from '~/components/form-input'
import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import CategoriesSelect from '~/components/categories-select'
import { fetchAddWish } from '~/lib/api'
import { currencySymbol } from '~/lib/utils'
import { createWishStore, setCreateWishStore } from '~/pages/new'
import { queryClient } from '~/App'
import { useNavigate } from '@solidjs/router'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import {
	NumberField, NumberFieldDecrementTrigger, NumberFieldErrorMessage,
	NumberFieldGroup,
	NumberFieldIncrementTrigger,
	NumberFieldInput,
} from '~/components/ui/number-field'

type MetadataResponse = {
	image_urls: string[]
	metadata: {
		[key: string]: string
	}
}

type Currency = {
	value: string
	label: string
	disabled: boolean
}

const currencies: Currency[] = [
	{ value: 'USD', label: '$', disabled: false },
	{ value: 'EUR', label: '€', disabled: false },
	{ value: 'RUB', label: '₽', disabled: false },
	{ value: 'THB', label: '฿', disabled: false },
]

export default function CreateFromLinkPage() {
	const [link, setLink] = createSignal('')

	const [step, setStep] = createSignal(1)

	const navigate = useNavigate()

	const mainButton = useMainButton()

	const backButton = useBackButton()

	const [selectedImages, setSelectedImages] = createSignal<string[]>([])

	const onContinue = async () => {
		if (step() === 1) {
			setStep(step() + 1)
			setMetaWithImages(null)
			fetchMetadata(link()).then((data) => {
				setMetaWithImages(data)
				let title = null
				if (data.metadata['og:title']) {
					title = data.metadata['og:title']
				} else if (data.metadata['title']) {
					title = data.metadata['title']
				}

				if (title) {
					setCreateWishStore({ name: title })
				}
			})
		} else if (step() === 2) {
			setStep(step() + 1)
		} else if (step() === 3) {
			if (createWishStore.name) {
				setStep(6)
			} else {
				setStep(step() + 1)
			}
		} else if (step() === 4) {
			setStep(step() + 1)
		} else if (step() === 5) {
			setStep(step() + 1)
		} else if (step() === 6) {
			const images = selectedImages().map((url, i) => ({ url, width: 0, height: 0, size: 0 })) as {
				url: string,
				width: number,
				height: number,
				size: number
			}[]
			setCreateWishStore({ images })
			try {
				window.Telegram.WebApp.MainButton.showProgress(false)
				await fetchAddWish(createWishStore)
				await queryClient.invalidateQueries({ queryKey: ['wishes'] })
				navigate('/')
			} finally {
				window.Telegram.WebApp.MainButton.hideProgress()
			}
		}
	}

	function decrementStep() {
		setStep(step() - 1)
	}

	createEffect(() => {
		if (step() === 1) {
			backButton.hide()
			backButton.offClick(decrementStep)

			const linkRegex = /^(http|https):\/\/[^ "]+$/
			if (!linkRegex.test(link())) {
				mainButton.disable('Continue')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 2) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			if (createWishStore.category_ids.length < 1) {
				mainButton.disable('Select at least 1')
			} else {
				mainButton.enable('Continue with chosen')
			}
		} else if (step() === 3) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			if (metaWithImages() === null) {
				mainButton.disable('Loading...')
			} else if (selectedImages().length < 1) {
				mainButton.disable('Select at least 1')
			} else {
				mainButton.enable('Continue with chosen')
			}
		} else if (step() === 4) {
			backButton.setVisible()
			backButton.onClick(decrementStep)
			if (!createWishStore.name) {
				mainButton.disable('Add title to continue')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 5) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			if (!createWishStore.price) {
				mainButton.enable('Continue without price')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 6) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			mainButton.enable('Save & Publish')
		}
	})

	onMount(() => {
		setCreateWishStore({ images: [], category_ids: [], name: null, price: null, currency: 'USD' })
		mainButton.onClick(onContinue)
	})

	onCleanup(() => {
		mainButton.offClick(onContinue)
		mainButton.hide()
		backButton.offClick(decrementStep)
		backButton.hide()
	})

	const formHeaders = [
		{
			title: 'Fix the link',
		},
		{
			title: 'Choose categories',
		},
		{
			title: 'Select images',
		},
		{
			title: 'Give name to the wish',
		},
		{
			title: 'Add price and currency',
		},
		{
			title: undefined,
		},
	]

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

	const [metaWithImages, setMetaWithImages] = createSignal<MetadataResponse | null>(null)

	return (
		<FormLayout
			title={formHeaders[step() - 1].title}
			step={step()}
			maxSteps={6}
		>
			<Switch>
				<Match when={step() === 1}>
					<FormTextArea
						placeholder="https://nike.com/product/nike-air-max-90"
						value={link()}
						onInput={(e) => setLink(e.currentTarget.value)}
						autofocus={true}
					/>
				</Match>

				<Match when={step() === 2}>
					<CategoriesSelect
						selectedCategories={createWishStore.category_ids}
						setSelectedCategories={(ids) => setCreateWishStore({ category_ids: ids })}
					/>
				</Match>
				<Match when={step() === 3}>
					<Show when={metaWithImages()} fallback={<ImageGridLoader />}>
						<div class="grid grid-cols-2 gap-0.5 w-full overflow-y-scroll">
							<For each={metaWithImages()!.image_urls}>
								{(url) => (
									<div
										class="border border-border/60 relative w-full bg-center bg-cover aspect-square rounded-2xl"
										style={{ 'background-image': `url(${url})` }}
									>
										<Show when={selectedImages().includes(url)}>
											<div
												class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
												<span class="material-symbols-rounded text-white text-[24px]">check</span>
											</div>
										</Show>
										<input
											type="checkbox"
											class="absolute size-full opacity-0"
											checked={selectedImages().includes(url)}
											onChange={(e) => {
												if (e.currentTarget.checked) {
													setSelectedImages([...selectedImages(), url])
												} else {
													setSelectedImages(selectedImages().filter((i) => i !== url))
												}
											}}
										/>
									</div>
								)}
							</For>
						</div>
					</Show>
				</Match>
				<Match when={step() == 4}>
					<FormTextArea
						placeholder="start typing"
						value={createWishStore.name || ''}
						onInput={(e) => setCreateWishStore({ name: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>
				<Match when={step() == 5}>
					<div class="flex flex-row items-center justify-center space-x-4">
						<NumberField
							class="flex w-36 flex-col gap-2"
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
						<Select
							options={currencies}
							optionValue="value"
							optionTextValue="label"
							optionDisabled="disabled"
							selectedOption={currencies.find((c) => c.value === createWishStore.currency)}
							onSelectedOptionChange={(value: Currency) => setCreateWishStore({ currency: value.value })}
							itemComponent={(props) => (
								<SelectItem item={props.item}>
									{props.item.rawValue.label}
								</SelectItem>
							)}
						>
							<SelectTrigger aria-label="Currency" class="w-12">
								<SelectValue<Currency>>
									{(state) => state.selectedOption().label}
								</SelectValue>
							</SelectTrigger>
							<SelectContent />
						</Select>
					</div>
				</Match>
				<Match when={step() == 6}>
					<div class="overflow-y-scroll w-full flex items-center justify-start flex-col">
						<button
							class="w-full flex flex-col items-center justify-center"
							onClick={() => setStep(4)}
						>
							<span class="mb-2 text-xl font-extrabold">
								{createWishStore.name}
							</span>
							<Show when={createWishStore.price && createWishStore.currency}>
								<span class="text-sm text-muted-foreground">
									{createWishStore.price} {currencySymbol(createWishStore.currency!)}
								</span>
							</Show>
							<Show when={!createWishStore.price || !createWishStore.currency}>
								<span class="text-sm text-muted-foreground">
									Add price and currency
								</span>
							</Show>
						</button>
						<div class="mt-7 flex flex-col space-y-0.5 w-full items-center">
							<For each={selectedImages()}>
								{(url) => (
									<div
										class="size-full aspect-square bg-center bg-cover rounded-2xl"
										style={{ 'background-image': `url(${url})` }}
									/>
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
