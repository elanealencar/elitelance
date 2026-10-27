import { z } from "zod";

const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
});

const productsResponseSchema = z.object({
  products: z.array(productSchema),
});

export class CatalogService {
  async search(query: string) {
    const url = new URL(
      "https://dummyjson.com/products/search"
    );

    url.searchParams.set("q", query);
    url.searchParams.set("limit", "20");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error("CATALOG_UNAVAILABLE");
    }

    const json: unknown = await response.json();
    const data = productsResponseSchema.parse(json);

    return data.products;
  }

  async getById(id: number) {
    const response = await fetch(
      `https://dummyjson.com/products/${id}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      throw new Error("CATALOG_UNAVAILABLE");
    }

    const json: unknown = await response.json();

    return productSchema.parse(json);
  }
}

export const catalogService = new CatalogService();