/* Types mirroring kairos-merch-core schemas */

export interface ProductResult {
  product_id: string;
  external_id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: number | null;
  price_max: number | null;
  currency: string;
  min_qty: number;
  materials: string[];
  colors: string[];
  personalization_methods: string[];
  eco_friendly: boolean;
  premium_tier: boolean;
  image_urls: string[];
  lead_time_days: number | null;
  score: number;
  reason: string;
}

export interface SearchResponse {
  session_id: string;
  products: ProductResult[];
  extracted_needs: Record<string, unknown>;
  summary: string;
  total_matches: number;
  has_more: boolean;
}

export interface CategoryInfo {
  name: string;
  count: number;
  subcategories: string[];
}

export interface CategoriesResponse {
  categories: CategoryInfo[];
  total_products: number;
}

export interface ProductListResponse {
  products: ProductResult[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface QuoteItem {
  product: ProductResult;
  quantity: number;
}
