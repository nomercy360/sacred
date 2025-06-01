import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useNavigate } from '@solidjs/router'
import { addToast } from '~/components/toast'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import {
	fetchAddWish,
	fetchUpdateWish,
	uploadWishPhotosByUrls,
	UpdateWishRequest,
	WishImage, deleteWishPhoto,
	createWishWithUrl, deleteWish,
} from '~/lib/api'
import { setStore } from '~/store'
import {
	FlowName,
	FlowNames,
	StepName,
	StepNames,
} from './types'
import { validateFiles } from './imageUtils'

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
	const [uploadedImages, setUploadedImages] = createSignal<WishImage[]>([])
	const [activeFlow, setActiveFlow] = createSignal<FlowName>(FlowNames.START_WITH_LINK)
	const [step, setStep] = createSignal<StepName>(StepNames.START_SCREEN)
	const [createdWishId, setCreatedWishId] = createSignal<string | null>(null)
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
					mainButton.toggle(updateWish.category_ids.length > 0, 'Continue', 'Select at least 1')
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
					mainButton.toggle(!!updateWish.name, 'Continue', 'Add title to continue')
				}
				break

			case StepNames.ADD_LINK:
				if (isLoading()) {
					mainButton.disable('Loading...')
				} else {
					mainButton.toggle(!!updateWish.url?.match(/^https?:\/\//), 'Continue')
				}
				break

			case StepNames.CONFIRM:
				mainButton.hide()
				break
		}
	})

	// File handling
	const handleFileChange = async (event: any) => {
		setActiveFlow(FlowNames.START_WITH_PHOTOS)
		const files = event.target.files

		if (!files || files.length === 0) return

		setIsLoading(true)
		mainButton.showProgress(false)

		const validFiles = validateFiles(files)

		if (validFiles.length === 0) {
			addToast('No valid files were selected.')
			mainButton.hideProgress()
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		mainButton.showProgress(false)
		const { data, error } = await fetchAddWish(validFiles)
		if (error) {
			addToast('Failed to upload files. Please try again.')
			mainButton.hideProgress()
			setIsLoading(false)
			return
		}

		setCreatedWishId(data.id)
		// Set uploaded images from response
		if (data.images && data.images.length > 0) {
			setUploadedImages(data.images)
		}

		if (uploadedImages().length == 1) {
			setStep(StepNames.CHOOSE_CATEGORIES)
		}

		mainButton.hideProgress()
		setIsLoading(false)
	}

	async function removeImage(id: string) {
		if (!createdWishId()) return
		await deleteWishPhoto(createdWishId()!, id)
		setUploadedImages((old) => old.filter((img) => img.id !== id))
	}

	// Navigation and step flow
	const onContinue = async () => {
		if (isLoading()) return // Пропускаем, если уже идет загрузка

		switch (step()) {
			case StepNames.START_SCREEN:
				const useUrl = activeFlow() === FlowNames.START_WITH_LINK
				if (!useUrl) return

				const wishId = createdWishId()
				if (wishId !== null) {
					await deleteWish(wishId)
				}

				// If URL flow, and we have a URL, use the new endpoint
				if (useUrl && updateWish.url && updateWish.url.match(/^https?:\/\//)) {
					try {
						setIsFetchingImages(true)
						setStep(StepNames.SELECT_IMAGES)
						const data = await createWishWithUrl(updateWish.url)
						setCreatedWishId(data.id)
						// Update wish data with parsed information
						if (data.name) setUpdateWish({ name: data.name })
						if (data.price) setUpdateWish({ price: data.price })
						if (data.currency) setUpdateWish({ currency: data.currency })
						if (data.notes) setUpdateWish({ notes: data.notes })
						// Set the image URLs from the response
						if (data.image_urls && data.image_urls.length > 0) {
							setParsedImageUrls(data.image_urls)
						}
						return true
					} catch (error) {
						addToast('Failed to create wish from URL. Please try again.')
					} finally {
						setIsFetchingImages(false)
					}
				}
				break

			case StepNames.CHOOSE_CATEGORIES:
				setIsLoading(true)
				if (activeFlow() === FlowNames.START_WITH_PHOTOS) {
					setUpdateWish({ url: null })
				}
				const nextStep = updateWish.name ? StepNames.CONFIRM : StepNames.ADD_NAME
				setStep(nextStep)
				setIsLoading(false)
				break

			case StepNames.SELECT_IMAGES:
				if (selectedImageUrls().length === 0 && parsedImageUrls().length === 0) {
					setStep(StepNames.START_SCREEN)
				} else if (selectedImageUrls().length > 0) {
					setIsLoading(true)
					try {
						window.Telegram.WebApp.MainButton.showProgress(true)

						if (selectedImageUrls().length > 0) {
							const { data, error } = await uploadWishPhotosByUrls(createdWishId()!, selectedImageUrls())

							if (error) {
								addToast(`Failed to upload images: ${error}`)
								return
							}

							setUploadedImages((old) => [...old, ...data])
						} else {
							// If no images selected, just proceed to next step
							// User might have received the "No images found" message
						}

						setStep(StepNames.CHOOSE_CATEGORIES)
					} catch (error) {
						console.error('Error uploading images:', error)
						addToast('Failed to upload images')
					} finally {
						window.Telegram.WebApp.MainButton.hideProgress()
						setIsLoading(false)
					}
				}
				break

			case StepNames.ADD_NAME:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.ADD_LINK:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.CONFIRM:
				setIsLoading(true)
				try {
					window.Telegram.WebApp.MainButton.showProgress(false)

					if (createdWishId()) {
						const { data, error } = await fetchUpdateWish(createdWishId()!, updateWish)

						if (error) {
							addToast(`Failed to update wish: ${error}`)
							return
						}

						setStore('wishes', (old) => [data, ...old])
						navigate('/')
					} else {
						addToast('Something went wrong. Please try again.')
					}
				} finally {
					window.Telegram.WebApp.MainButton.hideProgress()
					setIsLoading(false)
				}
				break
		}
	}

	const decrementStep = () => {       // где то в этом месте есть баг с кнопкой назад, надо будет потестить исправить.
		switch (step()) {
			case StepNames.START_SCREEN:
				navigate('/')
				break

			case StepNames.CHOOSE_CATEGORIES:
				setStep(StepNames.START_SCREEN)
				break

			case StepNames.SELECT_IMAGES:
				setStep(StepNames.START_SCREEN)
				break

			case StepNames.ADD_NAME:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.ADD_LINK:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.CONFIRM:
				setStep(StepNames.ADD_LINK)
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
		[StepNames.ADD_LINK]: 'Add link',
		[StepNames.CONFIRM]: undefined,
	}

	return {
		// State
		updateWish,
		setUpdateWish,
		urlImages: selectedImageUrls,
		setUrlImages: setSelectedImageUrls,
		uploadImages: uploadedImages,
		setUploadImages: setUploadedImages,
		activeFlow,
		setActiveFlow,
		step,
		setStep,
		parsedImageUrls,
		createdWishId,
		isLoading,
		setIsLoading,

		// Functions
		updateLink,
		updateName,
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
