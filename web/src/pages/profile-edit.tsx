import { useNavigate } from '@solidjs/router'
import { createSignal, onCleanup, onMount } from 'solid-js'
import { saveUserPreferences } from '~/lib/api'
import { useMainButton } from '~/lib/useMainButton'
import { addToast } from '~/components/toast'
import { setUser, store } from '~/store'

export default function ProfileEditPage() {
    const [name, setName] = createSignal(store.user?.name)
    const [username, setUsername] = createSignal(store.user?.username || '')
    const [email, setEmail] = createSignal(store.user?.email || '')
    const [avatar, setAvatar] = createSignal(store.user?.avatar_url || '')
    const [avatarFile, setAvatarFile] = createSignal<File | null>(null)

    const navigate = useNavigate()
    const mainButton = useMainButton()

    function isEmailValid(email: string) {
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email)
    }

    const handleImageChange = (event: Event) => {
        const target = event.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
            const file = target.files[0]
            const reader = new FileReader()
            reader.onload = e => {
                setAvatar(e.target?.result as string)
                setAvatarFile(file)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async () => {
        if (!isEmailValid(email())) {
            addToast(
                'Please enter a valid email',
                false,
                '10px',
                '#f26868',
                '250px',
            )
            return
        }

        try {
            let avatarUrl = store.user?.avatar_url

            const { data, error } = await saveUserPreferences({
                name: name(),
                username: username(),
                email: email(),
                interests: store.user?.interests.map(i => i.id),
            })

            if (error) {
                addToast(error)
            } else {
                setUser(data)
                addToast('Saved')
                navigate('/')
            }
        } catch (e) {
            console.error(e)
            addToast(
                'Failed to update profile',
                false,
                '10px',
                '#f26868',
                '250px',
            )
        }
    }

    onMount(() => {
        mainButton.onClick(handleSave)
        mainButton.enable('Save')
    })

    onCleanup(() => {
        mainButton.offClick(handleSave)
        mainButton.hide()
    })

    return (
        <div class="flex w-full flex-col items-center px-4 py-6">
            <div class="relative mb-8">
                <div
                    class="h-24 w-24 rounded-full bg-cover bg-center"
                    style={{
                        'background-image': `url(${avatar() || '/placeholder.jpg'})`,
                    }}
                />
                <label
                    for="avatar-upload"
                    class="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white"
                >
                    <span class="material-symbols-rounded text-[16px]">
                        photo_camera
                    </span>
                </label>
                <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    class="hidden"
                />
            </div>

            <div class="w-full space-y-6">
                <div class="flex w-full flex-col space-y-1.5">
                    <label class="mb-1 text-xs font-medium text-secondary-foreground">
                        Visible name
                    </label>
                    <input
                        value={name()}
                        onInput={e => setName(e.currentTarget.value)}
                        class="h-12 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold focus:outline-none"
                    />
                </div>

                <div class="flex w-full flex-col space-y-1.5">
                    <label class="text-xs font-medium text-secondary-foreground">
                        Board link
                    </label>
                    <div class="flex h-12 items-center rounded-xl bg-secondary px-3 py-2 text-sm font-semibold">
                        <span class="text-muted-foreground">wshd.xyz/</span>
                        <input
                            value={username()}
                            onInput={e => setUsername(e.currentTarget.value)}
                            class="flex-1 bg-transparent text-foreground focus:outline-none"
                        />
                    </div>
                </div>

                <div class="flex w-full flex-col space-y-1.5">
                    <label class="text-xs font-medium text-secondary-foreground">
                        E-mail (not visible to anyone)
                    </label>
                    <input
                        type="email"
                        value={email()}
                        onInput={e => setEmail(e.currentTarget.value)}
                        class="h-12 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold focus:outline-none"
                    />
                </div>
            </div>
        </div>
    )
}
