import { Link } from "~/components/link";

export interface SearchingItemProps {
    profilePicture: string
    name: string
    followers: number
    userId: string
}

export function SearchingItem({ profilePicture, name, followers, userId }: SearchingItemProps) {
    return (
        <div class="flex flex-row items-center w-full justify-between mx-5 my-3 py-2">
            <Link href={`/profiles/${userId}`} class="flex flex-row items-center gap-2 flex-1">
                <img src={profilePicture} alt={name} class="w-10 h-10 rounded-full object-cover" />
                <div class="flex flex-col items-start">
                    <p class="text-sm font-bold">{name}</p>
                    <p class="text-xs text-gray-500">{followers} followers</p>
                </div>
            </Link>
            <button class="w-20 h-10 rounded-full flex items-center justify-center bg-secondary">Follow</button>
        </div>
    )
}