import { For, Show } from 'solid-js'
import { cn } from '~/lib/utils'

type FormHeaderProps = {
    title?: string
    description?: string
    step: number
    children: any
    maxSteps: number
}

export default function FormLayout(props: FormHeaderProps) {
    return (
        <div class="flex h-screen w-full flex-col items-center justify-start overflow-y-scroll">
            <div class="flex w-full max-w-[350px] flex-shrink-0 flex-col items-center justify-start py-6 text-center">
                <div class="flex flex-row items-center justify-center space-x-1">
                    <For each={[...Array(props.maxSteps).keys()]}>
                        {index => (
                            <div
                                class={cn(
                                    'h-1.5 w-4 rounded-xl',
                                    index === props.step - 1
                                        ? 'bg-primary'
                                        : 'bg-muted',
                                )}
                            />
                        )}
                    </For>
                </div>
                <Show when={props.title}>
                    <p class="mt-5 text-2xl font-extrabold leading-tight">
                        {props.title}
                    </p>
                </Show>
                <Show when={props.description}>
                    <p class="mt-2 text-sm text-secondary-foreground">
                        {props.description}
                    </p>
                </Show>
            </div>
            {props.children}
        </div>
    )
}
