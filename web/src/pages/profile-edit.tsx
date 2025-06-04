import { createSignal, onCleanup, onMount } from 'solid-js'
import { saveUserPreferences } from '~/lib/api'
import { useNavigate } from '@solidjs/router'
import { setUser, store } from '~/store'
import { addToast } from '~/components/toast'
import { useMainButton } from '~/lib/useMainButton'

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
			reader.onload = (e) => {
				setAvatar(e.target?.result as string)
				setAvatarFile(file)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSave = async () => {
		if (!isEmailValid(email())) {
			addToast('Please enter a valid email')
			return
		}

		try {
			let avatarUrl = store.user?.avatar_url

			const { data, error } = await saveUserPreferences({
				name: name(),
				username: username(),
				email: email(),
				interests: store.user?.interests.map((i) => i.id),
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
			addToast('Failed to update profile')
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
		<div class="flex flex-col items-center w-full px-4 py-6">
			<div class="mb-8 relative">
				<div
					class="w-24 h-24 rounded-full bg-cover bg-center "
					style={{ 'background-image': `url(${avatar() || '/placeholder.jpg'})` }}
				/>
				<label
					for="avatar-upload"
					class="absolute bottom-0 right-0 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
				>
					<span class="material-symbols-rounded text-[16px]">photo_camera</span>
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
				<div class="flex flex-col w-full space-y-1.5">
					<label class="text-xs font-medium text-secondary-foreground mb-1">Visible name</label>
					<input
						value={name()}
						onInput={(e) => setName(e.currentTarget.value)}
						class="focus:outline-none text-sm font-semibold h-12 px-3 py-2 bg-secondary rounded-xl"
					/>
				</div>

				<div class="flex flex-col w-full space-y-1.5">
					<label class="font-medium text-xs text-secondary-foreground">Board link</label>
					<div class="font-semibold text-sm bg-secondary flex items-center rounded-xl h-12 px-3 py-2">
						<span class="text-muted-foreground">wshd.xyz/</span>
						<input
							value={username()}
							onInput={(e) => setUsername(e.currentTarget.value)}
							class="text-foreground bg-transparent focus:outline-none flex-1"
						/>
					</div>
				</div>

				<div class="flex flex-col w-full space-y-1.5">
					<label class="font-medium text-xs text-secondary-foreground">
						E-mail (not visible to anyone)
					</label>
					<input
						type="email"
						value={email()}
						onInput={(e) => setEmail(e.currentTarget.value)}
						class="focus:outline-none text-sm font-semibold h-12 px-3 py-2 bg-secondary rounded-xl"
					/>
				</div>
			</div>
		</div>
	)
}
