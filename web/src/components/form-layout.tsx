import { For } from 'solid-js'
import { cn } from '~/lib/utils'

type FormHeaderProps = {
	title: string
	description: string
	step: number
	children: any
}


export default function FormLayout(props: FormHeaderProps) {

	const maxSteps = 3

	return (
		<div
			class="w-full flex flex-col h-screen items-center justify-start"
		>
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
				<p class="mt-5 leading-tight text-2xl font-extrabold">
					{props.title}
				</p>
				<p class="mt-2 text-sm text-secondary-foreground">
					{props.description}
				</p>
			</div>
			{props.children}
		</div>
	)
}
