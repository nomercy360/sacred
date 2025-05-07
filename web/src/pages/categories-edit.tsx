import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { saveUserInterests } from '~/lib/api'
import { useNavigate } from '@solidjs/router'
import { setUser, store } from '~/store'
import { useMainButton } from '~/lib/useMainButton'
import CategoriesSelect from '~/components/categories-select'

export default function CategoriesEdit() {
	const [selectedCategories, setSelectedCategories] = createSignal<string[]>([])

	const mainButton = useMainButton()

	const navigate = useNavigate()

	const onContinue = async () => {
		const { data, error } = await saveUserInterests(selectedCategories())
		if (!error) {
			setUser(data)
			navigate('/feed')
		}
	}

	createEffect(() => {
		if (selectedCategories().length < 5) {
			mainButton.disable('Select at least 5 categories')
		} else {
			mainButton.enable('Continue')
		}
	})

	createEffect(() => {
		if (store.user?.interests) {
			setSelectedCategories(store.user.interests.map((i) => i.id))
		}
	})

	onMount(() => {
		mainButton.onClick(onContinue)
	})

	onCleanup(() => {
		mainButton.offClick(onContinue)
		mainButton.hide()
	})

	return (
		<div class="text-center h-screen overflow-y-scroll flex flex-col items-center w-full">
			<div class="px-8 pb-7 pt-6">
				<p class="font-extrabold text-xl">
					Choose things you wish to discover
				</p>
			</div>
			<CategoriesSelect
				selectedCategories={selectedCategories()}
				setSelectedCategories={setSelectedCategories}
			/>
		</div>
	)
}
