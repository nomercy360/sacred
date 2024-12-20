import { lazy } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

import SetupProfilePage from '~/pages/setup'
import NavigationTabs from '~/components/navigation-tabs'
import WishlistPage from '~/pages/wishlist'
import PeoplePage from '~/pages/people'
import FeedPage from '~/pages/feed'
import NewItem from '~/pages/new'
import ShareProfile from '~/pages/share'

export const routes: RouteDefinition[] = [
	{
		path: '/',
		component: NavigationTabs,
		children: [
			{
				'path': '/',
				'component': WishlistPage,
			},
			{
				'path': '/people',
				'component': PeoplePage,
			},
			{
				'path': '/feed',
				'component': FeedPage,
			},
			{
				'path': '/new',
				'component': NewItem,
			},
		],
	},
	{
		path: '/setup',
		component: SetupProfilePage,
	},
	{
		path: '/share',
		component: ShareProfile,
	},
	{
		path: '**',
		component: lazy(() => import('./pages/404')),
	},
]
