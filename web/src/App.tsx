import { useNavigate } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { createEffect, createSignal, Match, Switch } from 'solid-js'
import { API_BASE_URL } from '~/lib/api'
import { NavigationProvider } from '~/lib/useNavigation'
import Toast from '~/components/toast'
import { setOnboarding, setToken, setUser, setWishes, store, loadSavedSearches } from '~/store'

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

    // eslint-disable-next-line solid/reactivity
    createEffect(async () => {
        const initData = window.Telegram.WebApp.initData

        try {
            window.Telegram.WebApp.ready()
            window.Telegram.WebApp.expand()
            window.Telegram.WebApp.disableClosingConfirmation()
            window.Telegram.WebApp.disableVerticalSwipes()

            await loadSavedSearches()

            window.Telegram.WebApp.CloudStorage.getItem(
                'onboarding',
                updateOnboarding,
            )

            const resp = await fetch(`${API_BASE_URL}/auth/telegram`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: initData }),
            })

            const data = await resp.json()

            setUser(data.user)
            setToken(data.token)
            setWishes(data.wishes)

            window.Telegram.WebApp.CloudStorage.removeItem('onboarding')

            setIsAuthenticated(true)
            setIsLoading(false)

            const startParam = window.Telegram.WebApp.initDataUnsafe.start_param
            if (startParam && startParam.startsWith('w_')) {
                const wishId = startParam.substring(2)
                navigate(`/wishes/${wishId}`)
                return
            }

            if (!store.user?.email || !store.user?.interests.length) {
                navigate('/setup')
            }
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
                    <Match when={isAuthenticated()}>{props.children}</Match>
                    <Match when={!isAuthenticated() && isLoading()}>
                        <div class="bg-main min-h-screen w-full flex-col items-start justify-center" />
                    </Match>
                    <Match when={!isAuthenticated() && !isLoading()}>
                        <div class="bg-main text-main min-h-screen w-full flex-col items-start justify-center text-3xl">
                            Something went wrong. Please try again later.
                        </div>
                    </Match>
                </Switch>
                <Toast />
            </QueryClientProvider>
        </NavigationProvider>
    )
}
