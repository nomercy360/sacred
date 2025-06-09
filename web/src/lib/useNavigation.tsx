import {
    createContext,
    createEffect,
    JSX,
    onCleanup,
    useContext,
} from 'solid-js'
import { useBackButton } from './useBackButton'
import { useLocation, useNavigate } from '@solidjs/router'

interface NavigationContext {
    navigateBack: () => void
}

const Navigation = createContext<NavigationContext>({} as NavigationContext)

export function NavigationProvider(props: { children: JSX.Element }) {
    const backButton = useBackButton()

    const navigate = useNavigate()
    const location = useLocation()

    const navigateBack = () => {
        const state = location.state

        if (location.pathname.includes('/profiles/')) {
            navigate('/people')
            return
        }

        if (location.pathname.includes('/wishes/')) {
            const pathParts = location.pathname.split('/')

            if (state && typeof state === 'object') {
                try {
                    const stateObj = state as any
                    if (stateObj.from && typeof stateObj.from === 'string') {
                        navigate(stateObj.from)
                        return
                    }
                } catch (e) {
                    console.error('Failed to parse state:', e)
                }
            }

            navigate('/')
            return
        }

        const deserialize = (state: Readonly<Partial<unknown>> | null) => {
            try {
                return JSON.parse(state as string)
            } catch (e) {
                return state
            }
        }

        const stateData = deserialize(state)

        const isObject = (value: unknown) => {
            return (
                value &&
                typeof value === 'object' &&
                value.constructor === Object
            )
        }

        if (isObject(stateData) && stateData.from) {
            navigate(stateData.from)
        } else if (isObject(stateData) && stateData.back) {
            navigate(-1)
        } else {
            navigate('/')
        }

        if (isObject(stateData) && stateData.scroll) {
            setTimeout(() => {
                window.scrollTo(0, stateData.scroll)
            }, 0)
        }
    }

    createEffect(() => {
        if (
            location.pathname.includes('/profiles/') ||
            (location.pathname !== '/' &&
                location.pathname !== '/setup' &&
                location.pathname !== '/create/from-link')
        ) {
            backButton.setVisible()
            backButton.onClick(navigateBack)
        } else {
            backButton.hide()
            backButton.offClick(navigateBack)
        }
    })

    onCleanup(() => {
        backButton.hide()
        backButton.offClick(navigateBack)
    })

    const value: NavigationContext = {
        navigateBack,
    }

    return (
        <Navigation.Provider value={value}>
            {props.children}
        </Navigation.Provider>
    )
}

export function useNavigation() {
    return useContext(Navigation)
}
