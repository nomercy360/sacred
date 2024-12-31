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
	NumberField, NumberFieldDecrementTrigger,
	NumberFieldGroup,
	NumberFieldIncrementTrigger,
	NumberFieldInput,
} from '~/components/ui/number-field'


export default function CreateFromImagesPage() {
	const [step, setStep] = createSignal(1)

	const navigate = useNavigate()

	const mainButton = useMainButton()

	const backButton = useBackButton()

	const onContinue = async () => {
		if (step() === 1) {
			setStep(step() + 1)
		} else if (step() === 2) {
			setStep(step() + 1)
		} else if (step() === 3) {
			setStep(step() + 1)
		} else if (step() === 4) {
			setStep(step() + 1)
		} else if (step() === 5) {
			window.Telegram.WebApp.MainButton.showProgress(false)
			const { data, error } = await fetchAddWish(createWishStore)
			window.Telegram.WebApp.MainButton.hideProgress()
			if (!error) {
				await queryClient.invalidateQueries({ queryKey: ['wishes'] })
				navigate('/')
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

			if (createWishStore.category_ids.length < 1) {
				mainButton.disable('Select at least 1')
			} else {
				mainButton.enable('Continue with chosen')
			}
		} else if (step() === 2) {
			if (!createWishStore.name) {
				mainButton.disable('Add title to continue')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 3) {
			if (!createWishStore.price) {
				mainButton.enable('Continue without price')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 4) {
			if (!createWishStore.url) {
				mainButton.enable('Continue without link')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 5) {
			mainButton.enable('Save & Publish')
		}
	})

	onMount(() => {
		setCreateWishStore({ category_ids: [], name: null, price: null, currency: 'USD', url: null })
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
			title: 'Choose categories',
		},
		{
			title: 'Give name to the wish',
		},
		{
			title: 'Add price',
		},
		{
			title: 'Add link',
		},
		{
			title: undefined,
		},
	]

	return (
		<FormLayout
			title={formHeaders[step() - 1].title}
			step={step()}
			maxSteps={6}
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
						placeholder="start typing"
						value={createWishStore.name || ''}
						onInput={(e) => setCreateWishStore({ name: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>
				<Match when={step() === 3}>
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
				<Match when={step() == 4}>
					<FormTextArea
						placeholder="start typing"
						value={createWishStore.url || ''}
						onInput={(e) => setCreateWishStore({ url: e.currentTarget.value })}
						autofocus={true}
					/>
				</Match>
				<Match when={step() == 5}>
					<div class="overflow-y-scroll w-full flex items-center justify-start flex-col">
						<button
							class="w-full flex flex-col items-center justify-center"
							onClick={() => setStep(2)}
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
							<For each={createWishStore.images}>
								{(img) => (
									<div
										class="size-full bg-center bg-cover rounded-2xl"
										style={{ 'background-image': `url(${img.url})`, 'aspect-ratio': `${img.width}/${img.height}` }}
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
