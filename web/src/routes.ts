import { lazy } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

import SetupProfilePage from '~/pages/setup'
import NavigationTabs from '~/components/navigation-tabs'
import UserBoardPage from '~/pages/board'
import PeoplePage from '~/pages/people'
import FeedPage from '~/pages/feed'
import NewItem from '~/pages/new'
import ShareProfile from '~/pages/share'
import CreateFromLinkPage from '~/pages/create/from-link'
import CreateFromImagePage from '~/pages/create/from-images'

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
		path: '/profiles/:id',
		component: lazy(() => import('./pages/profile')),
	},
	{
		path: '/create/from-link',
		component: CreateFromLinkPage,
	},
	{
		path: '/create/from-images',
		component: CreateFromImagePage,
	},
	{
		path: '/share',
		component: ShareProfile,
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
