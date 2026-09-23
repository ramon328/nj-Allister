import { Home } from "@/features/site/home";
import { featuredProducts, listCollections } from "@/features/catalog/queries";

export const revalidate = 300;

export default async function HomePage() {
  const [products, collections] = await Promise.all([featuredProducts(8), listCollections()]);
  return <Home products={products} collections={collections} />;
}
