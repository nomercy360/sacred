import { cn } from '~/lib/utils'
import { useLocation } from '@solidjs/router'
import { Link } from '~/components/link'
import { onMount } from 'solid-js'



export default function NavigationTabs(props: any) {
	const location = useLocation()

	const tabs = [
		{
			href: '/feed',
			icon: 'search',
		},
		{
			href: '/',
			icon: 'note_stack',
		},
		{
			href: '/people',
			icon: 'people',
		},
		{
			href: '/create/from-link',
			icon: 'add_circle',
		},
	]

	onMount(() => {
		window.Telegram.WebApp.ready()
	})

	function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
		try {
		  const haptic = window.Telegram?.WebApp?.HapticFeedback
		  if (haptic?.impactOccurred) {
			haptic.impactOccurred(type)
			console.log(`[Haptic] Triggered: ${type}`)
		  } else {
			console.warn('[Haptic] Not available')
		  }
		} catch (err) {
		  console.error('[Haptic] Error:', err)
		}
	  }


	return (
		<>
			<div
				class="flex flex-col items-center h-[85px] fixed bottom-0 w-full z-50"
			>
				<button onClick={() => triggerHaptic('heavy')}>
					Trigger Haptic
				</button>
				<div class="flex justify-center  flex-row rounded-full p-1 space-x-5 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)] bg-white px-2">
					{tabs.map(({ href, icon }) => (
						<Link
							href={href}
							state={{ from: location.pathname }}
							class={cn('size-10 flex items-center justify-center flex-col text-sm text-gray-400', {
								'bg-none': location.pathname === href,
							})}
							onClick={() => {
								triggerHaptic('heavy')
							}}
						>
							<span
								class={cn('material-symbols-rounded  text-[22px]', { 'text-black': location.pathname === href })}>
								{icon}
							</span>
						</Link>
					))}
				</div>
			</div>
			{props.children}
		</>

	)
}