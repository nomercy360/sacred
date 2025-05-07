import { Component } from 'solid-js'
import { FormTextArea } from '~/components/form-input'

interface AddNameStepProps {
	link: string | null
	onLinkChange: (name: string) => void
}

const isValidUrl = (url: string) => /^https?:\/\/\S+\.\S+/.test(url)

const AddLinkStep: Component<AddNameStepProps> = (props) => {
	return (
		<FormTextArea
			placeholder="start typing"
			value={props.link || ''}
			onInput={(e) => {
				const value = e.currentTarget.value
				if (isValidUrl(value) || value === '') {
					props.onLinkChange(value)
				}
			}}
			autofocus={true}
		/>
	)
}

export default AddLinkStep
