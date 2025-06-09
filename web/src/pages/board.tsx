import { Match, Switch, For, Show, createMemo, createResource } from 'solid-js'
import { Link } from '~/components/link'
import { setStore, store } from '~/store'
import { getFirstImage, splitIntoGroups } from '~/lib/utils'
import { fetchUserWishes, Wish } from '~/lib/api'
import { ImageWithPlaceholder } from '~/components/image-placeholder'
import OnboardingPopup from '~/components/onboarding-popup'

export default function UserBoardPage() {
    const [wishesResource] = createResource(fetchUserWishes)

    // Сохраняем в store один раз, только при успехе
    createMemo(() => {
        if (wishesResource.state === 'ready') {
            setStore('wishes', wishesResource())
        }
    })

    const groupedWishes = createMemo(
        () => {
            return splitIntoGroups(store.wishes, 2)
        },
        undefined,
        {
            equals: (a, b) =>
                a.length === b.length &&
                a.every(
                    (group, i) =>
                        group.length === b[i].length &&
                        group.every((wish, j) => wish.id === b[i][j].id),
                ),
        },
    )

    const closeOnboardingPopup = async () => {
        window.Telegram.WebApp.CloudStorage.setItem('onboarding', 'done')
        setStore('onboarding', false)
    }

    return (
        <div class="relative flex h-screen w-full flex-col items-center overflow-y-auto pb-20">
            {/* Шапка */}
            <div class="fixed left-0 right-0 top-0 z-10 h-20 bg-gradient-to-t from-transparent to-white">
                <div class="flex h-20 w-full items-center justify-between p-5">
                    <Link
                        href="/profile/edit"
                        class="flex items-center space-x-2"
                    >
                        <img
                            src={store.user?.avatar_url}
                            alt={store.user?.name}
                            class="size-9 rounded-full"
                        />
                        <span class="text-xl font-extrabold">
                            {store.user?.name}
                        </span>
                    </Link>
                    <div class="flex items-center space-x-3">
                        <Link
                            href="/bookmarks"
                            state={{ from: '/' }}
                            class="flex size-10 items-center justify-center rounded-full bg-secondary"
                        >
                            <span class="material-symbols-rounded text-[20px]">
                                favorite
                            </span>
                        </Link>
                        <button class="flex size-10 items-center justify-center rounded-full bg-secondary">
                            <span class="material-symbols-rounded text-[20px]">
                                arrow_outward
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Контент */}
            <div class="w-full pt-20 text-center">
                <Switch>
                    <Match when={wishesResource.loading}>
                        <div class="grid grid-cols-2 gap-0.5 px-[1.5px]">
                            <For each={Array(6)}>
                                {() => (
                                    <div class="aspect-[3/4] animate-pulse rounded-[25px] bg-gray-200" />
                                )}
                            </For>
                        </div>
                    </Match>

                    <Match when={store.wishes.length > 0}>
                        <div class="grid grid-cols-2 gap-0.5 px-[1.5px]">
                            <For each={groupedWishes()}>
                                {group => (
                                    <div class="flex flex-col gap-0.5">
                                        <For each={group}>
                                            {(item: Wish) => {
                                                const imageDetails =
                                                    getFirstImage(item)
                                                return (
                                                    <Link
                                                        class="block overflow-hidden rounded-[25px] border border-[#00000010]"
                                                        href={`/wishes/${item.id}`}
                                                        state={{ from: '/' }}
                                                    >
                                                        <ImageWithPlaceholder
                                                            src={`https://assets.peatch.io/cdn-cgi/image/width=400/${imageDetails.url}`}
                                                            alt={item.name}
                                                            width={
                                                                imageDetails.width
                                                            }
                                                            height={
                                                                imageDetails.height
                                                            }
                                                        />
                                                    </Link>
                                                )
                                            }}
                                        </For>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Match>

                    <Match
                        when={
                            !store.wishes.length &&
                            wishesResource.state === 'ready'
                        }
                    >
                        <div class="pt-10 text-center text-lg font-medium text-gray-400">
                            No wishes yet...
                        </div>
                    </Match>
                </Switch>
            </div>

            <Show when={store.onboarding}>
                <OnboardingPopup onClose={closeOnboardingPopup} />
            </Show>
        </div>
    )
}
