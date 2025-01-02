import { createEffect, createSignal, Match, onCleanup, onMount, Switch } from 'solid-js'
import { saveUserPreferences } from '~/lib/api'
import { showToast } from '~/components/ui/toast'
import { useNavigate } from '@solidjs/router'
import { setUser } from '~/store'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import FormLayout from '~/components/form-layout'
import FormInput from '~/components/form-input'
import CategoriesSelect from '~/components/categories-select'


type Category = {
	id: string
	name: string
	image_url: string
}

export default function SetupProfilePage() {
	const [selectedCategories, setSelectedCategories] = createSignal<string[]>([])

	const [step, setStep] = createSignal(1)
	const [email, setEmail] = createSignal('')

	const mainButton = useMainButton()

	const navigate = useNavigate()

	const backButton = useBackButton()

	function isEmailValid(email: string) {
		return !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email)
	}

	const onContinue = async () => {
		if (step() === 1) {
			setStep(2)
		} else {
			try {
				const { data, error } = await saveUserPreferences({
					email: email(),
					interests: selectedCategories(),
				})
				if (error) {
					showToast({ title: error, variant: 'error' })
				} else {
					setUser(data)
					navigate('/')
				}
			} catch (e) {
				console.error(e)
			}
		}
	}

	function decrementStep() {
		setStep(step() - 1)
	}

	createEffect(() => {
		if (step() === 1) {
			backButton.hide()
			backButton.offClick(decrementStep)

			if (selectedCategories().length < 5) {
				mainButton.disable('Select at least 5 categories')
			} else {
				mainButton.enable('Continue')
			}
		} else if (step() === 2) {
			backButton.setVisible()
			backButton.onClick(decrementStep)

			if (isEmailValid(email())) {
				mainButton.disable('Continue')
			} else {
				mainButton.enable('Continue')
			}
		}
	})

	onMount(() => {
		mainButton.onClick(onContinue)
	})

	onCleanup(() => {
		mainButton.offClick(onContinue)
		mainButton.hide()
		backButton.offClick(decrementStep)
		backButton.hide()
	})

	const formHeaders = [
		{
			title: 'Choose things you wish to discover',
			description: 'We will find and recommend products for you',
			step: 1,
		},
		{
			title: 'Add your email',
			description: 'No one sees it, and we will not spam you. By the way, you agree with terms and privacy policy by continuing.',
			step: 2,
		},
	]

	return (
		<FormLayout
			title={formHeaders[step() - 1].title}
			description={formHeaders[step() - 1].description}
			step={1}
			maxSteps={2}
		>
			<Switch>
				<Match when={step() === 1}>
					<CategoriesSelect
						selectedCategories={selectedCategories()}
						setSelectedCategories={setSelectedCategories}
					/>
				</Match>
				<Match when={step() === 2}>
					<FormInput
						placeholder="Email"
						type="email"
						value={email()}
						onInput={(e) => setEmail(e.currentTarget.value)}
						autofocus={true}
					/>
				</Match>
			</Switch>
		</FormLayout>
	)
}
