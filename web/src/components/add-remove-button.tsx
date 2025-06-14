import { createMutation, useQueryClient } from '@tanstack/solid-query'
import { createMemo, Show } from 'solid-js'
import { copyWish, deleteWish, Wish } from '~/lib/api'
import { cn } from '~/lib/utils'
import { addToast } from '~/components/toast'
import { store, setStore } from '~/store'

const AddRemoveButton = (props: { wish: Wish; source: string }) => {
    const queryClient = useQueryClient()

    const copyId = createMemo(() => {
        const feed = queryClient.getQueryData<Wish[]>(['feed', store.search])
        return feed?.find(w => w.id === props.wish.id)?.copy_id ?? null
    })

    const commonMutationOptions = {
        onError: (error: Error, wishId: string) => {
            const isRemove = error.message.includes('No copied wish id')
            addToast(
                isRemove
                    ? 'Failed to remove from board'
                    : 'Failed to add to board',
                true,
                '90px',
                isRemove ? '#f26868' : undefined,
                isRemove ? '200px' : undefined,
            )
        },
    }

    const updateWishState = (newCopyId: string | null) => {
        queryClient.setQueryData(
            ['feed', store.search],
            (old: Wish[] | undefined) => {
                return old?.map(w =>
                    w.id === props.wish.id ? { ...w, copy_id: newCopyId } : w,
                )
            },
        )

        setStore('wishes', (old: Wish[]) => {
            if (!old) return old
            return newCopyId
                ? [{ ...props.wish, copy_id: newCopyId }, ...old]
                : old.filter(w => w.id !== props.wish.id)
        })

        queryClient.invalidateQueries({ queryKey: ['user', 'wishes'] })
        queryClient.invalidateQueries({ queryKey: ['item', props.wish.id] })
    }

    const addToBoard = createMutation(() => ({
        mutationFn: (wishId: string) => copyWish(wishId),
        ...commonMutationOptions,
        onSuccess: data => {
            updateWishState(data.id)
            addToast('Added to board', true, '90px', 'white', '165px')
        },
    }))

    const removeFromBoard = createMutation(() => ({
        mutationFn: (wishId: string) => {
            const wish = queryClient
                .getQueryData<Wish[]>(['feed', store.search])
                ?.find(w => w.id === wishId)
            if (!wish?.copy_id) throw new Error('No copied wish id')
            return deleteWish(wish.copy_id)
        },
        ...commonMutationOptions,
        onSuccess: () => {
            updateWishState(null)
            addToast('Removed from board', true, '90px', 'white', '200px')
        },
    }))

    const handleClick = async (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const currentCopyId = copyId()
        try {
            if (currentCopyId) {
                await removeFromBoard.mutateAsync(props.wish.id)
            } else {
                await addToBoard.mutateAsync(props.wish.id)
            }
        } catch (error) {
            console.error('Error handling wish:', error)
        }
    }

    const buttonClasses = createMemo(() =>
        cn(
            'absolute top-0 right-0 w-12 h-12 flex items-center justify-center z-10',
            'group',
        ),
    )

    const visualButtonClasses = createMemo(() =>
        cn(
            'rounded-full size-5 flex items-center justify-center shadow-sm',
            copyId() ? 'bg-primary' : 'bg-secondary',
        ),
    )

    const iconClasses = createMemo(() =>
        cn(
            'material-symbols-rounded text-sm flex items-center justify-center',
            copyId() ? 'text-white' : 'text-black',
        ),
    )

    return (
        <Show when={props.source === '/feed'}>
            <button
                class={buttonClasses()}
                onClick={handleClick}
                type="button"
                aria-label={copyId() ? 'Remove from board' : 'Add to board'}
            >
                <span class={visualButtonClasses()}>
                    <span class={iconClasses()}>
                        {copyId() ? 'check' : 'add'}
                    </span>
                </span>
            </button>
        </Show>
    )
}

export default AddRemoveButton
