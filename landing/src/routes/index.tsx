import { Component, For, Show, createResource } from 'solid-js';
import { Title } from '@solidjs/meta';
import { fetchWishes } from '../api/wishes';
import WishCard from '../components/WishCard';
import { createAsync } from '@solidjs/router';

const FeedPage: Component = () => {
  const wishes = createAsync(() => fetchWishes());

  return (
    <>
      <Title>Wish Feed</Title>
      <div class="min-h-screen bg-gray-50">
        <div class="px-5 py-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-8">Discover Wishes</h1>
          
          <Show 
            when={wishes()} 
            fallback={
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <For each={Array(12)}>
                  {() => (
                    <div class="overflow-hidden animate-pulse">
                      <div class="aspect-[2/3] bg-gray-300"></div>
                    </div>
                  )}
                </For>
              </div>
            }
          >
            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-4">
                <For each={wishes()?.filter((_, index) => index % 4 === 0)}>
                  {(wish) => <WishCard wish={wish} />}
                </For>
              </div>
              <div class="flex-1 flex flex-col gap-4">
                <For each={wishes()?.filter((_, index) => index % 4 === 1)}>
                  {(wish) => <WishCard wish={wish} />}
                </For>
              </div>
              <div class="flex-1 flex flex-col gap-4">
                <For each={wishes()?.filter((_, index) => index % 4 === 2)}>
                  {(wish) => <WishCard wish={wish} />}
                </For>
              </div>
              <div class="flex-1 flex flex-col gap-4">
                <For each={wishes()?.filter((_, index) => index % 4 === 3)}>
                  {(wish) => <WishCard wish={wish} />}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </>
  );
};

export default FeedPage;