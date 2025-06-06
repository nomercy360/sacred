import Link from 'next/link';
import Image from 'next/image';
import { Wish } from '../types/wish';

interface WishCardProps {
  wish: Wish;
}

const WishCard = ({ wish }: WishCardProps) => {
  const primaryImage = wish.images?.sort((a, b) => a.position - b.position)[0];
  const imageUrl = primaryImage 
    ? `https://assets.peatch.io/cdn-cgi/image/width/${primaryImage.url}`
    : null;

  const originalWidth = primaryImage?.width || 600;
  const originalHeight = primaryImage?.height || 900;
  const aspectRatio = originalHeight / originalWidth;

  return (
    <Link href={`/wish/${wish.id}`} className="block rounded-[25px] overflow-hidden">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={wish.name}
          width={600}
          height={600 * aspectRatio}
          className="w-full h-auto object-cover"
          loading="lazy"
          unoptimized
        />
      ) : (
        <div
          style={{ width: '600px', height: `${600 * (3 / 2)}px` }} // fallback 2:3
          className="bg-gray-200 flex items-center justify-center rounded-[25px]"
        >
          <span className="text-gray-400">No image</span>
        </div>
      )}
    </Link>
  );
};

export default WishCard;