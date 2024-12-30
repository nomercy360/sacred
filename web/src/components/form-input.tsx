import { createSignal, JSX, onMount } from 'solid-js'

type FormInputProps = JSX.InputHTMLAttributes<HTMLInputElement>

export default function FormInput(props: FormInputProps) {
	const [input, setInput] = createSignal<HTMLInputElement | null>(null)

	onMount(() => {
		if (input()) {
			input()?.focus()
		}
	})
	return (
		<input
			class="text-center text-2xl w-full h-20 px-4 mt-12 bg-transparent placeholder:text-secondary-foreground focus:outline-none focus:ring-0 focus:border-0"
			ref={setInput}
			autofocus={true}
			{...props}
		/>
	)
}

// textarea.tsx
type FormTextAreaProps = JSX.TextareaHTMLAttributes<HTMLTextAreaElement>

export function FormTextArea(props: FormTextAreaProps) {
	const [input, setInput] = createSignal<HTMLTextAreaElement | null>(null)

	onMount(() => {
		if (input()) {
			input()?.focus()
		}
	})

	return (
		<textarea
			class="resize-none text-center text-2xl w-full h-full px-4 mt-12 bg-transparent placeholder:text-secondary-foreground focus:outline-none focus:ring-0 focus:border-0"
			{...props}
			autofocus={true}
			ref={setInput}
		/>
	)
}
