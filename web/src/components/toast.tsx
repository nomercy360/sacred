import { createEffect, createSignal, For } from 'solid-js'

type Toast = {
    message: string
    bottom?: string
    color?: string
    width?: string
}

const [toasts, setToasts] = createSignal<Toast[]>([])

export const addToast = (
    message: string,
    autoClose = true,
    bottom = '90px',
    color = 'white',
    width = 'auto',
) => {
    setToasts(prev => [...prev, { message, bottom, color, width }])
    if (autoClose) {
        setTimeout(() => {
            setToasts(prev => prev.slice(1))
        }, 2000)
    }
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
        <div class="pointer-events-none fixed inset-x-0 z-[999] flex items-center justify-center text-center">
            <div class="pointer-events-auto space-y-2">
                <For each={toasts()}>
                    {toast =>
                        toast.message.length > 10 ? (
                            <div
                                class="flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium"
                                style={{
                                    width: toast.width,
                                    position: 'fixed',
                                    bottom: toast.bottom,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: toast.color,
                                }}
                            >
                                <span class="material-symbols-rounded mr-2 text-[20px] text-white">
                                    info
                                </span>
                                {toast.message}
                            </div>
                        ) : (
                            <div
                                class="flex w-auto items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium"
                                style={{
                                    position: 'fixed',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bottom: toast.bottom,
                                    color: toast.color,
                                }}
                            >
                                {toast.message}
                                <span class="material-symbols-rounded text-[20px] text-white">
                                    check
                                </span>
                            </div>
                        )
                    }
                </For>
            </div>
        </div>
    )
}

export default Toast
