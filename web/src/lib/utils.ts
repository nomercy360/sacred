import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Wish } from '~/lib/api'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}


// get currency symbol from currency code, USD -> $, RUB -> ₽, THB -> ฿, EUR -> €, GBP -> £
export function currencySymbol(currency: string) {
	switch (currency) {
		case 'USD':
			return '$'
		case 'RUB':
			return '₽'
		case 'THB':
			return '฿'
		case 'EUR':
			return '€'
		case 'GBP':
			return '£'
		default:
			return ''
	}
}

export function getDomainName(url: string): string | null {
	try {
		const parsedUrl = new URL(url)
		let domain = parsedUrl.hostname

		if (domain.startsWith('www.')) {
			domain = domain.slice(4)
		}

		return domain
	} catch (error) {
		return null
	}
}

export function getFirstImage(wish: Wish): { url: string; width: number; height: number } {
	if (wish.images && wish.images.length > 0 && wish.images[0]) {
		return wish.images[0]
	}
	return { url: '', width: 1, height: 1 }
}


export function splitIntoGroups(array: Wish[] | undefined, groupCount: number) {
	if (!array) return []
	const groups: Wish[][] = Array.from({ length: groupCount }, () => [])
	array.forEach((item, index) => groups[index % groupCount].push(item))
	return groups
}
