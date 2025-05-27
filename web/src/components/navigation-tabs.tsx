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
			icon: 'people',
		},
		{
			href: '/create/from-link',
			icon: 'add_circle',
		},
	]

	return (
		<>
			<div
				class="flex flex-col items-center h-[85px] fixed bottom-0 w-full z-50"
			>
				<div class="flex justify-center  flex-row rounded-full p-1 space-x-5 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)] bg-white px-2">
					{tabs.map(({ href, icon }) => (
						<Link
							href={href}
							state={{ from: location.pathname }}
							class={cn('size-10 flex items-center justify-center flex-col text-sm text-gray-400', {
								'bg-none': location.pathname === href,
							})}
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