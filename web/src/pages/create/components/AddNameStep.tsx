import { Component } from 'solid-js'
import { FormTextArea } from '~/components/form-input'

interface AddNameStepProps {
  name: string | null
  onNameChange: (name: string) => void
}

const AddNameStep: Component<AddNameStepProps> = (props) => {
  return (
    <FormTextArea
      placeholder="start typing"
      value={props.name || ''}
      onInput={(e) => props.onNameChange(e.currentTarget.value)}
      autofocus={true}
    />
  )
}

export default AddNameStep
