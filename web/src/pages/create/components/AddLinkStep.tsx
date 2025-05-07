import { Component } from 'solid-js'
import { FormTextArea } from '~/components/form-input'

interface AddNameStepProps {
	link: string | null
	onLinkChange: (name: string) => void
}

const AddLinkStep: Component<AddNameStepProps> = (props) => {
	return (
		<FormTextArea
			placeholder="start typing"
			value={props.link || ''}
			onInput={(e) => props.onLinkChange(e.currentTarget.value)}
			autofocus={true}
		/>
	)
}

export default AddLinkStep
