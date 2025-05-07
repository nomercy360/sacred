export const StepNames = {
  ADD_LINK: 'ADD_LINK',
  ADD_SIMPLE_LINK: 'ADD_LINK',
  CHOOSE_CATEGORIES: 'CHOOSE_CATEGORIES',
  SELECT_IMAGES: 'SELECT_IMAGES',
  ADD_NAME: 'ADD_NAME',
  ADD_PRICE: 'ADD_PRICE',
  CONFIRM: 'CONFIRM',
} as const

export type StepName = typeof StepNames[keyof typeof StepNames]

export const FlowNames = {
  START_WITH_LINK: 'START_WITH_LINK',
  START_WITH_PHOTOS: 'START_WITH_PHOTOS',
} as const

export type FlowName = typeof FlowNames[keyof typeof FlowNames]

export type MetadataResponse = {
  image_urls: string[]
  metadata: {
    [key: string]: string
  }
}