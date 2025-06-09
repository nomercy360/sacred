import { useParams, useLocation } from '@solidjs/router'
import { createMutation, useQuery } from '@tanstack/solid-query'
import { createEffect, For, Match, Show, Switch, onCleanup } from 'solid-js'
import { fetchUserProfile, UserProfile, Wish, followUser, unfollowUser } from '~/lib/api'
import { useMainButton } from '~/lib/useMainButton'
import { getFirstImage, splitIntoGroups } from '~/lib/utils'
import { ImageWithPlaceholder } from '~/components/image-placeholder'
import { Link } from '~/components/link'
import { addToast } from '~/components/toast'
import { store } from '~/store'
import { queryClient } from '~/App'

export default function UserProfilePage() {
    const params = useParams()
    const location = useLocation()
    const mainButton = useMainButton()

    const followMutation = createMutation(() => ({
        mutationFn: async () => {
            mainButton.showProgress()
            return await followUser(params.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', params.id] })
            setTimeout(() => {
                addToast(
                    `Followed ${user.data?.name}`,
                    true,
                    '10px',
                    'white',
                    '200px',
                )
            }, 1000)
        },
        onSettled: () => {
            mainButton.hideProgress()
        },
    }))

    const unfollowMutation = createMutation(() => ({
        mutationFn: async () => {
            mainButton.showProgress()
            return await unfollowUser(params.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', params.id] })
            setTimeout(() => {
                addToast(
                    `Unfollowed ${user.data?.name}`,
                    true,
                    '10px',
                    'white',
                    '220px',
                )
            }, 1000)
        },
        onSettled: () => {
            mainButton.hideProgress()
        },
    }))

    const user = useQuery<UserProfile>(() => ({
        queryKey: ['profile', params.id],
        queryFn: () => fetchUserProfile(params.id),
        refetchOnWindowFocus: true,
    }))

    createEffect(() => {
        if (!user.data || user.data?.id === store.user?.id) {
            mainButton.hide()
            return
        }

        mainButton.enable()
        mainButton.enable()
        const isFollowing = user.data?.is_following
        const name = user.data?.name ?? ''
        const text = `${isFollowing ? 'Unfollow' : 'Follow'} ${name}`
        const color = isFollowing ? '#808080' : '#000000' // Consider Tailwind classes for colors if consistent
        const action = isFollowing
            ? unfollowMutation.mutate
            : followMutation.mutate

        mainButton.setParams({ text, color })
        mainButton.offClick(followMutation.mutate) // Ensure previous listeners are off
        mainButton.offClick(unfollowMutation.mutate)
        mainButton.onClick(action)
    })

    onCleanup(() => {
        mainButton.hide()
        mainButton.offClick(followMutation.mutate)
        mainButton.offClick(unfollowMutation.mutate)
    })

    return (
        <div class="relative flex h-screen w-full flex-col items-center overflow-hidden">
            {/* Header remains the same */}
            <div class="flex w-full flex-shrink-0 flex-row items-center justify-between p-5">
                <button class="flex size-10 items-center justify-center rounded-full bg-secondary">
                    <span class="material-symbols-rounded text-[20px]">
                        report
                    </span>
                </button>
                <p class="text-2xl font-extrabold text-black">
                    <Show
                        when={!user.isLoading && user.data}
                        fallback={<span>Loading...</span>}
                    >
                        {user.data?.name}
                    </Show>
                </p>
                <button class="flex size-10 items-center justify-center rounded-full bg-secondary">
                    <span class="material-symbols-rounded text-[20px]">
                        arrow_outward
                    </span>
                </button>
            </div>

            <div class="w-full flex-1 overflow-y-auto pb-[200px] text-center">
                <Switch>
                    <Match when={user.isLoading}>
                        <p class="mt-4">Loading user profile...</p>{' '}
                        {/* Adjusted text slightly */}
                    </Match>

                    <Match when={user.isError}>
                        {' '}
                        {/* Use user.isError for clarity */}
                        <div class="mt-4">
                            <p class="text-red-500">Failed to load profile.</p>
                            <button
                                class="mt-2 rounded-2xl bg-primary px-4 py-2 text-white"
                                onClick={() => user.refetch()}
                            >
                                Retry
                            </button>
                        </div>
                    </Match>

                    <Match
                        when={
                            user.isSuccess &&
                            user.data &&
                            user.data.wishlist_items.length > 0
                        }
                    >
                        <div class="grid grid-cols-2 gap-0.5 px-[1.5px]">
                            <For
                                each={splitIntoGroups(
                                    user.data?.wishlist_items,
                                    2,
                                )}
                            >
                                {group => (
                                    <div class="flex flex-col gap-0.5">
                                        <For each={group}>
                                            {(item: Wish) => {
                                                const imageDetails =
                                                    getFirstImage(item)
                                                return (
                                                    <Link
                                                        class="block overflow-hidden rounded-[25px] border border-[#00000010]"
                                                        href={`/wishes/${item.id}`}
                                                        state={{
                                                            from: location.pathname,
                                                        }}
                                                    >
                                                        <ImageWithPlaceholder
                                                            src={`https://assets.peatch.io/cdn-cgi/image/width=400/${imageDetails.url}`}
                                                            alt={item.name}
                                                            width={
                                                                imageDetails.width
                                                            }
                                                            height={
                                                                imageDetails.height
                                                            }
                                                        />
                                                    </Link>
                                                )
                                            }}
                                        </For>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Match>

                    <Match
                        when={
                            user.isSuccess &&
                            user.data &&
                            user.data.wishlist_items.length === 0
                        }
                    >
                        <p class="pt-10 text-center text-lg text-gray-500">
                            Oops, this user has no wishes yet. 😔
                        </p>
                    </Match>
                </Switch>
            </div>
        </div>
    )
}
