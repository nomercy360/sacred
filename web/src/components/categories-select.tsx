import { useQuery } from '@tanstack/solid-query'
import { For, Show } from 'solid-js'
import { fetchCategories } from '~/lib/api'
import { cn } from '~/lib/utils'

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
            props.setSelectedCategories(
                props.selectedCategories.filter(c => c !== id),
            )
        }
        window.Telegram.WebApp.HapticFeedback.selectionChanged()
    }

    function isSelected(id: string) {
        return props.selectedCategories.includes(id)
    }

    const categories = useQuery(() => ({
        queryKey: ['categories'],
        queryFn: () => fetchCategories(),
    }))

    return (
        <div class="grid w-full grid-cols-3 gap-[2px] px-[1.5px] pb-0.5">
            <Show when={categories.data}>
                <For each={categories.data}>
                    {category => (
                        <button
                            style={{
                                'background-image': !isSelected(category.id)
                                    ? `url(${category.image_url}), url('/placeholder.jpg')`
                                    : '',
                            }}
                            class={cn(
                                'flex aspect-square items-center justify-center rounded-3xl bg-cover bg-center',
                                isSelected(category.id) && 'bg-primary',
                            )}
                            onClick={() => toggleCategory(category.id)}
                        >
                            <p class="font-bold text-white">{category.name}</p>
                        </button>
                    )}
                </For>
            </Show>
        </div>
    )
}
