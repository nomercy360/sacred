import { createSignal, onCleanup, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useNavigate } from '@solidjs/router'
import { addToast } from '~/components/toast'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import {
	fetchAddWish,
	fetchUpdateWish,
	uploadWishPhoto,
	uploadWishPhotosByUrls,
	UpdateWishRequest,
	WishImage,
} from '~/lib/api'
import { setStore } from '~/store'
import {
	FlowName,
	FlowNames,
	MetadataResponse,
	StepName,
	StepNames,
} from './types'
import { fetchMetadata, processImageFile, validateFiles } from './imageUtils'

export function useWishCreation() {
	const [updateWish, setUpdateWish] = createStore<UpdateWishRequest>({
		category_ids: [],
		url: null,
		name: null,
		currency: 'USD',
		notes: null,
		price: null,
	})
	const [urlImages, setUrlImages] = createSignal<string[]>([])
	const [uploadImages, setUploadImages] = createSignal<WishImage[]>([])
	const [activeFlow, setActiveFlow] = createSignal<FlowName>(FlowNames.START_WITH_LINK)
	const [step, setStep] = createSignal<StepName>(StepNames.ADD_LINK)
	const [metaWithImages, setMetaWithImages] = createSignal<MetadataResponse | null>(null)
	const [createdWishId, setCreatedWishId] = createSignal<string | null>(null)

	const navigate = useNavigate()
	const mainButton = useMainButton()
	const backButton = useBackButton()

	// Helper functions
	const updateLink = (newLink: string) => {
		setUpdateWish({ url: newLink })
	}

	const updateName = (newName: string) => {
		setUpdateWish({ name: newName })
	}

	const updateCategories = (ids: string[]) => {
		setUpdateWish({ category_ids: ids })
	}

	const createWishIfNeeded = async () => {
		if (!createdWishId()) {
			const { data, error } = await fetchAddWish()
			if (error) {
				addToast('Failed to create wish. Please try again.')
				return false
			}
			setCreatedWishId(data.id)
			return true
		}
		return true
	}

	// File handling
	const handleFileChange = async (event: any) => {
		setActiveFlow(FlowNames.START_WITH_PHOTOS)
		const files = event.target.files

		if (!files || files.length === 0) return

		mainButton.showProgress(false)
		const validFiles = validateFiles(files)

		if (validFiles.length === 0) {
			addToast('No valid files were selected.')
			mainButton.hideProgress()
			return
		}

		try {
			const success = await createWishIfNeeded()
			if (!success) return

			const wishId = createdWishId()!
			const newImages = [] as WishImage[]

			for (const file of validFiles) {
				const uploadCallback = async (file: File) => {
					const { data, error } = await uploadWishPhoto(wishId, file)
					if (error) {
						console.error(`Error uploading photo for ${file.name}:`, error)
						return null
					}
					return data
				}

				const result = await processImageFile(file, uploadCallback)
				if (result) newImages.push(result)
			}

			if (newImages.length > 0) {
				setUploadImages((old) => [...old, ...newImages])
				setStep(StepNames.CHOOSE_CATEGORIES)
			} else {
				addToast('Failed to upload files.')
			}
		} finally {
			mainButton.hideProgress()
		}
	}

	// Navigation and step flow
	const onContinue = async () => {
		switch (step()) {
			case StepNames.ADD_LINK:
				setStep(StepNames.CHOOSE_CATEGORIES)
				setMetaWithImages(null)
				await createWishIfNeeded()
				const data = await fetchMetadata(updateWish.url!)
				setMetaWithImages(data)
				const title = data.metadata['og:title'] || data.metadata['title']
				if (title) setUpdateWish({ name: title })
				break

			case StepNames.CHOOSE_CATEGORIES:
				const nextStep = activeFlow() === FlowNames.START_WITH_LINK ? StepNames.SELECT_IMAGES : StepNames.ADD_NAME
				setStep(nextStep)
				break

			case StepNames.SELECT_IMAGES:
				window.Telegram.WebApp.MainButton.showProgress(true)
				if (urlImages().length > 0) {
					const { data, error } = await uploadWishPhotosByUrls(createdWishId()!, urlImages())

					if (error) {
						addToast(`Failed to upload images: ${error}`)
						return
					}

					setUploadImages((old) => [...old, ...data])
				}
				window.Telegram.WebApp.MainButton.hideProgress()
				if (updateWish.name) {
					setStep(StepNames.CONFIRM)
				} else {
					setStep(StepNames.ADD_NAME)
				}
				break

			case StepNames.ADD_NAME:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.ADD_PRICE:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.CONFIRM:
				try {
					window.Telegram.WebApp.MainButton.showProgress(false)

					if (createdWishId()) {
						const { data, error } = await fetchUpdateWish(createdWishId()!, updateWish)

						if (error) {
							addToast(`Failed to update wish: ${error}`)
							return
						}

						setStore('wishes', (old) => [...old, data])
						navigate('/')
					} else {
						addToast('Something went wrong. Please try again.')
					}
				} finally {
					window.Telegram.WebApp.MainButton.hideProgress()
				}
				break
		}
	}

	const decrementStep = () => {
		switch (step()) {
			case StepNames.ADD_LINK:
				navigate('/')
				break

			case StepNames.CHOOSE_CATEGORIES:
				setStep(StepNames.ADD_LINK)
				break

			case StepNames.SELECT_IMAGES:
				setStep(StepNames.CHOOSE_CATEGORIES)
				break

			case StepNames.ADD_NAME:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.ADD_PRICE:
				setStep(StepNames.CONFIRM)
				break

			case StepNames.CONFIRM:
				setStep(StepNames.ADD_PRICE)
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

	// Header titles for each step
	const formHeaders: Record<StepName, string | undefined> = {
		[StepNames.ADD_LINK]: 'Add the link',
		[StepNames.CHOOSE_CATEGORIES]: 'Choose categories',
		[StepNames.SELECT_IMAGES]: 'Select images',
		[StepNames.ADD_NAME]: 'Give name to the wish',
		[StepNames.ADD_PRICE]: 'Add price',
		[StepNames.CONFIRM]: undefined,
	}

	// Return all values and functions needed by the component
	return {
		// State
		updateWish,
		setUpdateWish,
		urlImages,
		setUrlImages,
		uploadImages,
		setUploadImages,
		activeFlow,
		setActiveFlow,
		step,
		setStep,
		metaWithImages,
		createdWishId,

		// Functions
		updateLink,
		updateName,
		updateCategories,
		handleFileChange,
		setupButtons,
		onContinue,
		decrementStep,

		// UI helpers
		formHeaders,
	}
}
