import { createEffect, onCleanup } from "solid-js"

import { createSignal } from "solid-js"
import { cn } from "~/lib/utils"

function OnboardingPopup(props: { onClose: () => void }) {
	const texts = [
		{
			title: 'Explore ideas',
			description: 'Need legal or career advice? Just type your message in the chat!',
		},
		{
			title: 'Save them',
			description: 'Need legal or career advice? Just type your message in the chat!',
		},
		{
			title: 'Peep others',
			description: 'Need legal or career advice? Just type your message in the chat!',
		},
		{
			title: 'Upload things',
			description: 'Need legal or career advice? Just type your message in the chat!',
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
		<div class="flex justify-end flex-col h-screen fixed inset-0 w-full backdrop-blur-lg z-50">
			<div
				class="items-center bg-background rounded-t-2xl px-4 pt-4 pb-12 flex flex-col justify-between h-[300px] animate-slide-up"
				ref={setPopupRef}
			>
				<div class="w-full flex flex-row items-center justify-between">
					<button
						onClick={props.onClose}
						class="text-secondary-foreground flex items-center justify-center bg-secondary rounded-full size-10"
					>
						<span class="material-symbols-rounded text-[20px]">close</span>
					</button>
					<button
						class="text-secondary-foreground flex items-center justify-center bg-secondary rounded-2xl px-3 h-10"
						onClick={onNext}
					>
						{step() === 3 ? 'Close' : 'Next'}
					</button>
				</div>
				<div class="max-w-[270px] text-center gap-1 flex flex-col items-center justify-center">
					<p class="text-xl font-extrabold">{texts[step()].title}</p>
					<p class="text-secondary-foreground">{texts[step()].description}</p>
				</div>
				<div
					class="flex justify-center  flex-row rounded-full p-1 space-x-7 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)] bg-white px-2">
					{tabs.map(({ icon }, index) => (
						<span
							class={cn('size-10 flex items-center justify-center flex-col text-sm text-[#BABABA]', {
								'bg-none': step() === index,
							})}
						>
							<span
								class={cn('material-symbols-rounded  text-[22px]', { 'text-black': step() === index })}
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