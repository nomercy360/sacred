import { createEffect, createSignal, Match, Switch } from 'solid-js'
import { NavigationProvider } from './lib/useNavigation'
import { useNavigate } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import Toast from '~/components/toast'
import { API_BASE_URL } from '~/lib/api'
import { setOnboarding, setToken, setUser, setWishes, store } from '~/store'


export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 5, // 5 minutes
		},
		mutations: {
			retry: 2,
		},
	},
})

const updateOnboarding = (err: unknown, value: unknown) => {
	setOnboarding(value !== 'done')
}


export default function App(props: any) {
	const [isAuthenticated, setIsAuthenticated] = createSignal(false)
	const [isLoading, setIsLoading] = createSignal(true)

	const navigate = useNavigate()

	createEffect(async () => {
		const initData = window.Telegram.WebApp.initData

		console.log('WEBAPP:', window.Telegram)

		try {
			window.Telegram.WebApp.CloudStorage.getItem(
				'onboarding',
				updateOnboarding,
			)

			const resp = await fetch(`${API_BASE_URL}/auth/telegram?` + initData, {
				method: 'POST',
			})

			const data = await resp.json()

			setUser(data.user)
			setToken(data.token)
			setWishes(data.wishes)

			window.Telegram.WebApp.ready()
			window.Telegram.WebApp.expand()
			window.Telegram.WebApp.disableClosingConfirmation()
			window.Telegram.WebApp.disableVerticalSwipes()

			window.Telegram.WebApp.CloudStorage.removeItem('onboarding')

			setIsAuthenticated(true)
			setIsLoading(false)

			if (!store.user?.email || !store.user?.interests.length) {
				navigate('/setup')
			}

			// if there is a redirect url, redirect to it
			// ?startapp=redirect-to=/users/

		} catch (e) {
			console.error('Failed to authenticate user:', e)
			setIsAuthenticated(false)
			setIsLoading(false)
		}
	})
	return (

		<NavigationProvider>
			<QueryClientProvider client={queryClient}>
				<Switch>
					<Match when={isAuthenticated()}>
						{props.children}
					</Match>
					<Match when={!isAuthenticated() && isLoading()}>
						<div class="min-h-screen w-full flex-col items-start justify-center bg-main" />
					</Match>
					<Match when={!isAuthenticated() && !isLoading()}>
						<div
							class="min-h-screen w-full flex-col items-start justify-center bg-main text-3xl text-main">
							Something went wrong. Please try again later.
						</div>
					</Match>
				</Switch>
				<Toast />
			</QueryClientProvider>
		</NavigationProvider>
	)
}
