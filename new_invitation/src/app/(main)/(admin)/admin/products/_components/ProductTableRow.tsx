import { Eye, Heart, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Product } from "@/services/product.service";
import ProductThumbnail from "@/components/molecules/ProductThumbnail";
import ProductTableRowAction from "@/components/organisms/ProductTableRowAction";
import ProductTableRowSelect from "@/components/organisms/ProductTableRowSelect";
import { productCategoryLabels, subCategoryLabels, ProductCategory, SubCategory } from "@/utils/category";
import { TypographyMuted, TypographySmall } from "@/components/atoms/typoqraphy";

export interface ProductTableRowProps {
  product: Product;
}

export function ProductTableRow({ product }: ProductTableRowProps) {
  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <div className="relative h-16 w-16 overflow-hidden rounded">
          <ProductThumbnail
            src={product.thumbnail}
            sizes="128px"
            alt={`${product.title} 이미지`}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <TypographySmall className="truncate font-medium">{product.title}</TypographySmall>
          <TypographyMuted className="truncate">
            {product.description}
          </TypographyMuted>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="w-fit">
            {productCategoryLabels[product.category as ProductCategory] || product.category}
          </Badge>
          <TypographyMuted className="px-1">
            {subCategoryLabels[product.subCategory as SubCategory] || product.subCategory}
          </TypographyMuted>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold">
          {product.price.toLocaleString()}원
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {product.isPremium && (
            <Badge className="bg-accent text-accent-foreground w-fit">
              프리미엄
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="w-fit">
              추천
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <ProductTableRowSelect product={product} />
      </td>
      <td className="px-4 py-3">
        <div className="text-muted-foreground flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{product.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{product.likes.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            <span>{product.salesCount}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-sm">{product.priority}</span>
      </td>
      <td className="px-4 py-3">
        <ProductTableRowAction product={product} />
      </td>
    </tr>
  );
}
