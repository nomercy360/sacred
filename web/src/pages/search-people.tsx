import { cn } from '~/lib/utils'
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { fetchProfiles, followUser, unfollowUser, UserProfile } from '~/lib/api'
import { createQuery } from '@tanstack/solid-query'
import { useNavigate } from '@solidjs/router'

import { Link } from '~/components/link'
import { useBackButton } from '~/lib/useBackButton'
import { addToast } from '~/components/toast'

export interface SearchingItemProps {
    profilePicture: string
    name: string
    followers: number
    userId: string
    isFollowing: boolean
}

export default function SearchPage() {
    const navigate = useNavigate()
    const [search, setSearch] = createSignal('')
    const [searchMode, setSearchMode] = createSignal(true)
    const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(
        null,
    )
    const [searchResults, setSearchResults] = createSignal<
        SearchingItemProps[]
    >([])

    const mainBackButton = useBackButton()

    const profiles = createQuery<UserProfile[]>(() => ({
        queryKey: ['profiles'],
        queryFn: () => fetchProfiles(),
    }))

    const searchPeople = () => {
        if (!profiles.data) return

        const filtered = search()
            ? profiles.data.filter(
                  profile =>
                      profile.name
                          ?.toLowerCase()
                          .includes(search().toLowerCase()) ||
                      profile.username
                          .toLowerCase()
                          .includes(search().toLowerCase()),
              )
            : profiles.data

        setSearchResults(
            filtered.map(profile => ({
                profilePicture: profile.avatar_url || '/placeholder.jpg',
                name: profile.name || profile.username,
                followers: profile.followers,
                userId: profile.id,
                isFollowing: profile.is_following,
            })),
        )
    }

    const handleFollow = async (userId: string) => {
        try {
            await followUser(userId)
            setSearchResults(results =>
                results.map(item =>
                    item.userId === userId
                        ? {
                              ...item,
                              isFollowing: true,
                              followers: item.followers + 1,
                          }
                        : item,
                ),
            )
            addToast(
                `Followed ${searchResults().find(item => item.userId === userId)?.name}`,
                true,
                '20px',
                'white',
                '200px',
            )
        } catch (e) {
            console.error('Failed to follow:', e)
        }
    }

    const handleUnfollow = async (userId: string) => {
        try {
            await unfollowUser(userId)
            setSearchResults(results =>
                results.map(item =>
                    item.userId === userId
                        ? {
                              ...item,
                              isFollowing: false,
                              followers: item.followers - 1,
                          }
                        : item,
                ),
            )
            addToast(
                `Unfollowed ${searchResults().find(item => item.userId === userId)?.name}`,
                true,
                '20px',
                'white',
                '220px',
            )
        } catch (e) {
            console.error('Failed to unfollow:', e)
        }
    }

    createEffect(() => {
        if (profiles.data) {
            searchPeople()
        }
    })

    const toggleSearchMode = () => {
        setSearchMode(!searchMode())
        if (searchMode()) {
            searchInput()?.focus()
        }
    }

    onMount(() => {
        mainBackButton.onClick(() => {
            navigate('/people')
        })

        window.addEventListener('popstate', () => {
            navigate('/people')
        })
        onCleanup(() =>
            window.removeEventListener('popstate', () => {
                navigate('/people')
            }),
        )
    })

    return (
        <div class="flex h-screen w-full flex-col items-center overflow-hidden">
            <div
                class={cn(
                    'h-20 w-full px-5 pb-7 pt-3',
                    searchMode() ? 'block' : 'hidden',
                )}
            >
                <div class="flex h-10 w-full flex-row items-center justify-between rounded-2xl bg-secondary pl-3">
                    <input
                        ref={setSearchInput}
                        type="text"
                        value={search()}
                        onInput={e => {
                            setSearch(e.target.value)
                            searchPeople()
                        }}
                        class="h-full w-full bg-transparent focus:outline-none"
                        placeholder="Search people"
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                searchPeople()
                            }
                        }}
                    />
                    <button
                        class="flex size-10 items-center justify-center rounded-full bg-secondary"
                        onClick={
                            search()
                                ? () => {
                                      setSearch('')
                                      searchPeople()
                                  }
                                : toggleSearchMode
                        }
                    >
                        <span class="material-symbols-rounded text-[20px]">
                            close
                        </span>
                    </button>
                </div>
            </div>

            <div
                class={cn(
                    'flex h-20 w-full flex-shrink-0 flex-row items-center justify-between bg-background px-5 pb-9 pt-5',
                    searchMode() ? 'hidden' : 'flex',
                )}
            >
                <button
                    class="flex size-10 items-center justify-center rounded-full bg-secondary"
                    onClick={() => navigate('/people')}
                >
                    <span class="material-symbols-rounded text-[20px]">
                        arrow_back
                    </span>
                </button>
                <p class="text-2xl font-extrabold text-black">Search</p>
                <div class="size-10" />
            </div>

            <div class="flex h-full w-full flex-col items-center overflow-y-auto px-5">
                {profiles.isLoading ? (
                    <p class="mt-4">Loading profiles...</p>
                ) : profiles.error ? (
                    <p class="mt-4 text-red-500">Failed to load profiles</p>
                ) : searchResults().length === 0 ? (
                    <p class="mt-4">No profiles found</p>
                ) : (
                    searchResults().map(result => (
                        <div class="mx-5 my-2 flex w-full flex-row items-center justify-between">
                            <Link
                                href={`/profiles/${result.userId}`}
                                class="flex flex-1 flex-row items-center gap-3"
                            >
                                <img
                                    src={result.profilePicture}
                                    alt={result.name}
                                    class="h-10 w-10 rounded-full object-cover"
                                />
                                <div class="flex flex-col items-start">
                                    <p class="text-sm font-bold">
                                        {result.name}
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        {result.followers}{' '}
                                        {result.followers === 1
                                            ? 'follower'
                                            : 'followers'}
                                    </p>
                                </div>
                            </Link>

                            {!result.isFollowing ? (
                                <button
                                    onClick={() => handleFollow(result.userId)}
                                    class="flex h-10 w-20 items-center justify-center rounded-full bg-primary text-[12px] text-white"
                                >
                                    Follow
                                </button>
                            ) : (
                                <button
                                    onClick={() =>
                                        handleUnfollow(result.userId)
                                    }
                                    class="flex h-10 w-20 items-center justify-center rounded-full bg-[#808080] text-[12px] text-white"
                                >
                                    Unfollow
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
