import { createSignal } from 'solid-js'
import { Link } from '~/components/link'
import { store } from '~/store'

const ShareProfile = () => {
    const [isCopied, setIsCopied] = createSignal(false)

    function shareProfileURL() {
        const url =
            'https://t.me/share/url?' +
            new URLSearchParams({
                url:
                    'https://t.me/tingzbot/app?startapp=u_' +
                    store.user?.username,
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
        <div class="relative flex h-screen w-full flex-col justify-between overflow-hidden">
            <div class="flex flex-row items-center justify-between p-5">
                <div />
                <Link
                    class="flex size-10 items-center justify-center rounded-full bg-secondary"
                    href={'/people'}
                >
                    <span class="material-symbols-rounded text-[20px]">
                        close
                    </span>
                </Link>
            </div>
            <div class="flex flex-col items-center justify-center px-8 text-center">
                <p class="text-2xl font-extrabold leading-tight">
                    Invite friends to&nbsp;unlock space for your wishes
                </p>
                <p class="mt-2">
                    I am a designer who knows how to layout neat books, build
                    native websites and create beautiful branding.
                </p>
                <div
                    class="mt-5 flex h-11 w-fit flex-row items-center justify-center space-x-5 rounded-3xl bg-secondary px-4"
                    onClick={copyProfileURL}
                >
                    <span class="font-medium">
                        wshd.xyz/i/{store.user?.username}
                    </span>
                    {isCopied() && (
                        <span class="ml-2 text-green-500">Copied!</span>
                    )}
                    {!isCopied() && (
                        <span class="material-symbols-rounded text-[20px]">
                            link
                        </span>
                    )}
                </div>
            </div>
            <div class="my-12 flex w-full items-center justify-center">
                <button
                    class="h-11 rounded-full bg-primary px-4 font-bold text-primary-foreground"
                    onClick={shareProfileURL}
                >
                    Share link
                </button>
            </div>
        </div>
    )
}

export default ShareProfile
