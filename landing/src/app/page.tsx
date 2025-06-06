import '@/app/globals.css';
import Layout from '@/app/layout';
import WishesList from '@/app/wish/page';

export default async function WishFeed() {


  return (
    <Layout>
      <WishesList />
    </Layout>
  );
}