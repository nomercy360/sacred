import {
    createEffect,
    createSignal,
    Match,
    onCleanup,
    onMount,
    Switch,
} from 'solid-js'
import { saveUserPreferences } from '~/lib/api'
import { useNavigate } from '@solidjs/router'
import { setUser } from '~/store'
import { useMainButton } from '~/lib/useMainButton'
import { useBackButton } from '~/lib/useBackButton'
import FormLayout from '~/components/form-layout'
import FormInput from '~/components/form-input'
import CategoriesSelect from '~/components/categories-select'
import { addToast } from '~/components/toast'

export default function SetupProfilePage() {
    const [selectedCategories, setSelectedCategories] = createSignal<string[]>(
        [],
    )

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
        } else if (step() === 2) {
            setStep(3)
        } else if (step() === 3) {
            try {
                const { data, error } = await saveUserPreferences({
                    email: email(),
                    interests: selectedCategories(),
                })
                if (error) {
                    addToast(error)
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

            mainButton.enable('Set up profile')
        } else if (step() === 2) {
            backButton.setVisible()
            backButton.onClick(decrementStep)
            if (isEmailValid(email())) {
                mainButton.disable('Continue')
            } else {
                mainButton.enable('Continue')
            }
        } else if (step() === 3) {
            if (selectedCategories().length < 5) {
                mainButton.disable('Select at least 5 categories')
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
            title: undefined,
            description: undefined,
        },
        {
            title: 'Add your email',
        },
        {
            title: 'Choose things you wish to discover',
        },
    ]

    return (
        <FormLayout
            title={formHeaders[step() - 1].title}
            description={formHeaders[step() - 1].description}
            step={1}
            maxSteps={3}
        >
            <Switch>
                <Match when={step() === 1}>
                    <div class="px-8 text-center">
                        <p class="text-xl font-extrabold">Gifts are solved</p>
                        <p class="mt-3 text-base">
                            Wished helps to find and save gift ideas for
                            yourself and loved ones, and never miss important
                            dates.
                        </p>
                    </div>
                </Match>
                <Match when={step() === 2}>
                    <div class="flex h-full flex-col items-center justify-between px-10 pb-5 text-center">
                        <div class="flex flex-grow items-center justify-center">
                            <FormInput
                                placeholder="email@website.com"
                                type="email"
                                value={email()}
                                onInput={e => setEmail(e.currentTarget.value)}
                                autofocus={true}
                            />
                        </div>
                        <p class="text-sm text-muted-foreground">
                            No one sees it, and we will not spam you. By the
                            way, you agree with terms and privacy policy by
                            continuing.
                        </p>
                    </div>
                </Match>
                <Match when={step() === 3}>
                    <CategoriesSelect
                        selectedCategories={selectedCategories()}
                        setSelectedCategories={setSelectedCategories}
                    />
                </Match>
            </Switch>
        </FormLayout>
    )
}
