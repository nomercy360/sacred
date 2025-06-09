import { useQuery } from '@tanstack/solid-query'
import { Match, Switch, For, Component } from 'solid-js'
import { fetchProfiles, UserProfile, Wish } from '~/lib/api'
import { ImageButton } from '~/components/image-button'
import { Link } from '~/components/link'

export default function PeoplePage() {
    const users = useQuery<UserProfile[]>(() => ({
        queryKey: ['users'],
        queryFn: () => fetchProfiles(),
    }))

    const skeletonItems = Array.from({ length: 5 })

    function resolveImageUrl(wish: Wish) {
        if (!wish.images || wish.images.length === 0) return '/placeholder.jpg'

        return `https://assets.peatch.io/cdn-cgi/image/fit=cover/${wish.images[0].url}`
    }

    return (
        <div class="relative flex h-screen w-full flex-col items-center overflow-hidden">
            <div class="fixed left-0 right-0 top-0 z-10 h-20 bg-gradient-to-t from-transparent to-white">
                <div class="flex h-20 w-full flex-shrink-0 flex-row items-center justify-between p-5">
                    <Link
                        href="/search"
                        state={{ from: '/people' }}
                        class="flex size-10 items-center justify-center rounded-full bg-secondary"
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            search
                        </span>
                    </Link>
                    <p class="text-2xl font-extrabold">People</p>
                    <Link
                        class="flex size-10 items-center justify-center rounded-full bg-secondary"
                        href="/share"
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            link
                        </span>
                    </Link>
                </div>
            </div>

            <div class="w-full flex-1 overflow-y-auto pt-20 text-center">
                <Switch>
                    <Match when={users.isLoading && !users.data}>
                        <div class="space-y-4 px-2 pb-24 md:px-4">
                            <div class="w-full space-y-0.5">
                                <For each={skeletonItems}>
                                    {() => <PersonSkeletonCard />}
                                </For>
                            </div>
                        </div>
                    </Match>

                    <Match when={users.isError}>
                        <div class="mt-10 px-4">
                            <p class="text-red-500">Failed to load people.</p>
                            <button
                                class="mt-4 rounded-2xl bg-primary px-4 py-2 text-white"
                                onClick={() => users.refetch()}
                            >
                                Retry
                            </button>
                        </div>
                    </Match>

                    <Match
                        when={
                            users.isSuccess &&
                            users.data &&
                            users.data.length > 0
                        }
                    >
                        <div class="space-y-4 px-2 pb-24 md:px-4">
                            <div class="w-full space-y-0.5">
                                <For each={users.data}>
                                    {user => (
                                        <ImageButton
                                            href={`/profiles/${user.id}`}
                                            images={user.wishlist_items
                                                .slice(0, 3)
                                                .map(wish =>
                                                    resolveImageUrl(wish),
                                                )}
                                        >
                                            <div class="flex flex-col items-center justify-center gap-0.5 p-4">
                                                <img
                                                    src={
                                                        user.avatar_url ||
                                                        '/placeholder.jpg'
                                                    }
                                                    alt={
                                                        user.name ||
                                                        'User avatar'
                                                    }
                                                    class="size-9 rounded-full object-cover"
                                                    loading="lazy"
                                                />
                                                <p class="mt-3 text-xl font-bold">
                                                    {user.name || 'Anonymous'}
                                                </p>
                                                <p class="text-sm font-extralight">
                                                    {user.followers || 0}{' '}
                                                    {user.followers === 1
                                                        ? 'follower'
                                                        : 'followers'}
                                                </p>
                                            </div>
                                        </ImageButton>
                                    )}
                                </For>
                            </div>
                        </div>
                    </Match>
                    <Match
                        when={
                            users.isSuccess &&
                            (!users.data || users.data.length === 0)
                        }
                    >
                        <div class="mt-10 px-4">
                            <p class="text-secondary-foreground">
                                No people found yet.
                            </p>
                        </div>
                    </Match>
                </Switch>
            </div>
        </div>
    )
}

const PersonSkeletonCard: Component = () => {
    return (
        <div class="relative grid h-[200px] w-full gap-0.5 overflow-hidden rounded-full bg-secondary">
            <div class="flex flex-col items-center justify-center gap-2">
                <div class="size-9 rounded-full bg-background" />

                <div class="mt-3 h-5 w-3/5 rounded bg-background" />

                <div class="h-3 w-2/5 rounded bg-background" />
            </div>
        </div>
    )
}
