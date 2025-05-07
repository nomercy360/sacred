import { store } from '~/store'
import { Link } from '~/components/link'
import { createSignal } from 'solid-js'

const ShareProfile = () => {
	const [isCopied, setIsCopied] = createSignal(false)

	function shareProfileURL() {
		const url =
			'https://t.me/share/url?' +
			new URLSearchParams({
				url: 'https://t.me/sacred_wished/app?startapp=u_' + store.user?.username,
			}).toString() +
			`&text=Check out ${store.user?.name}'s wishes`

		window.Telegram.WebApp.openTelegramLink(url)
	}

	function copyProfileURL() {
		const profileURL = `https://wshd.xyz/i/${store.user?.username}`
		navigator.clipboard
			.writeText(profileURL)
			.then(() => {
				setIsCopied(true)
				setTimeout(() => setIsCopied(false), 2000)
			})
			.catch(() => {
				console.error('Failed to copy text')
			})
	}

	return (
		<div class="relative w-full flex flex-col justify-between h-screen overflow-hidden">
			<div class="p-5 flex flex-row items-center justify-between">
				<div></div>
				<Link
					class="flex items-center justify-center bg-secondary rounded-full size-10"
					href={'/people'}
				>
					<span class="material-symbols-rounded text-[20px]">close</span>
				</Link>
			</div>
			<div class="flex flex-col items-center justify-center text-center px-8">
				<p class="font-extrabold text-2xl leading-tight">
					Invite friends to&nbsp;unlock space for your wishes
				</p>
				<p class="mt-2">
					I am a designer who knows how to layout neat books, build native websites and create beautiful branding.
				</p>
				<div
					class="w-fit flex flex-row items-center justify-center space-x-5 mt-5 rounded-3xl bg-secondary px-4 h-11"
					onClick={copyProfileURL}
				>
					<span class="font-medium">wshd.xyz/i/{store.user?.username}</span>
					{isCopied() && <span class="text-green-500 ml-2">Copied!</span>}
					{!isCopied() && <span class="material-symbols-rounded text-[20px]">link</span>}
				</div>
			</div>
			<div class="w-full flex items-center justify-center my-12">
				<button
					class="px-4 bg-primary text-primary-foreground h-11 rounded-full font-bold"
					onClick={shareProfileURL}
				>
					Share link
				</button>
			</div>
		</div>
	)
}

export default ShareProfile
