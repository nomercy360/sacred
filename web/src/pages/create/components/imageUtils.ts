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
