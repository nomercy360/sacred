import { createSignal, createEffect, onCleanup } from 'solid-js'

export const [toasts, setToasts] = createSignal<
	{ id: number; message: string }[]
>([])

export const addToast = (message: string) => {
	const id = Date.now()
	setToasts([...toasts(), { id, message }])

	// Remove the toast after 3 seconds
	setTimeout(() => {
		setToasts(toasts().filter(toast => toast.id !== id))
	}, 2000)
}

const Toast = () => {
	createEffect(() => {
		const currentToasts = toasts()
		if (currentToasts.length > 5) {
			const newToasts = currentToasts.slice(1)
			setToasts(newToasts)
		}
	})

	return (
		<div class="fixed top-4 left-1/2 -translate-x-1/2 transform space-y-2">
			{toasts().map(toast => (
				<div
					class="z-[999] flex w-[calc(100vw-2rem)] items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
					<span class="material-symbols-rounded mr-2 text-[20px] text-green-600">
						check_circle
					</span>
					{toast.message}
				</div>
			))}
		</div>
	)
}

export default Toast
