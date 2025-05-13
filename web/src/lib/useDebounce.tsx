import { onCleanup } from 'solid-js'

export default function useDebounce(
	signalSetter: (value: any) => void,
	delay: number,
) {
	let timerHandle: NodeJS.Timeout

	function debouncedSignalSetter(value: any) {
		clearTimeout(timerHandle)
		timerHandle = setTimeout(() => signalSetter(value), delay)
	}

	onCleanup(() => clearTimeout(timerHandle))
	return debouncedSignalSetter
}
