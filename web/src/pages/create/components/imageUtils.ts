import { WishImage } from '~/lib/api'
import { addToast } from '~/components/toast'

/**
 * Validates files for upload
 * @param files Files to validate
 * @param maxSize Maximum file size in bytes (default 7MB)
 * @returns Array of valid files
 */
export function validateFiles(files: FileList, maxSize: number = 1024 * 1024 * 7): File[] {
	const validFiles: File[] = []

	for (const file of files) {
		if (file.size > maxSize) {
			addToast(
				`File ${file.name} is too large. Try to select a smaller file.`,
			)
			continue
		}
		validFiles.push(file)
	}

	return validFiles
}

/**
 * Splits an array of images into two columns
 * @param images Array of image URLs
 * @returns Array of two arrays containing the split images
 */
export function splitImages(images: string[]): string[][] {
	const middle = Math.ceil(images.length / 2)
	return [images.slice(0, middle), images.slice(middle)]
}


export type MetadataResponse = {
	image_urls: string[]
	currency?: string
	price?: number
	product_name?: string
	metadata: {
		[key: string]: string
	}
}

/**
 * Fetches metadata from a URL
 * @param url URL to fetch metadata from
 * @returns Promise resolving to metadata response
 */
export async function fetchMetadata(url: string): Promise<MetadataResponse> {
	const res = await fetch(import.meta.env.VITE_SCRAPER_URL + '/extract-content', {
		method: 'POST',
		body: JSON.stringify({ url }),
		headers: {
			'Content-Type': 'application/json',
		},
	})

	return res.json()
}

/**
 * Processes an image file for upload
 * @param file File to process
 * @param uploadCallback Callback function to handle the upload
 * @returns Promise resolving when upload is complete
 */
export function processImageFile(file: File, uploadCallback: (file: File) => Promise<WishImage | null>): Promise<WishImage | null> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()

		reader.onload = () => {
			const img = new Image()

			img.onload = async () => {
				try {
					const result = await uploadCallback(file)
					resolve(result)
				} catch (err) {
					console.error(`Error uploading ${file.name}:`, err)
					reject(err)
				}
			}

			img.src = reader.result as string
		}

		reader.readAsDataURL(file)
	})
}
