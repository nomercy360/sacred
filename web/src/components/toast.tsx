import { createSignal, createEffect } from 'solid-js'

export const [toasts, setToasts] = createSignal<
	{ id: number; message: string, bottom?: string, color?: string, width?: string }[]
>([])

export const addToast = (message: string,  persistent = false, bottom = '90px', color = 'white', width = '250px') => {
	const id = Date.now()
	setToasts([...toasts(), { id, message, persistent, bottom, color, width }])

	// Remove the toast after 2 seconds
	setTimeout(() => {
		setToasts(toasts().filter(toast => toast.id !== id))
	}, 2000)
}

export const removeToast = (id: number) => {
	setToasts(toasts().filter(toast => toast.id !== id))
}


const Toast = ({ children }: { children: string, bottom?: string, color?: string, width?: string }) => {
	createEffect(() => {
		const currentToasts = toasts()
		if (currentToasts.length > 5) {
			const newToasts = currentToasts.slice(1)
			setToasts(newToasts)
		}
	})

	return (
		<div class={`fixed inset-x-0 flex justify-center items-center text-center z-[999] pointer-events-none`}>
			<div class="pointer-events-auto space-y-2">
				{toasts().map(toast => (
					toast.message.length > 10 ? (
						<div class="flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium "
						 style={{width: toast.width || 'auto', position: 'fixed', bottom: toast.bottom || '90px',  left: '50%', transform: 'translateX(-50%)', color: toast.color || 'white'}}>
							<span class="material-symbols-rounded mr-2 text-[20px] text-white">
								info
							</span>
							{toast.message}
						</div>
					) : (
						<div class={`flex w-auto items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium`} style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: toast.bottom || '90px', color: toast.color || 'white' }}>
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
