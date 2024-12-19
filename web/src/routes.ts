import { lazy } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

import SetupProfilePage from '~/pages/setup'
import NavigationTabs from '~/components/navigation-tabs'
import WishlistPage from '~/pages/feed'

export const routes: RouteDefinition[] = [
	{
		path: '/',
		component: NavigationTabs,
		children: [
			{
				'path': '/',
				'component': WishlistPage,
			},
		],
	},
	{
		path: '/setup',
		component: SetupProfilePage,
	},
	{
		path: '**',
		component: lazy(() => import('./pages/404')),
	},
]
