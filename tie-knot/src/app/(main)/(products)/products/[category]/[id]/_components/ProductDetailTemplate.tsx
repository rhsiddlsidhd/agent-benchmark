import { ProductFeatures } from "@/client/components/organisms";
import { Product, PremiumFeature } from "@/server/services";
import { ProductSummary } from "./ProductSummary";
import { ProductViewTracker } from "./ProductViewTracker";

interface ProductDetailTemplateProps {
  product: Product;
  options: PremiumFeature[];
}

const ProductDetailTemplate = ({ product, options }: ProductDetailTemplateProps) => {
  return (
    <main className="bg-background min-h-screen">
      <ProductViewTracker productId={product._id} />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-4xl">
          <ProductSummary product={product} options={options} />
          <ProductFeatures options={options} />
        </div>
      </div>
    </main>
  );
};

export { ProductDetailTemplate };
