import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
