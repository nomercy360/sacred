import {For, Show, ErrorBoundary} from 'solid-js';
import {useParams, createAsync, RouteSectionProps, A, query} from '@solidjs/router';
import {Title, Meta} from '@solidjs/meta';
import {Wish} from "~/types/wish";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const getWishData = query(async (id: string): Promise<Wish | null> => {
    "use server";

    const response = await fetch(`${API_BASE_URL}/v1/wishes/${id}`);
    return await response.json();
}, "wish");

export const route = {
    preload: ({params}: RouteSectionProps) => getWishData(params.id)
};

export default function WishPage() {
    const params = useParams();
    const wish = createAsync(() => getWishData(params.id));

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
                <Title>{wish()!.name} - Tingzzz</Title>
                <Meta name="description" content={`${wish()!.name} from ${extractDomain(wish()!.url)}`} />
                <Meta property="og:title" content={`${wish()!.name} - Tingzzz`} />
                <Meta property="og:description" content={`${wish()!.name} from ${extractDomain(wish()!.url)}`} />
                <Meta property="og:type" content="product" />
                <Meta property="og:url" content={`${import.meta.env.VITE_APP_URL || 'https://tingzzz.com'}/wish/${params.id}`} />
                <Show when={wish()!.images.length > 0}>
                    <Meta property="og:image" content={getImageUrl(wish()!.images[0].url, 1200)} />
                    <Meta property="og:image:width" content="1200" />
                    <Meta property="og:image:height" content="630" />
                </Show>
                <Meta name="twitter:card" content="summary_large_image" />
                <Meta name="twitter:title" content={`${wish()!.name} - Tingzzz`} />
                <Meta name="twitter:description" content={`${wish()!.name} from ${extractDomain(wish()!.url)}`} />
                <Show when={wish()!.images.length > 0}>
                    <Meta name="twitter:image" content={getImageUrl(wish()!.images[0].url, 1200)} />
                </Show>
            </Show>
            
            <ErrorBoundary fallback={<div>Something went wrong!</div>}>
                <Show when={wish()} fallback={<div class="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
                    <div class="min-h-screen bg-white">
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
                </div>
                </Show>
            </ErrorBoundary>
        </>
    );
}
