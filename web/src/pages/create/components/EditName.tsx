import { Component, onCleanup } from 'solid-js'
import { FormTextArea } from '~/components/form-input'

interface EditNameProps {
	name: string | null
	onNameChange: (name: string) => void
}

const EditName: Component<EditNameProps> = (props) => {
	const initialName = props.name || ''

	onCleanup(() => {
		// if user clears the name, reset to initial value
		if (props.name?.trim() === '') {
			props.onNameChange(initialName)
		}
	})

	return (
		<FormTextArea
			placeholder="Enter wish name"
			value={props.name || ''}
			onInput={(e) => props.onNameChange(e.currentTarget.value)}
			autofocus={true}
		/>
	)
}

export default EditName
