import { useLocation, useNavigate } from '@solidjs/router'
import { onMount, For } from 'solid-js'
import { cn } from '~/lib/utils'

export default function NavigationTabs(props: any) {
    const location = useLocation()

    const navigate = useNavigate()

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

    onMount(() => {
        window.Telegram.WebApp.ready()
    })

    return (
        <>
            <div class="fixed bottom-0 z-50 flex h-[85px] w-full flex-col items-center">
                <div class="flex flex-row justify-center space-x-5 rounded-full bg-white p-1 px-2 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
                    <For each={tabs}>
                        {props => (
                            <button
                                type="button"
                                class={cn(
                                    'flex size-10 flex-col items-center justify-center rounded-full text-sm text-gray-400',
                                    {
                                        'text-black':
                                            location.pathname === props.href,
                                    },
                                )}
                                onClick={() => {
                                    navigate(props.href, {
                                        state: { from: location.pathname },
                                    })
                                }}
                            >
                                <span class="material-symbols-rounded text-[22px]">
                                    {props.icon}
                                </span>
                            </button>
                        )}
                    </For>
                </div>
            </div>
            {props.children}
        </>
    )
}
