import FormLayout from '~/components/form-layout'
import { FormTextArea } from '~/components/form-input'
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
	NumberField, NumberFieldDecrementTrigger,
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

const testData = {
	'image_urls': [
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/ae1e9022-79fc-4f4a-ad62-d2bc9a651f43/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/5ee7aa85-4d1b-4486-959b-83b0bcc74ca7/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/0b866732-626b-4b1e-b0f3-634485f1e75c/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/327b4af6-5469-4dfb-ac71-549328d400e1/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/777c9d18-2c2e-4b72-8244-70dce5177b1f/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/f9949ff5-b536-41c0-a9bf-2440c3ef44be/AIR+FORCE+1+SP.png',
		'https://bat.bing.com/action/0?ti=137000483&Ver=2&mid=afcf2119-6da2-4657-8ce9-4f9fe1a88b5c&bo=3&sid=ed5bf490ca6511ef981337bbd4b0f342&vid=ed5d6cf0ca6511efa9e75dacbc27aac2&vids=1&msclkid=N&pi=918639831&lg=en&sw=800&sh=600&sc=24&tl=%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%97%E0%B9%89%E0%B8%B2%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B8%8A%E0%B8%B2%E0%B8%A2%20Nike%20Air%20Force%201%20SP%20Nike%20TH&kw=%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%97%E0%B9%89%E0%B8%B2%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B8%8A%E0%B8%B2%E0%B8%A2%20Nike%20Air%20Force%201%20SP&p=https%3A%2F%2Fwww.nike.com%2Fth%2Ft%2F%25E0%25B8%25A3%25E0%25B8%25AD%25E0%25B8%2587%25E0%25B9%2580%25E0%25B8%2597%25E0%25B9%2589%25E0%25B8%25B2%25E0%25B8%259C%25E0%25B8%25B9%25E0%25B9%2589-air-force-1-sp-T3G0Sg%2FHF8189-001&r=&lt=4096&evt=pageLoad&sv=1&asc=G&cdb=AQAQ&rn=911393',
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/f9949ff5-b536-41c0-a9bf-2440c3ef44be/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/0b866732-626b-4b1e-b0f3-634485f1e75c/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/777c9d18-2c2e-4b72-8244-70dce5177b1f/AIR+FORCE+1+SP.png',
		'https://idsync.rlcdn.com/458359.gif?partner_uid=36b8f361-af1e-4fd4-887b-bfce1b916a56',
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/db03acbc-190a-45d2-9a32-f93b29d7ad4b/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/ae1e9022-79fc-4f4a-ad62-d2bc9a651f43/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/5e334814-828a-4cf4-8b10-0f019c931941/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/5a9a19a2-0915-4b69-84e2-02dc3a735c1d/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/858f9194-f953-404e-a11d-3b680cdea91a/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/db39076f-cdf2-4557-bf64-b4b5a899578e/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/35e64fea-8bd1-4cab-9db3-739ae3b0523d/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/894583f7-c695-4417-a2a0-d5a8b48b72e0/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/db03acbc-190a-45d2-9a32-f93b29d7ad4b/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/db39076f-cdf2-4557-bf64-b4b5a899578e/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/1c1e845a-0ccb-400a-a25e-457e3b4fb665/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/73e8e508-458f-41bd-a338-fa72c2d9483b/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_default/82840e38-31a8-427b-a00f-f1eb9620e1ba/AIR+FORCE+1+SP.png',
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/1c1e845a-0ccb-400a-a25e-457e3b4fb665/AIR+FORCE+1+SP.png',
		'https://bat.bing.com/action/0?ti=137000483&Ver=2&mid=afcf2119-6da2-4657-8ce9-4f9fe1a88b5c&bo=4&sid=ed5bf490ca6511ef981337bbd4b0f342&vid=ed5d6cf0ca6511efa9e75dacbc27aac2&vids=0&msclkid=N&prodid=HF8189&pagetype=product&en=Y&p=https%3A%2F%2Fwww.nike.com%2Fth%2Ft%2F%25E0%25B8%25A3%25E0%25B8%25AD%25E0%25B8%2587%25E0%25B9%2580%25E0%25B8%2597%25E0%25B9%2589%25E0%25B8%25B2%25E0%25B8%259C%25E0%25B8%25B9%25E0%25B9%2589-air-force-1-sp-T3G0Sg%2FHF8189-001&sw=800&sh=600&sc=24&evt=custom&asc=G&cdb=AQAQ&rn=92315',
		'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/858f9194-f953-404e-a11d-3b680cdea91a/AIR+FORCE+1+SP.png',
	],
	'metadata': {
		'branch:deeplink:$deeplink_path': 'x-callback-url/product-details?style-color=HF8189-001',
		'description': '\u0e1e\u0e1a\u0e01\u0e31\u0e1a \u0e23\u0e2d\u0e07\u0e40\u0e17\u0e49\u0e32\u0e1c\u0e39\u0e49\u0e0a\u0e32\u0e22 Nike Air Force 1 SP \u0e44\u0e14\u0e49\u0e17\u0e35\u0e48 Nike.com  \u0e04\u0e37\u0e19\u0e1f\u0e23\u0e35\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07\u0e1f\u0e23\u0e35 \u0e40\u0e09\u0e1e\u0e32\u0e30\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07\u0e0b\u0e37\u0e49\u0e2d\u0e17\u0e35\u0e48\u0e23\u0e48\u0e27\u0e21\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23',
		'keywords': '\u0e23\u0e2d\u0e07\u0e40\u0e17\u0e49\u0e32\u0e1c\u0e39\u0e49\u0e0a\u0e32\u0e22 Nike Air Force 1 SP',
		'next-head-count': '22',
		'og:description': '\u0e1e\u0e1a\u0e01\u0e31\u0e1a \u0e23\u0e2d\u0e07\u0e40\u0e17\u0e49\u0e32\u0e1c\u0e39\u0e49\u0e0a\u0e32\u0e22 Nike Air Force 1 SP \u0e44\u0e14\u0e49\u0e17\u0e35\u0e48 Nike.com  \u0e04\u0e37\u0e19\u0e1f\u0e23\u0e35\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07\u0e1f\u0e23\u0e35 \u0e40\u0e09\u0e1e\u0e32\u0e30\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07\u0e0b\u0e37\u0e49\u0e2d\u0e17\u0e35\u0e48\u0e23\u0e48\u0e27\u0e21\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23',
		'og:image': 'https://static.nike.com/a/images/t_default/777c9d18-2c2e-4b72-8244-70dce5177b1f/AIR+FORCE+1+SP.png',
		'og:locale': 'th_TH',
		'og:site_name': 'Nike.com',
		'og:title': '\u0e23\u0e2d\u0e07\u0e40\u0e17\u0e49\u0e32\u0e1c\u0e39\u0e49\u0e0a\u0e32\u0e22 Nike Air Force 1 SP',
		'og:type': 'website',
		'og:url': 'https://www.nike.com/th/t/\u0e23\u0e2d\u0e07\u0e40\u0e17\u0e49\u0e32\u0e1c\u0e39\u0e49-air-force-1-sp-T3G0Sg/HF8189-001',
		'robots': 'index, follow',
		'viewport': 'width=device-width, initial-scale=1.0, maximum-scale=2.0',
	},
}

export default function CreateFromLinkPage() {
	const [step, setStep] = createSignal(1)

	const navigate = useNavigate()

	const mainButton = useMainButton()

	const backButton = useBackButton()

	const [selectedImages, setSelectedImages] = createSignal<string[]>([])

	function updateLink(newLink: string) {
		setCreateWishStore({ url: newLink })
	}

	const onContinue = async () => {
		if (step() === 1) {
			setStep(step() + 1)
			setMetaWithImages(null)
			fetchMetadata(createWishStore.url!).then((data) => {
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

	function goBack() {
		navigate('/new')
	}

	createEffect(() => {
		if (step() === 1) {
			backButton.setVisible()
			backButton.offClick(decrementStep)
			backButton.onClick(goBack)

			const linkRegex = /^(http|https):\/\/[^ "]+$/
			if (!linkRegex.test(createWishStore.url || '')) {
				mainButton.disable('Continue')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 2) {
			backButton.offClick(goBack)
			backButton.onClick(decrementStep)

			if (createWishStore.category_ids.length < 1) {
				mainButton.disable('Select at least 1')
			} else {
				mainButton.enable('Continue with chosen')
			}
		} else if (step() === 3) {
			if (metaWithImages() === null) {
				mainButton.disable('Loading...')
			} else if (selectedImages().length < 1) {
				mainButton.disable('Select at least 1')
			} else {
				mainButton.enable('Continue with chosen')
			}
		} else if (step() === 4) {
			if (!createWishStore.name) {
				mainButton.disable('Add title to continue')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 5) {
			if (!createWishStore.price) {
				mainButton.enable('Continue without price')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 6) {
			mainButton.enable('Save & Publish')
		}
	})

	onMount(() => {
		window.Telegram.WebApp.readTextFromClipboard(updateLink)
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
			title: 'Add price',
		},
		{
			title: undefined,
		},
	]

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
						value={createWishStore.url || ''}
						onInput={(e) => setCreateWishStore({ url: e.currentTarget.value })}
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
													<Show when={selectedImages().includes(url)}>
														<div
															class="absolute inset-0 bg-black bg-opacity-20 flex items-start justify-end rounded-2xl p-3">
															<span
																class="text-xs font-medium bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center">
																	{selectedImages().indexOf(url) + 1}
															</span>
														</div>
													</Show>
													<input
														type="checkbox"
														class="absolute size-fit opacity-0 cursor-pointer z-50"
														checked={selectedImages().includes(url)}
														onChange={(e) => {
															if (e.currentTarget.checked) {
																setSelectedImages([...selectedImages(), url])
															} else {
																setSelectedImages(selectedImages().filter((i) => i !== url))
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
				<Match when={step() == 4}>
					<FormTextArea
						placeholder="start typing"
						value={createWishStore.name || ''}
						onInput={(e) => setCreateWishStore({ name: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>
				<Match when={step() == 5}>
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
									<div class="relative rounded-2xl bg-secondary aspect-[3/4]">
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
