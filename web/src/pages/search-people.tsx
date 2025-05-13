import { cn } from "~/lib/utils";
import { createEffect, createSignal } from "solid-js";
import { SearchingItem, SearchingItemProps } from "~/components/searching-item";
import { fetchProfiles, UserProfile } from "~/lib/api";
import { createQuery } from "@tanstack/solid-query";
import { useNavigate } from "@solidjs/router";

export default function SearchPage() {
    const navigate = useNavigate();
    const [search, setSearch] = createSignal('')
    const [searchMode, setSearchMode] = createSignal(true)
    const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(null)
    const [searchResults, setSearchResults] = createSignal<SearchingItemProps[]>([])
    
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
                userId: profile.id
            }))
        );
    }

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
                        <SearchingItem 
                            profilePicture={result.profilePicture} 
                            name={result.name} 
                            followers={result.followers}
                            userId={result.userId} 
                        />
                    ))
                )}
            </div>
        </div>
    )
}