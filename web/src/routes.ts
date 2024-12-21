import { lazy } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

import SetupProfilePage from '~/pages/setup'
import NavigationTabs from '~/components/navigation-tabs'
import UserBoardPage from '~/pages/board'
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
				'component': UserBoardPage,
			},
			{
				'path': '/people',
				'component': PeoplePage,
			},
			{
				'path': '/feed',
				'component': FeedPage,
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
		'path': '/new',
		'component': NewItem,
	},
	{
		'path': '/wishes/:id',
		'component': lazy(() => import('./pages/wish')),
	},
	{
		path: '**',
		component: lazy(() => import('./pages/404')),
	},
]
