import { useQueryClient } from '@tanstack/solid-query'
import { createEffect, For, Show } from 'solid-js'
import { Wish } from '~/lib/api'
import { store } from '~/store'
import WishItem from './wish-item'

type WishesGridProps = {
    wishes: {
        isSuccess: boolean
        data: (Wish & { copy_id: string | null })[] | undefined
        isFetching?: boolean
        refetch?: () => void
    }
    source: string
}

export function WishesGrid(props: WishesGridProps) {
    const queryClient = useQueryClient()

    createEffect(() => {
        if (props.wishes.isSuccess && props.wishes.data) {
            const updatedWishes = props.wishes.data.map(wish => ({
                ...wish,
                copy_id:
                    store.wishes?.find(w => w.source_id === wish.id)?.id ||
                    null,
            }))
            queryClient.setQueryData(['feed'], updatedWishes)
        }
    })

    return (
        <>
            <Show
                when={
                    props.wishes.isSuccess &&
                    (!props.wishes.data || props.wishes.data.length === 0)
                }
            >
                <div class="flex w-full items-center justify-center pt-20 text-center">
                    <p class="text-xl font-extrabold">
                        No content is here yet..
                    </p>
                </div>
            </Show>

            <Show
                when={
                    props.wishes.isSuccess &&
                    props.wishes.data &&
                    props.wishes.data.length > 0
                }
            >
                <div
                    class={`grid h-full w-full grid-cols-2 gap-0.5 overflow-y-scroll pb-[100px] ${
                        props.source === '/bookmarks' ||
                        props.source === '/feed'
                            ? 'pt-20'
                            : ''
                    }`}
                >
                    <div class="flex flex-col gap-0.5">
                        <For
                            each={props.wishes.data?.slice(
                                0,
                                Math.ceil((props.wishes.data?.length || 0) / 2),
                            )}
                        >
                            {wish => (
                                <WishItem wish={wish} source={props.source} />
                            )}
                        </For>
                    </div>

                    <div class="flex h-full flex-col gap-0.5">
                        <For
                            each={props.wishes.data?.slice(
                                Math.ceil((props.wishes.data?.length || 0) / 2),
                            )}
                        >
                            {wish => (
                                <WishItem wish={wish} source={props.source} />
                            )}
                        </For>
                    </div>
                </div>
            </Show>
        </>
    )
}
