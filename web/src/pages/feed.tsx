import { useQuery } from '@tanstack/solid-query'
import { fetchFeed, Wish } from '~/lib/api'
import { Link } from '~/components/link'
import { WishesGrid } from '~/pages/bookmarks'
import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { cn } from '~/lib/utils'
import CategoriesSelect from '~/components/categories-select'
import { useBackButton } from '~/lib/useBackButton'
import { useNavigate } from '@solidjs/router'

const mockNames = [
	"Arc'teryx", 'Beaded Breakast', 'Nike', 'Razor Keyboard',
	'Airpods', 'Louis Vuitton', 'Barbour', 'Handmade'
]

const mockSuggestions = [
	'Louis Vuitton', 'Louis Partridge', 'Louis Tomlinson', 'Louis Vuitton Bag',
	'Louis Garrel', 'Louis Vuitton Aesthetic', 'Louis Vuitton Wallpaper',
	'Louis Vuitton Shoes', 'Louis Hofmann', 'Louis Wain', 'Corona'
]

const FeedPage = () => {
	const [search, setSearch] = createSignal('')
	const [searchMode, setSearchMode] = createSignal(false)
	const [searchInput, setSearchInput] = createSignal<HTMLInputElement | null>(null)

	const backButton = useBackButton()

	const navigate = useNavigate()

	// onMount(() => {
	// 	backButton.onClick(() => {
	// 		navigate('/')
	// 	})
		
	// })

	// onCleanup(() => {
	// 	backButton.offClick(() => {
	// 		navigate('/')
	// 	})
	// })

	const filteredSuggestions = () =>
		search().length > 0
			? mockSuggestions.filter(s => s.toLowerCase().includes(search().toLowerCase()))
			: []

	const wishes = useQuery<Wish[]>(() => ({
		queryKey: ['feed', search()],
		queryFn: () => fetchFeed(search()),
	}))

	const handleSuggestionClick = (suggestion: string) => {
		setSearch(suggestion)
		setSearchMode(false)
	}

	const handleInput = (e: any) => {
		setSearch(e.target.value)
	}

	const handleSearchOpen = () => {
		setSearchMode(true)
		setTimeout(() => searchInput()?.focus(), 0)

	}

	const handleSearchClose = () => {
		setSearch('')
		setSearchMode(false)
	}


	


	return (
		<div class="relative flex flex-col items-center bg-none w-full h-screen overflow-hidden">
			
			<Show when={!searchMode()}>
				<div class="fixed top-0 left-0 right-0 z-10 bg-gradient-to-t from-transparent to-white h-20">
					<div
						class={cn('h-20 flex-shrink-0 w-full flex flex-row justify-between items-center p-5', 'flex')}>
						<button
							class="flex items-center justify-center bg-secondary rounded-full size-10"
							onClick={
								() => {
									navigate('/search-feed')
								}
							}
						>
							<span class="material-symbols-rounded text-[20px]">search</span>
						</button>
						<p class="text-black text-xl font-extrabold">Discover</p>
						<Link href="/categories-edit" state={{ from: '/feed' }}
							class="flex items-center justify-center bg-secondary rounded-full size-10">
							<span class="material-symbols-rounded text-[20px]">page_info</span>
						</Link>
					</div>
				</div>
				<WishesGrid wishes={wishes as any} source="/feed" />
			</Show>
		</div>
	)
}

export default FeedPage