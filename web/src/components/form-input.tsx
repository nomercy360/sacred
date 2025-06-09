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
            class="mt-12 h-20 w-full bg-transparent px-4 text-center text-2xl placeholder:text-secondary-foreground focus:border-0 focus:outline-none focus:ring-0"
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
            class="mt-12 h-full w-full resize-none bg-transparent px-4 text-center text-2xl placeholder:text-secondary-foreground focus:border-0 focus:outline-none focus:ring-0"
            {...props}
            autofocus={true}
            ref={setInput}
        />
    )
}
