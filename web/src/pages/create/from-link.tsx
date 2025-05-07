import { Match, onMount, Switch } from 'solid-js'
import FormLayout from '~/components/form-layout'
import { StepNames } from './components/types'
import { useWishCreation } from './components/useWishCreation'
import StartStep from './components/StartStep'
import CategoriesStep from './components/CategoriesStep'
import SelectImagesStep from './components/SelectImagesStep'
import AddNameStep from './components/AddNameStep'
import ConfirmStep from './components/ConfirmStep'
import AddLinkStep from '~/pages/create/components/AddLinkStep'

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
		setStep,
		removeImage,
		onContinue,
	} = useWishCreation()

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
				<Match when={step() === StepNames.START_SCREEN}>
					<StartStep
						url={updateWish.url}
						onUrlChange={(url) => setUpdateWish({ url })}
						onFileUpload={handleFileChange}
					/>
				</Match>

				<Match when={step() === StepNames.CHOOSE_CATEGORIES}>
					<CategoriesStep
						selectedCategories={updateWish.category_ids}
						setSelectedCategories={(ids) => setUpdateWish({ category_ids: ids })}
					/>
				</Match>

				<Match when={step() === StepNames.SELECT_IMAGES}>
					<SelectImagesStep
						metaWithImages={metaWithImages()}
						urlImages={urlImages()}
						setUrlImages={setUrlImages}
					/>
				</Match>

				<Match when={step() === StepNames.ADD_NAME}>
					<AddNameStep
						name={updateWish.name}
						onNameChange={(name) => setUpdateWish({ name })}
					/>
				</Match>

				<Match when={step() === StepNames.ADD_LINK}>
					<AddLinkStep
						link={updateWish.url}
						onLinkChange={(url) => setUpdateWish({ url })}
					/>
				</Match>

				<Match when={step() === StepNames.CONFIRM}>
					<ConfirmStep
						onFileUpload={handleFileChange}
						onPublishClick={() => onContinue()}
						name={updateWish.name}
						link={updateWish.url}
						uploadImages={uploadImages()}
						onNameClick={() => setStep(StepNames.ADD_NAME)}
						onAddLinkClick={() => setStep(StepNames.ADD_LINK)}
						onDeleteImage={(id) => removeImage(id)}
					/>
				</Match>
			</Switch>
		</FormLayout>
	)
}
