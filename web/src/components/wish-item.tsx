import { getFirstImage } from "~/lib/utils";
import { ImageWithPlaceholder } from "./image-placeholder";
import { Link } from "./link";
import { Wish } from "~/lib/api";
import AddRemoveButton from "./add-remove-button";
import { createMemo } from "solid-js";
import { store } from "~/store";
import { queryClient } from "~/App";

const WishItem = (props: { wish: Wish & { copy_id: string | null }; source: string }) => {

  const image = createMemo(() => {
    const img = getFirstImage(props.wish);
    return {
      url: `https://assets.peatch.io/cdn-cgi/image/width=400/${img.url}`,
      width: img.width,
      height: img.height
    };
  });

  const reactiveWish = createMemo(() => {
    const feed = queryClient.getQueryData<Wish[]>(['feed', store.search]);
    const foundWish = feed?.find(w => w.id === props.wish.id);
    
    return foundWish 
      ? { ...props.wish, ...foundWish }
      : props.wish;
  }, undefined, { equals: (a, b) => 
    a.id === b.id && 
    a.copy_id === b.copy_id && 
    a.name === b.name
  });

  return (
    <div class="relative">
      <AddRemoveButton wish={reactiveWish()} source={props.source} />
      <Link
        href={`/wishes/${props.wish.id}`}
        class="block border shadow-sm rounded-[25px] overflow-hidden"
        state={{ from: props.source }}
      >
        <ImageWithPlaceholder
          src={image().url}
          alt={props.wish.name}
          width={image().width}
          height={image().height}
        />
      </Link>
    </div>
  );
};

export default WishItem;