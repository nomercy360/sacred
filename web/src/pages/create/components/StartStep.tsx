import { FormTextArea } from '~/components/form-input'
import { Component } from 'solid-js'

interface AddLinkStepProps {
	url: string | null
	onUrlChange: (url: string) => void
	onFileUpload: (event: any) => void
}

const StartStep: Component<AddLinkStepProps> = (props) => {
	return (
		<>
			<label
				class="absolute top-8 right-5 text-center size-10 flex flex-col items-center justify-center bg-secondary rounded-full">
				<input
					type="file"
					class="sr-only w-full"
					placeholder="Enter image"
					accept="image/*"
					multiple
					onChange={props.onFileUpload}
				/>
				<span class="material-symbols-rounded text-base">
          add_a_photo
        </span>
			</label>
			<FormTextArea
				placeholder="https://nike.com/product/nike-air-max-90"
				value={props.url || ''}
				onInput={(e) => props.onUrlChange(e.currentTarget.value)}
				autofocus={true}
			/>
		</>
	)
}

export default StartStep
