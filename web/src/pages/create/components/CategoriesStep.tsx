import { Component } from 'solid-js'
import CategoriesSelect from '~/components/categories-select'

interface CategoriesStepProps {
  selectedCategories: string[]
  setSelectedCategories: (ids: string[]) => void
}

const CategoriesStep: Component<CategoriesStepProps> = (props) => {
  return (
    <CategoriesSelect
      selectedCategories={props.selectedCategories}
      setSelectedCategories={props.setSelectedCategories}
    />
  )
}

export default CategoriesStep
