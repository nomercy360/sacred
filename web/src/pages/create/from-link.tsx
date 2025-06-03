import { Match, onMount, Show, Switch } from 'solid-js'
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
		parsedImageUrls,
		step,
		setupButtons,
		handleFileChange,
		isFetchingImages,
		formHeaders,
		setStep,
		removeImage,
		onContinue,
		isLoading,
		selectedFiles,
		setWishName,
		wishName,
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
			<Show when={isLoading()}>
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
					<div class="bg-black text-white rounded-xl shadow-md px-4 py-3 flex items-center gap-3">
						<div class="h-4 w-4 rounded-full animate-spin"></div>
						<span class="text-sm">
							{step() === StepNames.CONFIRM ? 'Finishing up...' : 'Uploading your selection…'}
						</span>
					</div>
				</div>
			</Show>

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
						isLoading={isFetchingImages()}
						parsedImageUrls={parsedImageUrls()}
						urlImages={urlImages()}
						setUrlImages={setUrlImages}
					/>
				</Match>

				<Match when={step() === StepNames.ADD_NAME}>
					<AddNameStep
						name={wishName()}
						onNameChange={(name) => setWishName(name)}
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
						imageUrls={urlImages()}
						imageFiles={selectedFiles()}
						onNameClick={() => setStep(StepNames.ADD_NAME)}
						onAddLinkClick={() => setStep(StepNames.ADD_LINK)}
						onDeleteImage={(index) => removeImage(index)}
					/>
				</Match>
			</Switch>
		</FormLayout>
	)
}
