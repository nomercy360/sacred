import { Match, onMount, Switch } from 'solid-js'
import FormLayout from '~/components/form-layout'
import { StepNames } from './components/types'
import { useWishCreation } from './components/useWishCreation'
import { useButtonStates } from './components/useButtonStates'
import AddLinkStep from './components/AddLinkStep'
import CategoriesStep from './components/CategoriesStep'
import SelectImagesStep from './components/SelectImagesStep'
import AddNameStep from './components/AddNameStep'
import ConfirmStep from './components/ConfirmStep'

export default function CreateFromLinkPage() {
	const {
		updateWish,
		setUpdateWish,
		urlImages,
		setUrlImages,
		uploadImages,
		step,
		metaWithImages,
		setupButtons,
		handleFileChange,
		formHeaders,
		decrementStep,
	} = useWishCreation()

	useButtonStates({
		step,
		updateWish,
		urlImages,
		decrementStep,
	})

	onMount(() => {
		setupButtons()
	})

	return (
		<FormLayout
			title={formHeaders[step()]}
			step={Object.values(StepNames).indexOf(step()) + 1}
			maxSteps={6}
		>
			<Switch>
				{/* Link Input Step */}
				<Match when={step() === StepNames.ADD_LINK}>
					<AddLinkStep
						url={updateWish.url}
						onUrlChange={(url) => setUpdateWish({ url })}
						onFileUpload={handleFileChange}
					/>
				</Match>

				{/* Categories Selection Step */}
				<Match when={step() === StepNames.CHOOSE_CATEGORIES}>
					<CategoriesStep
						selectedCategories={updateWish.category_ids}
						setSelectedCategories={(ids) => setUpdateWish({ category_ids: ids })}
					/>
				</Match>

				{/* Image Selection Step */}
				<Match when={step() === StepNames.SELECT_IMAGES}>
					<SelectImagesStep
						metaWithImages={metaWithImages()}
						urlImages={urlImages()}
						setUrlImages={setUrlImages}
					/>
				</Match>

				{/* Name Input Step */}
				<Match when={step() === StepNames.ADD_NAME}>
					<AddNameStep
						name={updateWish.name}
						onNameChange={(name) => setUpdateWish({ name })}
					/>
				</Match>

				{/* Confirmation Step */}
				<Match when={step() === StepNames.CONFIRM}>
					<ConfirmStep
						name={updateWish.name}
						price={updateWish.price}
						currency={updateWish.currency}
						uploadImages={uploadImages()}
						onNameClick={() => step() === StepNames.ADD_NAME}
						onPriceClick={() => step() === StepNames.ADD_PRICE}
					/>
				</Match>
			</Switch>
		</FormLayout>
	)
}
