import { store } from '~/store'


const FeedPage = () => {
	return (
		<div
			class="relative w-full flex flex-col h-screen bg-gray-800 text-white overflow-hidden"
		>
			Hello! {store.user?.username}
		</div>
	)
}

export default FeedPage
