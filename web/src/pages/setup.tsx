import { createEffect, createResource, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js'
import { cn } from '~/lib/utils'
import { fetchCategories, saveUserPreferences } from '~/lib/api'
import { showToast } from '~/components/ui/toast'
import { useNavigate } from '@solidjs/router'
import { setUser, store } from '~/store'


type SetupHeaderProps = {
	title: string
	description: string
	step: number
}


function SetupHeader(props: SetupHeaderProps) {

	const maxSteps = 3

	return (
		<div class="flex-shrink-0 max-w-[350px] text-center py-6 flex flex-col items-center justify-start w-full">
			<div class="flex flex-row items-center justify-center space-x-1">
				<For each={[...Array(maxSteps).keys()]}>
					{(index) => (
						<div
							class={cn(
								'w-4 h-1.5 rounded-xl',
								index === props.step - 1 ? 'bg-primary' : 'bg-muted',
							)}
						/>
					)}
				</For>
			</div>
			<p class="mt-5 leading-tight text-2xl font-bold">
				{props.title}
			</p>
			<p class="mt-2 text-sm text-secondary-foreground">
				{props.description}
			</p>
		</div>
	)
}

type Category = {
	id: number
	name: string
	image_url: string
}

export default function SetupProfilePage() {
	const [selectedCategories, setSelectedCategories] = createSignal<number[]>([])

	const [step, setStep] = createSignal(1)
	const [email, setEmail] = createSignal('')
	const [emailInput, setEmailInput] = createSignal<HTMLInputElement | null>(null)

	const navigate = useNavigate()

	function toggleCategory(id: number) {
		const index = selectedCategories().indexOf(id)
		if (index === -1) {
			setSelectedCategories([...selectedCategories(), id])
		} else {
			setSelectedCategories(selectedCategories().filter((c) => c !== id))
		}
		window.Telegram.WebApp.HapticFeedback.selectionChanged()
	}

	function isSelected(id: number) {
		return selectedCategories().includes(id)
	}

	function ButtonText() {
		if (selectedCategories().length === 0) {
			return <span class="text-muted-foreground">Choose at least 5</span>
		} else if (selectedCategories().length < 5) {
			return <span class="text-muted-foreground">Choose {5 - selectedCategories().length} more</span>
		} else {
			return <span class="text-white">Continue <span class="text-muted-foreground">{selectedCategories().length}</span></span>
		}
	}

	createEffect(() => {
		if (emailInput()) {
			emailInput()?.focus()
		}
	})

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
					showToast({
						title: error,
						variant: 'error',
					})
				} else {
					console.log('USER: ', data)
					setUser(data)
					navigate('/')
				}
			} catch (e) {
				console.error(e)
			}
		}
	}

	const [categories, {}] = createResource<Category[]>(fetchCategories, { initialValue: [] })

	const [bottom, setBottom] = createSignal(0)

	const updateBottom = () => {
		const safeArea = window.Telegram.WebApp.safeAreaInset.bottom
		setBottom(safeArea - 100)
	}

	onMount(() => {
		window.Telegram.WebApp.onEvent('safeAreaChanged', updateBottom)
		updateBottom()
	})

	onCleanup(() => {
		window.Telegram.WebApp.offEvent('safeAreaChanged', updateBottom)
	})

	return (
		<div
			class="w-full flex flex-col h-screen items-center justify-start"
		>
			<Switch>
				<Match when={step() === 1}>
					<SetupHeader
						title="Choose things you wish to&nbsp;discover"
						description="We will find and recommend products for you"
						step={1}
					/>
					<div class="pb-[200px] h-full w-full grid grid-cols-3 gap-0.5 overflow-y-scroll flex-shrink-0">
						<Show when={categories.state === 'ready'}>
							<For each={categories()}>
								{(category) => (
									<button
										style={{ 'background-image': !isSelected(category.id) ? `url(${category.image_url}), url('/placeholder.png')` : '' }}
										class={cn('rounded-2xl flex items-center justify-center aspect-square bg-cover bg-center', isSelected(category.id) && 'bg-blue-600')}
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
					<div
						class="flex flex-row items-center justify-center fixed h-[100px] left-0 w-full bg-gradient-to-t from-neutral-600 to-transparent z-10 backdrop-blur-[2px]"
						style={{ top: `${bottom()}px` }}
					>
						<button
							onClick={onContinue}
							class={cn('rounded-3xl h-12 flex items-center justify-center px-5 font-semibold text-nowrap', selectedCategories().length < 5 ? 'bg-muted text-muted-foreground' : 'bg-primary')}
							disabled={selectedCategories().length < 5}
						>
							{ButtonText()}
						</button>
					</div>
				</Match>
				<Match when={step() === 2}>
					<SetupHeader
						title="Add your email"
						description="No one sees it, and we will not spam you. By the way, you agree with terms and privacy policy by continuing."
						step={2}
					/>
					<input
						class="text-center text-2xl w-full h-20 px-4 mt-12 bg-transparent placeholder:text-secondary-foreground focus:outline-none focus:ring-0 focus:border-0"
						placeholder="Email"
						type="email"
						value={email()}
						onInput={(e) => setEmail(e.currentTarget.value)}
						autofocus={true}
						ref={setEmailInput}
					/>
					<div
						class="flex flex-row items-center justify-center fixed h-[100px] left-0 w-full bg-gradient-to-t from-neutral-600 to-transparent z-10 backdrop-blur-[2px]"
						style={{ top: `${bottom()}px` }}
					>
						<button
							class={cn('rounded-3xl h-12 flex items-center justify-center px-5 font-semibold text-nowrap', isEmailValid(email()) ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground')}
							disabled={isEmailValid(email())}
							onClick={onContinue}
						>
							Continue
						</button>
					</div>
				</Match>
			</Switch>
		</div>
	)
}
