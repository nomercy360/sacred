import { Match, onMount, Show, Switch } from 'solid-js'
import FormLayout from '~/components/form-layout'
import { StepNames } from './components/types'
import { useWishCreation } from './components/useWishCreation'
import StartStep from './components/StartStep'
import CategoriesStep from './components/CategoriesStep'
import SelectImagesStep from './components/SelectImagesStep'
import AddNameStep from './components/AddNameStep'
import EditName from './components/EditName'
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
    } = useWishCreation()

    onMount(() => {
        setupButtons()
    })

    const formatPrice = (price: number | null | undefined) => {
        if (price !== null && price !== undefined) {
            return `${price} ${updateWish.currency || 'USD'}`
        }
        return null
    }

    return (
        <FormLayout
            title={formHeaders[step()]}
            step={Object.values(StepNames).indexOf(step()) + 1}
            maxSteps={6}
        >
            <Show when={isLoading()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div class="flex flex-col items-center gap-3 rounded-xl p-5">
                        {/* Анимированный круг */}
                        <div class="relative h-8 w-8">
                            <div class="absolute inset-0 rounded-full border-2 border-white/20" />
                            <div class="absolute inset-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        </div>

                        {/* Текст */}
                        <p class="text-sm font-medium text-white">
                            {step() === StepNames.CONFIRM
                                ? 'Uploading your selection... '
                                : 'Finishing up...'}
                        </p>
                    </div>
                </div>
            </Show>

            <Switch>
                <Match when={step() === StepNames.START_SCREEN}>
                    <StartStep
                        url={updateWish.url}
                        onUrlChange={url => setUpdateWish({ url })}
                        onFileUpload={handleFileChange}
                    />
                </Match>

                <Match when={step() === StepNames.CHOOSE_CATEGORIES}>
                    <CategoriesStep
                        selectedCategories={updateWish.category_ids}
                        setSelectedCategories={ids =>
                            setUpdateWish({ category_ids: ids })
                        }
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
                        name={updateWish.name}
                        onNameChange={newName =>
                            setUpdateWish({ name: newName })
                        }
                    />
                </Match>

                <Match when={step() === StepNames.EDIT_NAME}>
                    <EditName
                        name={updateWish.name}
                        onNameChange={newName =>
                            setUpdateWish({ name: newName })
                        }
                    />
                </Match>

                <Match when={step() === StepNames.ADD_LINK}>
                    <AddLinkStep
                        link={updateWish.url}
                        onLinkChange={url => setUpdateWish({ url })}
                    />
                </Match>

                <Match when={step() === StepNames.CONFIRM}>
                    <ConfirmStep
                        price={formatPrice(updateWish.price)}
                        onFileUpload={handleFileChange}
                        onPublishClick={() => onContinue()}
                        name={updateWish.name}
                        link={updateWish.url}
                        imageUrls={urlImages()}
                        imageFiles={selectedFiles()}
                        onNameClick={() => setStep(StepNames.EDIT_NAME)}
                        onAddLinkClick={() => setStep(StepNames.ADD_LINK)}
                        onDeleteImage={index => removeImage(index)}
                    />
                </Match>
            </Switch>
        </FormLayout>
    )
}
