import { For, Show } from 'solid-js'
import { cn } from '~/lib/utils'
import { createQuery } from '@tanstack/solid-query'
import { fetchCategories, fetchProfiles } from '~/lib/api'

type SelectCategoriesProps = {
	selectedCategories: string[]
	setSelectedCategories: (categories: string[]) => void
}

export default function CategoriesSelect(props: SelectCategoriesProps) {
	function toggleCategory(id: string) {
		const index = props.selectedCategories.indexOf(id)
		if (index === -1) {
			props.setSelectedCategories([...props.selectedCategories, id])
		} else {
			props.setSelectedCategories(props.selectedCategories.filter((c) => c !== id))
		}
		window.Telegram.WebApp.HapticFeedback.selectionChanged()
	}

	function isSelected(id: string) {
		return props.selectedCategories.includes(id)
	}

	const categories = createQuery(() => ({
		queryKey: ['categories'],
		queryFn: () => fetchCategories(),
	}))


	return (
		<div class="pb-0.5 grid grid-cols-3 gap-[2px] w-full">
			<Show when={categories.data}>
				<For each={categories.data}>
					{(category) => (
						<button
							style={{ 'background-image': !isSelected(category.id) ? `url(${category.image_url}), url('/placeholder.jpg')` : '' }}
							class={cn('rounded-3xl flex items-center justify-center aspect-square bg-cover bg-center ', isSelected(category.id) && 'bg-primary')}
							onClick={() => toggleCategory(category.id)}
						>
							<p class="text-white font-bold">
								{category.name}
							</p>
						</button>
					)}
				</For>
			</Show>
		</div>
	)
}
