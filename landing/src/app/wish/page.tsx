
import WishCard from '@/components/WishCard';
import { fetchWishes } from '@/api/wishes';
import type { Wish } from '@/types/wish';
import '@/app/globals.css';
import ShareButton from '@/components/ShareButton';


const WishesList = async () => {

    let wishes: Wish[] = [];
  
    try {
      wishes = await fetchWishes();
    } catch (error) {
      console.error('Failed to fetch wishes:', error);
      wishes = [];
    }
  
    const getColumnWishes = (columnIndex: number) => {
      return wishes.filter((_, index) => index % 4 === columnIndex);
    };
    return (
        <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Discover Wishes</h1>
            <ShareButton />
          </div>

          {wishes && wishes.length > 0 ? (
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((columnIndex) => (
                <div key={columnIndex} className="flex-1 flex flex-col gap-4">
                  {getColumnWishes(columnIndex).map((wish) => (
                    <WishCard key={wish.id} wish={wish} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="overflow-hidden animate-pulse">
                  <div className="aspect-[2/3] bg-gray-300"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
}

export default WishesList
