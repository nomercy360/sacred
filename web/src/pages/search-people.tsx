import { cn } from "~/lib/utils";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { fetchProfiles, followUser, unfollowUser, UserProfile } from "~/lib/api";
import { createQuery } from "@tanstack/solid-query";
import { useNavigate } from "@solidjs/router";

import { Link } from "~/components/link";
import { useBackButton } from "~/lib/useBackButton";
import { addToast } from "~/components/toast";

export interface SearchingItemProps {
    profilePicture: string
    name: string
    followers: number
    userId: string
    isFollowing: boolean
}

export default function SearchPage() {
    const navigate = useNavigate();
    const [search, setSearch] = createSignal('')
    const [searchMode, setSearchMode] = createSignal(true)
    const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(null)
    const [searchResults, setSearchResults] = createSignal<SearchingItemProps[]>([])

    const mainBackButton = useBackButton()
    
    const profiles = createQuery<UserProfile[]>(() => ({
        queryKey: ['profiles'],
        queryFn: () => fetchProfiles()
    }))

    const searchPeople = () => {
        if (!profiles.data) return;

        const filtered = search()
            ? profiles.data.filter(profile =>
                profile.name?.toLowerCase().includes(search().toLowerCase()) ||
                profile.username.toLowerCase().includes(search().toLowerCase())
            )
            : profiles.data;

        setSearchResults(
            filtered.map(profile => ({
                profilePicture: profile.avatar_url || '/placeholder.jpg',
                name: profile.name || profile.username,
                followers: profile.followers,
                userId: profile.id,
                isFollowing: profile.is_following
            }))
        );
    }


    const handleFollow = async (userId: string) => {
        try {
            await followUser(userId);
            setSearchResults(results =>
                results.map(item =>
                    item.userId === userId ? { ...item, isFollowing: true, followers: item.followers + 1 } : item
                )
            );
            setTimeout(() => {
                addToast(`Followed ${searchResults().find(item => item.userId === userId)?.name}`, false, '20px', 'white', '200px')
            }, 600)
        } catch (e) {
            console.error("Failed to follow:", e);
        }
    };

    const handleUnfollow = async (userId: string) => {
        try {
            await unfollowUser(userId);
            setSearchResults(results =>
                results.map(item =>
                    item.userId === userId ? { ...item, isFollowing: false, followers: item.followers - 1 } : item
                )
            );
            setTimeout(() => {
                addToast(`Unfollowed ${searchResults().find(item => item.userId === userId)?.name}`, false, '20px', 'white', '220px')
            }, 600)
        } catch (e) {
            console.error("Failed to unfollow:", e);
        }
    };

    createEffect(() => {
        if (profiles.data) {
            searchPeople();
        }
    });

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

        window.addEventListener("popstate", () => {
            navigate('/people')
        });
        onCleanup(() => window.removeEventListener("popstate", () => {
            navigate('/people')
        }));
    });


    return (
        <div class="flex flex-col items-center w-full h-screen overflow-hidden">
            <div
                class={cn('w-full h-20 pt-3 px-5 pb-7', searchMode() ? 'block' : 'hidden')}>
                <div class="flex w-full rounded-2xl bg-secondary h-10 flex-row items-center justify-between pl-3">
                    <input
                        ref={setSearchInput}
                        type="text"
                        value={search()}
                        onInput={(e) => {
                            setSearch(e.target.value);
                            searchPeople();
                        }}
                        class="h-full w-full bg-transparent focus:outline-none"
                        placeholder="Search people"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                searchPeople()
                            }
                        }}
                    />
                    <button
                        class="bg-secondary rounded-full size-10 flex items-center justify-center"
                        onClick={search() ? () => {
                            setSearch('');
                            searchPeople();
                        } : toggleSearchMode}
                    >
                        <span class="material-symbols-rounded text-[20px]">close</span>
                    </button>
                </div>
            </div>

            <div class={cn('bg-background h-20 flex-shrink-0 w-full flex flex-row justify-between items-center pb-9 pt-5 px-5', searchMode() ? 'hidden' : 'flex')}>
                <button
                    class="flex items-center justify-center bg-secondary rounded-full size-10"
                    onClick={() => navigate('/people')}
                >
                    <span class="material-symbols-rounded text-[20px]">arrow_back</span>
                </button>
                <p class="text-black text-2xl font-extrabold">Search</p>
                <div class="size-10"></div>
            </div>

            <div class="flex flex-col items-center w-full h-full px-5 overflow-y-auto">
                {profiles.isLoading ? (
                    <p class="mt-4">Loading profiles...</p>
                ) : profiles.error ? (
                    <p class="mt-4 text-red-500">Failed to load profiles</p>
                ) : searchResults().length === 0 ? (
                    <p class="mt-4">No profiles found</p>
                ) : (
                    searchResults().map((result) => (
                        <div class="flex flex-row items-center w-full justify-between mx-5 my-2">
                            <Link href={`/profiles/${result.userId}`} class="flex flex-row items-center gap-3 flex-1">
                                <img src={result.profilePicture} alt={result.name} class="w-10 h-10 rounded-full object-cover" />
                                <div class="flex flex-col items-start">
                                    <p class="text-sm font-bold">{result.name}</p>
                                    <p class="text-xs text-gray-500">{result.followers} {result.followers === 1 ? 'follower' : 'followers'}</p>
                                </div>
                            </Link>

                            {!result.isFollowing ? (
                                <button onClick={() => handleFollow(result.userId)} class="w-20  h-10 rounded-full flex items-center text-[12px] justify-center text-white bg-primary">
                                    Follow
                                </button>
                            ) : (
                                <button onClick={() => handleUnfollow(result.userId)} class="w-20 h-10 rounded-full flex items-center text-[12px] justify-center text-white bg-[#808080]">
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