import { useQuery } from '@tanstack/solid-query'
import { createMemo } from 'solid-js'
import { fetchFeed, Wish } from '~/lib/api'
import { cn } from '~/lib/utils'
import { Link } from '~/components/link'
import { WishesGrid } from '~/components/wish-grid'
import { setSearch, store } from '~/store'

const FeedPage = () => {
    const searchKey = createMemo(() => store.search)

    const wishes = useQuery<Wish[]>(() => ({
        queryKey: ['feed', searchKey()],
        queryFn: () => fetchFeed(searchKey()),
    }))

    return (
        <div class="relative flex h-screen w-full flex-col items-center overflow-hidden px-[1.5px]">
            <div class="fixed left-0 right-0 top-0 z-20 h-20 bg-gradient-to-t from-transparent to-white">
                <div
                    class={cn(
                        'flex h-20 w-full items-center justify-between p-5',
                    )}
                >
                    <Link
                        href="/search-feed"
                        state={{ from: '/feed' }}
                        class="flex size-10 items-center justify-center rounded-full bg-secondary"
                        onClick={() => {
                            setSearch('')
                        }}
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            search
                        </span>
                    </Link>
                    <p class="text-xl font-extrabold text-black">Discover</p>
                    <Link
                        href="/categories-edit"
                        state={{ from: '/feed' }}
                        class="flex size-10 items-center justify-center rounded-full bg-secondary"
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            page_info
                        </span>
                    </Link>
                </div>
            </div>
            <WishesGrid wishes={wishes as any} source="/feed" />
        </div>
    )
}

export default FeedPage
