import { createEffect, onCleanup, createSignal } from 'solid-js'
import { cn } from '~/lib/utils'

function OnboardingPopup(props: { onClose: () => void }) {
    const texts = [
        {
            title: 'Explore ideas',
            description:
                'Need legal or career advice? Just type your message in the chat!',
        },
        {
            title: 'Save them',
            description:
                'Need legal or career advice? Just type your message in the chat!',
        },
        {
            title: 'Peep others',
            description:
                'Need legal or career advice? Just type your message in the chat!',
        },
        {
            title: 'Upload things',
            description:
                'Need legal or career advice? Just type your message in the chat!',
        },
    ]

    const [popupRef, setPopupRef] = createSignal<HTMLDivElement | null>(null)
    const [step, setStep] = createSignal(0)

    const tabs = [
        { icon: 'search' },
        { icon: 'note_stack' },
        { icon: 'people' },
        { icon: 'add_circle' },
    ]

    function handleClickOutside(event: MouseEvent) {
        if (popupRef() && !popupRef()?.contains(event.target as Node)) {
            props.onClose()
        }
    }

    createEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        onCleanup(() => {
            document.removeEventListener('mousedown', handleClickOutside)
        })
    })

    function onNext() {
        if (step() === 3) {
            props.onClose()
            return
        }
        setStep(step() + 1)
        window.Telegram.WebApp.HapticFeedback.selectionChanged()
    }

    return (
        <div class="fixed inset-0 z-50 flex h-screen w-full flex-col justify-end backdrop-blur-lg">
            <div
                class="flex h-[300px] animate-slide-up flex-col items-center justify-between rounded-t-2xl bg-background px-4 pb-12 pt-4"
                ref={setPopupRef}
            >
                <div class="flex w-full flex-row items-center justify-between">
                    <button
                        onClick={props.onClose}
                        class="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            close
                        </span>
                    </button>
                    <button
                        class="flex h-10 items-center justify-center rounded-2xl bg-secondary px-3 text-secondary-foreground"
                        onClick={onNext}
                    >
                        {step() === 3 ? 'Close' : 'Next'}
                    </button>
                </div>
                <div class="flex max-w-[270px] flex-col items-center justify-center gap-1 text-center">
                    <p class="text-xl font-extrabold">{texts[step()].title}</p>
                    <p class="text-secondary-foreground">
                        {texts[step()].description}
                    </p>
                </div>
                <div class="flex flex-row justify-center space-x-7 rounded-full bg-white p-1 px-2 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
                    {tabs.map(({ icon }, index) => (
                        <span
                            class={cn(
                                'flex size-10 flex-col items-center justify-center text-sm text-[#BABABA]',
                                {
                                    'bg-none': step() === index,
                                },
                            )}
                        >
                            <span
                                class={cn(
                                    'material-symbols-rounded text-[22px]',
                                    { 'text-black': step() === index },
                                )}
                            >
                                {icon}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default OnboardingPopup
