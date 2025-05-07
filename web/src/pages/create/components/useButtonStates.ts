import { createEffect } from 'solid-js'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import { StepName, StepNames } from './types'
import { UpdateWishRequest } from '~/lib/api'

interface ButtonStateParams {
  step: () => StepName
  updateWish: UpdateWishRequest
  urlImages: () => string[]
  decrementStep: () => void
}

export function useButtonStates({ step, updateWish, urlImages, decrementStep }: ButtonStateParams) {
  const mainButton = useMainButton()
  const backButton = useBackButton()

  createEffect(() => {
    switch (step()) {
      case StepNames.ADD_LINK:
        backButton.setVisible()
        backButton.onClick(decrementStep)
        mainButton.toggle(!!updateWish.url?.match(/^https?:\/\//), 'Continue')
        break

      case StepNames.CHOOSE_CATEGORIES:
        mainButton.toggle(updateWish.category_ids.length > 0, 'Continue', 'Select at least 1')
        break

      case StepNames.SELECT_IMAGES:
        mainButton.toggle(urlImages().length > 0, 'Continue', 'Select at least 1')
        break

      case StepNames.ADD_NAME:
        mainButton.toggle(!!updateWish.name, 'Continue', 'Add title to continue')
        break

      case StepNames.ADD_PRICE:
        mainButton.enable('Continue')
        break

      case StepNames.CONFIRM:
        mainButton.enable('Save & Publish')
        break
    }
  })

  return {
    mainButton,
    backButton
  }
}