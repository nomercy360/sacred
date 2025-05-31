import { cn } from '~/lib/utils'
import { useLocation } from '@solidjs/router'
import { Link } from '~/components/link'
import { onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { triggerHaptic } from '~/lib/triggerHaptic'



export default function NavigationTabs(props: any) {
	const location = useLocation()

	const navigate = useNavigate()

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

	return (
		<>
			<div
				class="flex flex-col items-center h-[85px] fixed bottom-0 w-full z-50"
			>
				<div class="flex justify-center  flex-row rounded-full p-1 space-x-5 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)] bg-white px-2">
					{tabs.map(({ href, icon }) => (
						<button
							type="button"
							class={cn('size-10 flex items-center justify-center flex-col text-sm text-gray-400 rounded-full', {
								'text-black': location.pathname === href,
							})}
							onClick={() => {
								triggerHaptic('heavy')
								navigate(href, { state: { from: location.pathname } })
							}}
						>
							<span class="material-symbols-rounded text-[22px]">{icon}</span>
						</button>
					))}
				</div>
			</div>
			{props.children}
		</>

	)
}