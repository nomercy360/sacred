export const StepNames = {
	START_SCREEN: 'START_SCREEN',
	CHOOSE_CATEGORIES: 'CHOOSE_CATEGORIES',
	SELECT_IMAGES: 'SELECT_IMAGES',
	ADD_NAME: 'ADD_NAME',
	ADD_LINK: 'ADD_LINK',
	CONFIRM: 'CONFIRM',
} as const

export type StepName = typeof StepNames[keyof typeof StepNames]

export const FlowNames = {
	START_WITH_LINK: 'START_WITH_LINK',
	START_WITH_PHOTOS: 'START_WITH_PHOTOS',
} as const

export type FlowName = typeof FlowNames[keyof typeof FlowNames]


