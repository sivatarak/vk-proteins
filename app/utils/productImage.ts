// src/utils/productImages.ts
export const getProductImage = (product: {
  label: string | null;
  category: { label: string } | null;
}): string => {
  const label = (product.label || "").toLowerCase().trim();
  const category = (product.category?.label || "").toLowerCase().trim();
  const searchText = `${label} ${category}`.toLowerCase();

  const imageMap = new Map<string, string>([
    // Live / Special variants first (longest & most specific)
    ["layerlive", "/images/products/layerLive.jpg"],
    ["layer live", "/images/products/layerLive.jpg"],
    ["live layer", "/images/products/layerLive.jpg"],

    ["broiler live", "/images/products/broilerLive.jpg"],
    ["live broiler", "/images/products/broilerLive.jpg"],
    ["live chicken", "/images/products/broilerLive.jpg"],

    ["country live", "/images/products/CountryLive.jpg"],
    ["country chicken", "/images/products/CountryLive.jpg"],
    ["country", "/images/products/CountryLive.jpg"],

    ["prawns", "/images/products/prawns.jpg"],
    ["shrimp", "/images/products/prawns.jpg"],
    ['skinless',"/images/products/skinless.webp"],

    ["mutton leg", "/images/products/mutton-leg.webp"],
    ["boneless", "/images/products/chicken-breast.webp"],
    ["curry cut", "/images/products/chicken-curry-cut.webp"],
    ["whole chicken", "/images/products/whole-chicken.webp"],

    // General ones
    ["mutton", "/images/products/mutton.png"],
    ["goat", "/images/products/mutton-curry-cut.webp"],
    ["broiler", "/images/products/Broiler_Chicken.webp"],
    ["layer", "/images/products/layer.jpg"],
    ["fish", "/images/products/fish.png"],
    ["katla", "/images/products/katla.webp"],
    ["pomfret", "/images/products/pomfret.webp"],
    ["egg", "/images/products/eggs.jpg"],
  ]);

  for (const [keyword, path] of imageMap) {
    if (searchText.includes(keyword)) {
      return path;
    }
  }

  // Final fallback
  return "/images/products/fresh-meat.webp";
};