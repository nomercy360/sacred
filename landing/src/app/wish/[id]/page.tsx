import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Wish } from '@/types/wish';
import CloseButton from '@/components/CloseButton';
import ShareButton from '@/components/ShareButton';




const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

type WishResponse = {
  wish: Wish;
};

async function fetchWish(id: string): Promise<Wish> {
  const response = await fetch(`${API_BASE_URL}/v1/wishes/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch wish');
  }

  const result: WishResponse = await response.json();
  return result.wish;
}

async function getWishData(id: string): Promise<Wish | null> {
  try {
    return await fetchWish(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const wish = await getWishData(params.id);

  if (!wish) {
    return {
      title: 'Not Found - Tingzzz',
      description: 'Wish not found',
    };
  }

  const extractDomain = (url: string | null) => {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getImageUrl = (url: string, width: number = 800) => {
    return `https://assets.peatch.io/cdn-cgi/image/width=${width}/${url}`;
  };

  const firstImage = (wish.images ?? [])[0];

  return {
    title: `${wish.name} - Tingzzz`,
    description: `${wish.name} from ${extractDomain(wish.url)}`,
    openGraph: {
      title: `${wish.name} - Tingzzz`,
      description: `${wish.name} from ${extractDomain(wish.url)}`,
      type: 'website',
      url: `${process.env.APP_URL || 'https://tingzzz.com'}/wish/${params.id}`,
      images: firstImage
        ? [
          {
            url: getImageUrl(firstImage.url, 1200),
            width: 1200,
            height: 630,
          },
        ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${wish.name} - Tingzzz`,
      description: `${wish.name} from ${extractDomain(wish.url)}`,
      images: firstImage ? [getImageUrl(firstImage.url, 1200)] : [],
    },
  };
}

export default async function WishPage({ params }: { params: { id: string } }) {

  const wish = await getWishData(params.id);

  if (!wish) {
    notFound();
  }

  const extractDomain = (url: string | null) => {
    if (!url) return '';
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
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className=" mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8 flex justify-between">
          <CloseButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{wish.name}</h1>
            <div className="text-gray-600">from {extractDomain(wish.url)}</div>
            <div className="text-sm text-gray-400 mt-1">Added {formatDate(wish.created_at)}</div>
          </div>
          <ShareButton />
        </div>

        <div className="max-w-2xl mx-auto">


          {/* Images */}
          <div className="space-y-4 mb-8">
            {(wish.images ?? [])
              .sort((a, b) => a.position - b.position)
              .map((image) => (
                <div key={image.url} className="max-w-sm mx-auto">
                  <Image
                    src={getImageUrl(image.url)}
                    alt={wish.name}
                    className="rounded-lg"
                    width={800}
                    height={800}
                    priority={false}
                  />
                </div>
              ))}
          </div>

          {/* Categories */}
          {(wish.categories ?? []).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {(wish.categories ?? []).map((category) => (
                  <span
                    key={category.id}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visit Link */}
          {(
            <div className="mt-8">
              <a
                href={wish.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-black text-white py-3 px-6 rounded-lg text-center block font-medium hover:bg-gray-900 transition-colors"
              >
                Visit {extractDomain(wish.url)}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}