import { getFirstImage } from "~/lib/utils";
import { ImageWithPlaceholder } from "./image-placeholder";
import { Link } from "./link";
import { Wish } from "~/lib/api";
import AddRemoveButton from "./add-remove-button";
import { createMemo } from "solid-js";
import { store } from "~/store";
import { queryClient } from "~/App";




const WishItem = (props: { wish: Wish & { copy_id: string | null }; source: string }) => {

  const image = createMemo(() => getFirstImage(props.wish));

  const reactiveWish = createMemo(() => {
    const feed = queryClient.getQueryData<Wish[]>(['feed', store.search]);
    return feed?.find(w => w.id === props.wish.id) ?? props.wish;
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
          src={`https://assets.peatch.io/cdn-cgi/image/width=400/${image().url}`}
          alt={props.wish.name}
          width={image().width}
          height={image().height}
        />
      </Link>
    </div>
  );
};


export default WishItem;