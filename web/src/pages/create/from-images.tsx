import FormLayout from '~/components/form-layout'
import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import CategoriesSelect from '~/components/categories-select'
import { fetchAddWish } from '~/lib/api'
import { currencySymbol } from '~/lib/utils'
import { createWishStore, setCreateWishStore } from '~/pages/new'
import { FormTextArea } from '~/components/form-input'

export default function CreateFromImagePage() {
	const [step, setStep] = createSignal(1)

	const mainButton = useMainButton()

	const backButton = useBackButton()

	const onContinue = async () => {
		if (step() === 1) {
			setStep(step() + 1)
		} else if (step() === 2) {
			setStep(step() + 1)
		} else if (step() === 3) {

		} else {
			await fetchAddWish(createWishStore)
		}
	}

	function decrementStep() {
		setStep(step() - 1)
	}

	createEffect(() => {
		if (step() === 1) {
			backButton.hide()
			backButton.offClick(decrementStep)

			if (createWishStore.category_ids.length < 1) {
				mainButton.disable('Select at least 1')
			} else {
				mainButton.enable('Continue with chosen')
			}
		} else if (step() === 2) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			if (!createWishStore.name) {
				mainButton.disable('Add title to continue')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 3) {
			backButton.setVisible()
			backButton.onClick(decrementStep)
		}
	})

	onMount(() => {
		setCreateWishStore({ category_ids: [], name: null, price: null, currency: null })
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
			title: 'Select categories',
			description: 'Choose categories for the wish',
		},
		{
			title: 'Give name to the wish',
			description: 'Add title to the wish',
		},
		{
			title: 'Select images',
			description: 'Choose images to save',
		},
	]
	return (
		<FormLayout
			title={formHeaders[step() - 1].title}
			description={formHeaders[step() - 1].description}
			step={step()}
		>
			<Switch>
				<Match when={step() === 1}>
					<CategoriesSelect
						selectedCategories={createWishStore.category_ids}
						setSelectedCategories={(ids) => setCreateWishStore({ category_ids: ids })}
					/>
				</Match>
				<Match when={step() === 2}>
					<FormTextArea
						placeholder="Title"
						value={createWishStore.name || ''}
						onInput={(e) => setCreateWishStore({ name: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>
				<Match when={step() === 3}>
					<p class="text-xl font-extrabold">{createWishStore.name}</p>
					<Show when={createWishStore.price && createWishStore.currency}>
						<p class="text-lg text-secondary-foreground">
							{createWishStore.price} {currencySymbol(createWishStore.currency!)}
						</p>
					</Show>
					<Show when={!createWishStore.price || !createWishStore.currency}>
						<button
							class="bg-secondary w-full flex h-12 items-center justify-start gap-4 rounded-xl px-3 text-sm text-muted-foreground"
						>
							<span class="text-nowrap">Add price and currency</span>
						</button>
					</Show>
					<div class="flex flex-col space-y-0.5 w-full items-center">
						<For each={createWishStore.images}>
							{(img) => (
								<div
									class="size-full aspect-square bg-center bg-cover rounded-2xl"
									style={{ 'background-image': `url(${img.url})` }}
								/>
							)}
						</For>
					</div>
				</Match>
			</Switch>
		</FormLayout>
	)
}

