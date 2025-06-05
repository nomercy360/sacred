import { createMutation, useQueryClient } from "@tanstack/solid-query";
import { copyWish, deleteWish, Wish } from "~/lib/api";
import { store, setStore } from "~/store";
import { addToast } from "./toast";
import { createMemo, Show } from "solid-js";
import { cn } from "~/lib/utils";

const AddRemoveButton = (props: { wish: Wish; source: string }) => {
    const queryClient = useQueryClient();

    const copyId = createMemo(() => {
        const feed = queryClient.getQueryData<Wish[]>(['feed', store.search]);
        return feed?.find(w => w.id === props.wish.id)?.copy_id ?? null;
    });

    const addToBoard = createMutation(() => ({
        mutationFn: (wishId: string) => copyWish(wishId),
        onSuccess: (data) => {
            // Обновляем данные в кэше
            updateWishState(data.id);
            addToast('Added to board');
        },
        onError: () => {
            addToast('Failed to add to board');
        }
    }));

    const removeFromBoard = createMutation(() => ({
        mutationFn: (wishId: string) => {
            const wish = queryClient.getQueryData<Wish[]>(['feed', store.search])
                ?.find(w => w.id === wishId);
            if (!wish?.copy_id) throw new Error('No copied wish id');
            return deleteWish(wish.copy_id);
        },
        onSuccess: () => {
            // Обновляем данные в кэше
            updateWishState(null);
            addToast('Removed from board');
        },
        onError: () => {
            addToast('Failed to remove from board');
        }
    }));

    const updateWishState = (copyId: string | null) => {
        // 1. Обновляем feed
        queryClient.setQueryData(['feed', store.search], (old: Wish[] | undefined) => {
            if (!old) return old;
            return old.map(w => 
                w.id === props.wish.id ? { ...w, copy_id: copyId } : w
            );
        });

        // 2. Обновляем store.wishes
        setStore('wishes', (old: Wish[]) => {
            if (!old) return old;
            return copyId 
                ? [{ ...props.wish, copy_id: copyId }, ...old]
                : old.filter(w => w.id !== props.wish.id);
        });

        // 3. Инвалидируем связанные запросы
        queryClient.invalidateQueries({ queryKey: ['user', 'wishes'] });
        queryClient.invalidateQueries({ queryKey: ['item', props.wish.id] });

    };

    const handleClick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            if (copyId()) {
                await removeFromBoard.mutateAsync(props.wish.id);
            } else {
                await addToBoard.mutateAsync(props.wish.id);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <Show when={props.source === '/feed'}>
            <button
                class={cn(
                    "absolute top-3 right-3 rounded-full size-5 flex items-center justify-center shadow z-10",
                    copyId() ? "bg-primary" : "bg-white"
                )}
                onClick={handleClick}
                type="button"
                aria-label={copyId() ? "Remove from board" : "Add to board"}
            >
                <span class={cn(
                    "material-symbols-rounded text-sm",
                    copyId() ? "text-white" : "text-primary"
                )}>
                    {copyId() ? "check" : "add"}
                </span>
            </button>
        </Show>
    );
};

export default AddRemoveButton;