import { useQuery } from '@tanstack/solid-query'
import { fetchBookmarks, type Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/components/wish-grid'
import { For, Show } from 'solid-js'

const BookmarksPage = () => {
    const wishes = useQuery(() => ({
        queryKey: ['bookmarks'],
        queryFn: fetchBookmarks,
        staleTime: 60_000,
    }))

    return (
        <div class="relative flex h-screen w-full flex-col items-center overflow-hidden">
            <div class="fixed left-0 right-0 top-0 z-10 h-20 bg-gradient-to-t from-transparent to-white">
                <div class="flex h-20 w-full flex-shrink-0 flex-row items-center justify-between px-5 pb-9 pt-5">
                    <button
                        class="flex size-10 items-center justify-center rounded-full bg-secondary"
                        aria-label="Search"
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            search
                        </span>
                    </button>

                    <h1 class="text-xl font-extrabold text-black">Liked</h1>

                    <Link
                        href="/categories-edit"
                        state={{ from: '/feed' }}
                        class="flex size-10 items-center justify-center rounded-full bg-secondary"
                        aria-label="Edit categories"
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            page_info
                        </span>
                    </Link>
                </div>
            </div>

            <Show
                when={wishes.isSuccess && wishes.data}
                fallback={
                    <div class="grid w-full grid-cols-2 gap-0.5 px-1 pt-24">
                        <For each={Array(6)}>
                            {() => (
                                <div class="aspect-[3/4] animate-pulse rounded-[25px] bg-gray-200" />
                            )}
                        </For>
                    </div>
                }
            >
                <WishesGrid
                    wishes={{
                        isSuccess: wishes.isSuccess,
                        data: wishes.data,
                        isFetching: wishes.isFetching,
                        refetch: wishes.refetch,
                    }}
                    source="/bookmarks"
                />
            </Show>

            <Show when={wishes.isSuccess && wishes.data?.length === 0}>
                <div class="flex h-full w-full flex-col items-center justify-center pt-20">
                    <div class="mb-4 text-gray-400">
                        <span class="material-symbols-rounded text-5xl">
                            bookmark
                        </span>
                    </div>
                    <p class="text-lg font-medium text-gray-500">
                        No bookmarks yet
                    </p>
                    <p class="mt-2 text-sm text-gray-400">
                        Save wishes to see them here
                    </p>
                </div>
            </Show>
        </div>
    )
}

export default BookmarksPage
