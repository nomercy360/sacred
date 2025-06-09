import { createEffect, createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useNavigate } from '@solidjs/router'
import { addToast } from '~/components/toast'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import { createWish, CreateWishData, UpdateWishRequest } from '~/lib/api'
import { setStore } from '~/store'
import { FlowName, FlowNames, StepName, StepNames } from './types'
import { fetchMetadata, validateFiles } from './imageUtils'

export function useWishCreation() {
    const [updateWish, setUpdateWish] = createStore<UpdateWishRequest>({
        category_ids: [],
        url: null,
        name: null,
        currency: 'USD',
        notes: null,
        price: null,
    })
    const [selectedImageUrls, setSelectedImageUrls] = createSignal<string[]>([])
    const [selectedFiles, setSelectedFiles] = createSignal<File[]>([])
    const [activeFlow, setActiveFlow] = createSignal<FlowName>(
        FlowNames.START_WITH_LINK,
    )
    const [step, setStep] = createSignal<StepName>(StepNames.START_SCREEN)
    const [isLoading, setIsLoading] = createSignal(false)
    const [parsedImageUrls, setParsedImageUrls] = createSignal<string[]>([])
    const [isFetchingImages, setIsFetchingImages] = createSignal(false)

    const navigate = useNavigate()
    const mainButton = useMainButton()
    const backButton = useBackButton()

    const updateLink = (newLink: string) => {
        setUpdateWish({ url: newLink })
    }

    const updateName = (newName: string) => {
        setUpdateWish({ name: newName })
    }

    const updateCategories = (ids: string[]) => {
        setUpdateWish({ category_ids: ids })
    }

    createEffect(() => {
        switch (step()) {
            case StepNames.START_SCREEN:
                backButton.setVisible()
                backButton.onClick(decrementStep)
                if (!!updateWish.url?.match(/^https?:\/\//)) {
                    mainButton.enable('Continue')
                } else {
                    mainButton.disable('Enter valid link')
                }
                break

            case StepNames.CHOOSE_CATEGORIES:
                if (isLoading()) {
                    mainButton.disable('Add categories...')
                } else {
                    mainButton.toggle(
                        updateWish.category_ids.length > 0,
                        'Continue',
                        'Select at least 1',
                    )
                }
                break

            case StepNames.SELECT_IMAGES:
                if (isFetchingImages()) {
                    mainButton.disable('Loading...')
                } else if (selectedImageUrls().length > 0) {
                    mainButton.toggle(true, 'Continue')
                } else if (parsedImageUrls().length > 0) {
                    mainButton.disable('Select at least 1 image')
                } else {
                    mainButton.enable('Start Again')
                }
                break

            case StepNames.ADD_NAME:
                if (isLoading()) {
                    mainButton.disable('Loading...')
                } else {
                    mainButton.toggle(
                        !!updateWish.name,
                        'Continue',
                        'Add title to continue',
                    )
                }
                break

            case StepNames.EDIT_NAME:
                mainButton.toggle(
                    !!updateWish.name,
                    'Continue',
                    'Add title to continue',
                )
                break

            case StepNames.ADD_LINK:
                if (isLoading()) {
                    mainButton.disable('Loading...')
                } else {
                    mainButton.toggle(
                        !!updateWish.url?.match(/^https?:\/\//),
                        'Continue',
                    )
                }
                break

            case StepNames.CONFIRM:
                mainButton.hide()
                break
        }
    })

    // File handling
    const handleFileChange = async (event: any) => {
        const files = event.target.files

        if (!files || files.length === 0) return

        const validFiles = validateFiles(files)

        if (validFiles.length === 0) {
            addToast('No valid files were selected.')
            return
        }

        // If we're on the confirm step, just add the files without changing step
        if (step() === StepNames.CONFIRM) {
            setSelectedFiles(prevFiles => [...prevFiles, ...validFiles])
            // Clear the input to allow selecting the same files again
            event.target.value = ''
        } else {
            // Otherwise, we're starting a new flow
            setActiveFlow(FlowNames.START_WITH_PHOTOS)
            setSelectedFiles(validFiles)
            setStep(StepNames.CHOOSE_CATEGORIES)
        }
    }

    // Remove image from selection before submission
    function removeImage(index: number) {
        const urlImagesCount = selectedImageUrls().length

        if (index < urlImagesCount) {
            // Removing a URL image
            setSelectedImageUrls(urls => urls.filter((_, i) => i !== index))
        } else {
            // Removing a file image
            const fileIndex = index - urlImagesCount
            setSelectedFiles(files => files.filter((_, i) => i !== fileIndex))
        }
    }

    // Navigation and step flow
    const onContinue = async () => {
        if (isLoading()) return // Skip if already loading

        switch (step()) {
            case StepNames.START_SCREEN:
                const useUrl = activeFlow() === FlowNames.START_WITH_LINK
                if (!useUrl) return

                // If URL flow, fetch images from URL
                if (
                    useUrl &&
                    updateWish.url &&
                    updateWish.url.match(/^https?:\/\//)
                ) {
                    try {
                        setIsFetchingImages(true)
                        setStep(StepNames.CHOOSE_CATEGORIES)
                        const data = await fetchMetadata(updateWish.url)
                        // Update wish data with parsed information
                        if (data.product_name)
                            setUpdateWish({ name: data.product_name })
                        if (data.price) setUpdateWish({ price: data.price })
                        if (data.currency)
                            setUpdateWish({ currency: data.currency })
                        if (data.metadata['description'])
                            setUpdateWish({
                                notes: data.metadata['description'],
                            })
                        // Set the image URLs from the response
                        if (data.image_urls && data.image_urls.length > 0) {
                            setParsedImageUrls(data.image_urls)
                        }
                        return true
                    } catch (error) {
                        addToast(
                            'Failed to fetch images from URL. Please try again.',
                        )
                        setStep(StepNames.START_SCREEN)
                    } finally {
                        setIsFetchingImages(false)
                    }
                }
                break

            case StepNames.CHOOSE_CATEGORIES: {
                setIsLoading(true)

                const isPhotoFlow = activeFlow() === FlowNames.START_WITH_PHOTOS
                if (isPhotoFlow) {
                    setUpdateWish({ url: null })
                }

                const nextStep = isPhotoFlow
                    ? StepNames.ADD_NAME
                    : StepNames.SELECT_IMAGES

                setStep(nextStep)
                setIsLoading(false)
                break
            }

            case StepNames.SELECT_IMAGES:
                if (
                    selectedImageUrls().length === 0 &&
                    parsedImageUrls().length === 0
                ) {
                    setStep(StepNames.START_SCREEN)
                } else if (updateWish.name) {
                    setStep(StepNames.CONFIRM)
                } else {
                    setStep(StepNames.ADD_NAME)
                }
                break

            case StepNames.ADD_NAME:
                setStep(StepNames.CONFIRM)
                break

            case StepNames.EDIT_NAME:
                setStep(StepNames.CONFIRM)
                break

            case StepNames.ADD_LINK:
                setStep(StepNames.CONFIRM)
                break

            case StepNames.CONFIRM:
                // This is where we create the wish with all collected data
                setIsLoading(true)
                try {
                    window.Telegram.WebApp.MainButton.showProgress(false)

                    // Prepare wish data
                    const wishData: CreateWishData = {
                        name: updateWish.name || '',
                        category_ids: updateWish.category_ids,
                        url: updateWish.url || undefined,
                        price: updateWish.price || undefined,
                        currency: updateWish.currency || undefined,
                        notes: updateWish.notes || undefined,
                        image_urls:
                            selectedImageUrls().length > 0
                                ? selectedImageUrls()
                                : undefined,
                        photos:
                            selectedFiles().length > 0
                                ? selectedFiles()
                                : undefined,
                    }

                    // Create the wish
                    const { data, error } = await createWish(wishData)

                    if (error) {
                        addToast(`Failed to create wish: ${error}`)
                        return
                    }

                    setStore('wishes', old => [data, ...old])
                    navigate('/')
                } finally {
                    window.Telegram.WebApp.MainButton.hideProgress()
                    setIsLoading(false)
                }
                break
        }
    }

    const decrementStep = () => {
        switch (step()) {
            case StepNames.START_SCREEN:
                navigate('/')
                break

            case StepNames.CHOOSE_CATEGORIES:
                setStep(StepNames.START_SCREEN)
                break

            case StepNames.SELECT_IMAGES:
                setStep(StepNames.CHOOSE_CATEGORIES)
                break

            case StepNames.ADD_NAME:
                if (activeFlow() === FlowNames.START_WITH_PHOTOS) {
                    setStep(StepNames.CHOOSE_CATEGORIES)
                } else {
                    setStep(StepNames.SELECT_IMAGES)
                }
                break

            case StepNames.EDIT_NAME:
                setStep(StepNames.CONFIRM)
                break

            case StepNames.ADD_LINK:
                setStep(StepNames.CONFIRM)
                break

            case StepNames.CONFIRM:
                if (activeFlow() === FlowNames.START_WITH_PHOTOS) {
                    setStep(StepNames.ADD_NAME)
                } else {
                    setStep(StepNames.CHOOSE_CATEGORIES)
                }
                break
        }
    }

    // Setup button handlers and effects
    const setupButtons = () => {
        mainButton.onClick(onContinue)
        backButton.onClick(decrementStep)

        onCleanup(() => {
            mainButton.offClick(onContinue)
            mainButton.hide()
            backButton.offClick(decrementStep)
            backButton.hide()
        })
    }

    const formHeaders: Record<StepName, string | undefined> = {
        [StepNames.START_SCREEN]: 'Add the link',
        [StepNames.CHOOSE_CATEGORIES]: 'Choose categories',
        [StepNames.SELECT_IMAGES]: 'Select images',
        [StepNames.ADD_NAME]: 'Give name to the wish',
        [StepNames.EDIT_NAME]: 'Edit wish name',
        [StepNames.ADD_LINK]: 'Add link',
        [StepNames.CONFIRM]: undefined,
    }

    return {
        // State
        updateWish,
        setUpdateWish,
        urlImages: selectedImageUrls,
        setUrlImages: setSelectedImageUrls,
        activeFlow,
        setActiveFlow,
        step,
        setStep,
        parsedImageUrls,
        isLoading,
        setIsLoading,
        selectedFiles,

        // Functions
        updateLink,
        updateCategories,
        handleFileChange,
        setupButtons,
        isFetchingImages,
        onContinue,
        decrementStep,
        removeImage,
        // UI helpers
        formHeaders,
    }
}
