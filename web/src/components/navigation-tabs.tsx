import { cn } from '~/lib/utils'
import { useLocation } from '@solidjs/router'
import { Link } from '~/components/link'



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
			icon: 'emoji_language',
		},
		{
			href: '/create/from-link',
			icon: 'add_circle',
		},
	]

	return (
		<>
			<div
				class="flex flex-col items-center justify-start h-[100px] fixed bottom-0 w-full z-50"
			>
				<div class="flex justify-center flex-row rounded-full space-x-5 shadow-xl bg-white px-2">
					{tabs.map(({ href, icon }) => (
						<Link
							href={href}
							state={{ from: location.pathname }}
							class={cn('size-10 flex items-center justify-center flex-col text-sm text-[#BABABA]', {
								'bg-none': location.pathname === href,
							})}
						>
							<span
								class={cn('material-symbols-rounded text-[20px]', { 'text-black': location.pathname === href })}>
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