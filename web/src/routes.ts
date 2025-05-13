import { lazy } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

import SetupProfilePage from '~/pages/setup'
import NavigationTabs from '~/components/navigation-tabs'
import UserBoardPage from '~/pages/board'
import PeoplePage from '~/pages/people'
import FeedPage from '~/pages/feed'
import ShareProfile from '~/pages/share'
import CreateFromLinkPage from '~/pages/create/from-link'
import CategoriesEdit from '~/pages/categories-edit'
import BookmarksPage from '~/pages/bookmarks'
import ProfileEditPage from '~/pages/profile-edit'
import WishEditPage from '~/pages/wish-edit'
import SearchPage from './pages/search-people'

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
		path: '/bookmarks',
		component: BookmarksPage,
	},
	{
		path: '/categories-edit',
		component: CategoriesEdit,
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
		path: '/share',
		component: ShareProfile,
	},
	{
		path: '/profile/edit',
		component: ProfileEditPage,
	},
	{
		path: '/search',
		component: SearchPage,
	},
	{
		path: '/wishes/:id/edit',
		component: WishEditPage,
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
