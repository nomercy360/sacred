import { Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { Wish } from '../types/wish';

interface WishCardProps {
  wish: Wish;
}

const WishCard: Component<WishCardProps> = (props) => {
  const primaryImage = () => props.wish.images.sort((a, b) => a.position - b.position)[0];
  const imageUrl = () => {
    const image = primaryImage();
    return image ? `https://assets.peatch.io/cdn-cgi/image/width=400/${image.url}` : null;
  };

  return (
    <A href={`/wish/${props.wish.id}`} class="block overflow-hidden">
      <Show when={imageUrl()} fallback={
        <div class="aspect-[2/3] bg-gray-200 flex items-center justify-center">
          <span class="text-gray-400">No image</span>
        </div>
      }>
        <img 
          src={imageUrl()!} 
          alt={props.wish.name}
          class="w-full object-cover"
          loading="lazy"
        />
      </Show>
    </A>
  );
};

export default WishCard;