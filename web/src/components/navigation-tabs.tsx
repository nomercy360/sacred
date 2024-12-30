import { cn } from '~/lib/utils'
import { useLocation } from '@solidjs/router'
import { Link } from '~/components/link'
import { store } from '~/store'

export default function NavigationTabs(props: any) {
	const location = useLocation()

	const tabs = [
		{
			href: '/feed',
			icon: 'interests',
		},
		{
			href: '/',
			icon: 'note_stack',
		},
		{
			href: '/people',
			icon: 'group',
		},

		{
			href: '/new',
			icon: 'add',
		},
	]

	return (
		<>
			<div
				class="flex flex-col items-center justify-start border-t shadow-sm h-[110px] fixed bottom-0 w-full bg-background z-50"
			>
				<div class="flex flex-row pt-4 pb-5 space-x-8">
					{tabs.map(({ href, icon }) => (
						<Link
							href={href}
							state={{ from: location.pathname }}
							class={cn('size-10 flex items-center justify-center rounded-full flex-col text-sm text-secondary-foreground', {
								'bg-primary': location.pathname === href,
							})}
						>
							<span
								class={cn('material-symbols-rounded text-[20px]', { 'text-primary-foreground': location.pathname === href })}>
								{icon}</span>
						</Link>
					))}
				</div>
			</div>
			{props.children}
		</>
	)
}
