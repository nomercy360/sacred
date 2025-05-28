import { Component, For, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { createAsync } from '@solidjs/router';
import { fetchWish } from '../../api/wishes';
import { SEOHead } from '../../components/SEOHead';

export default function WishPage() {
  const params = useParams();
  const wish = createAsync(() => fetchWish(params.id));

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getImageUrl = (url: string, width: number = 800) => {
    return `https://assets.peatch.io/cdn-cgi/image/width=${width}/${url}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <>
      <Show when={wish()}>
        <SEOHead
          title={wish()!.name}
          description={`Check out ${wish()!.name} from ${extractDomain(wish()!.url)}`}
          image={wish()!.images[0] ? getImageUrl(wish()!.images[0].url) : undefined}
          url={`https://sacred.peatch.io/wish/${params.id}`}
          type="article"
          publishedTime={wish()!.created_at}
        />
      </Show>
      
      <div class="min-h-screen bg-white">
        <Show when={wish()} fallback={
          <div class="flex items-center justify-center min-h-screen">
            <div class="animate-pulse text-gray-500">Loading...</div>
          </div>
        }>
          <div class="max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div class="text-center mb-8">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                {wish()!.name}
              </h1>
              <div class="text-gray-600">
                from {extractDomain(wish()!.url)}
              </div>
              <div class="text-sm text-gray-400 mt-1">
                Added {formatDate(wish()!.created_at)}
              </div>
            </div>

            {/* Images */}
            <div class="space-y-4 mb-8">
              <For each={wish()!.images.sort((a, b) => a.position - b.position)}>
                {(image) => (
                  <div class="max-w-sm mx-auto">
                    <img 
                      src={getImageUrl(image.url)}
                      alt={wish()!.name}
                      class="rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}
              </For>
            </div>

            {/* Categories */}
            <Show when={wish()!.categories.length > 0}>
              <div class="mb-8">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
                <div class="flex flex-wrap gap-2">
                  <For each={wish()!.categories}>
                    {(category) => (
                      <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {category.name}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Visit Link */}
            <div class="mt-8">
              <a 
                href={wish()!.url}
                target="_blank"
                rel="noopener noreferrer"
                class="w-full bg-black text-white py-3 px-6 rounded-lg text-center block font-medium hover:bg-gray-900 transition-colors"
              >
                Visit {extractDomain(wish()!.url)}
              </a>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}