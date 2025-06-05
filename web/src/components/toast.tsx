import { createSignal, createEffect } from 'solid-js'

export const [toasts, setToasts] = createSignal<
	{ id: number; message: string }[]
>([])

export const addToast = (message: string,  persistent = false) => {
	const id = Date.now()
	setToasts([...toasts(), { id, message, persistent }])

	// Remove the toast after 2 seconds
	setTimeout(() => {
		setToasts(toasts().filter(toast => toast.id !== id))
	}, 2000)
}

export const removeToast = (id: number) => {
	setToasts(toasts().filter(toast => toast.id !== id))
}


const Toast = ({ children }: { children: string }) => {
	createEffect(() => {
		const currentToasts = toasts()
		if (currentToasts.length > 5) {
			const newToasts = currentToasts.slice(1)
			setToasts(newToasts)
		}
	})

	return (
		<div class="fixed inset-x-0 bottom-[90px] flex justify-center items-center text-center z-[999] pointer-events-none">
			<div class="pointer-events-auto space-y-2">
				{toasts().map(toast => (
					toast.message.length > 10 ? (
						<div class="flex w-auto  items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-secondary">
							<span class="material-symbols-rounded mr-2 text-[20px] text-white">
								info
							</span>
							{toast.message}
						</div>
					) : (
						<div class="flex w-auto fixed bottom-[90px] left-[150px]  items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-secondary">
							{toast.message}
							<span class="material-symbols-rounded text-[20px] text-white">
								check
							</span>
						</div>
					)
				))}
			</div>
		</div>
	)
}

export default Toast
