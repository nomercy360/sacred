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
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DrawerFooter,
	DrawerClose,
} from '~/components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

type MetadataResponse = {
	image_urls: string[]
	metadata: {
		[key: string]: string
	}
}

export default function CreateFromLinkPage() {
	const [link, setLink] = createSignal('')

	const [step, setStep] = createSignal(1)

	const navigate = useNavigate()

	const mainButton = useMainButton()

	const backButton = useBackButton()

	const [selectedImages, setSelectedImages] = createSignal<string[]>([])

	const [drawerOpen, setDrawerOpen] = createSignal<boolean>(false)

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
				} else {
					setDrawerOpen(true)
				}
			})
		} else if (step() === 2) {
			setStep(step() + 1)
		} else if (step() === 3) {
			if (createWishStore.name) {
				setStep(step() + 1)
			}
		} else if (step() === 4) {
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
		} else if (step() === 5) {
			setStep(step() + 1)
		} else if (step() === 6) {
			setStep(4)
			setDrawerOpen(false)
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
				mainButton.enable('Save & Publish')
			}
		} else if (step() === 5) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			if (!createWishStore.name) {
				mainButton.disable('Add title to continue')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 6) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			if (!createWishStore.price) {
				mainButton.enable('Continue without price')
			} else {
				mainButton.enable('Continue')
			}
		}
	})

	onMount(() => {
		setCreateWishStore({ images: [], category_ids: [], name: null, price: null, currency: null })
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
			title: 'Review and save',
		},
		{
			title: 'Review and save',
		},
		{
			title: 'Review and save',
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
				<Match when={step() >= 4}>
					<Drawer
						open={drawerOpen()}
					>
						<div class="overflow-y-scroll w-full flex items-center justify-start flex-col">
							<DrawerTrigger class="flex flex-col items-center justify-center"
														 onClick={() => {
															 setDrawerOpen(true)
															 setStep(5)
														 }}
							>
								<span class="text-xl font-extrabold">
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
							</DrawerTrigger>
							<div class="flex flex-col space-y-0.5 w-full items-center">
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
						<DrawerContent class="h-[90vh]">
							<div class="mx-auto w-full max-w-sm">
								<DrawerHeader class="relative">
									<div class="absolute top-0 left-0 w-full flex flex-row justify-between items-center">
										<DrawerClose class="flex items-center justify-center bg-secondary rounded-full size-10"
																 onClick={() => setDrawerOpen(false)}>
											<span class="material-symbols-rounded text-[20px]">
												close
											</span>
										</DrawerClose>
										<Show when={step() === 6}>
											<Select
												value={createWishStore.currency}
												onChange={(e) => setCreateWishStore({ currency: e })}
												options={['USD', 'EUR', 'RUB', 'THB']}
												itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
											>
												<SelectTrigger
													aria-label="Currency"
													class="size-10 rounded-full"
												>
													<SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
												</SelectTrigger>
												<SelectContent />
											</Select>
										</Show>
									</div>
									<DrawerTitle>
										{step() === 5 ? 'Edit title' : 'Edit Price'}
									</DrawerTitle>
								</DrawerHeader>
								<div class="p-4 pb-0">
									<Show when={step() === 5}>
										<FormTextArea
											placeholder="start typing"
											value={createWishStore.name || ''}
											onInput={(e) => setCreateWishStore({ name: e.currentTarget.value })}
											autofocus={true}
										/>
									</Show>
									<Show when={step() === 6}>
										<FormInput
											type="number"
											placeholder="Price"
											value={createWishStore.price || ''}
											onInput={(e) => setCreateWishStore({ price: parseFloat(e.currentTarget.value) })}
											autofocus={true}
										/>
									</Show>
								</div>
							</div>
						</DrawerContent>
					</Drawer>
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
