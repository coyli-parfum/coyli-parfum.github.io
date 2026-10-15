# COYLI PARFUM catalog

This private repository publishes the existing Netlify site https://starlit-sunflower-ea1b0d.netlify.app/ from main. Keep the existing hosting and design.

## Catalog updates requested in chat

- The source of truth is catalog.json, a JSON array. index.html fetches it at runtime. Do not replace the catalog with the fallback list embedded in index.html.
- Read the latest catalog and its GitHub blob SHA before editing. Preserve every unrelated product and field. Use the SHA for optimistic concurrency; on conflict reread and reapply only the requested change.
- Baseline on 2026-10-15: 239 products. An addition must retain all existing IDs and add one unique integer ID (max ID + 1). Update existing products by ID rather than creating duplicates.
- Records use id, name, cat, volumes, price, notes, kind, image. Preserve the established categories and kind mapping. Prices are rubles, keyed by volume. Never invent price, volume, ingredients, availability or claims; ask for missing required product data.
- Use the user's supplied photo. Add an actual JPEG/PNG/WebP image file to the repository, with a unique filename, and reference its relative path in image. Never commit temporary signed attachment URLs or credentials. Inspect uploaded image contents before use.
- Prefer one atomic Git commit for a new photo and its catalog record. Do not overwrite existing image assets.
- Validate JSON, unique IDs, image paths, unchanged prior products, and expected count before publishing. A new product normally increases the current count by one.
- Push the authorized change to main using the connected GitHub app. Netlify handles publication; a separate personal access token is not needed for chat-driven updates.
- Verify the live catalog.json using a cache-busting query, compare the changed record and the preserved records to the intended catalog, and check that its image loads. A successful GitHub commit alone does not prove Netlify publication. If deployment does not appear, report that limit rather than claiming success.
- Do not delete products or alter unrelated prices unless the user asks.

## Front end

This is a buildless static site. index.html, catalog.json and image assets are served from the repository root. admin.html is a separate optional browser editor; chat updates use the connected GitHub app directly.

## Imported perfume references

- The 2026-10-15 import retains the initial 239 product IDs and adds 87 records (326 total). Photos and notes were prepared for 190 identified fragrance references. CATALOG_REVIEW.md lists 27 unresolved source names; obtain precise identities before filling these entries.
- Lux/selective spray and pure-oil price schedules are also encoded as sprayL, sprayS, oilL, oilS in index.html. A requested price update must update the relevant renderer schedule as well as catalog prices; validate the actual format/volume selection and cart amount.
- For the user's reference-fragrance import, matching bottle images and notes may be researched from official brands or Fragrantica. Keep notesSource and imageSource provenance, distinguish fragrance editions, and host the actual photos locally. White backgrounds and consistent bottle views are preferred. Do not substitute a related fragrance for an unclear name.
- Unrelated home products, original perfumes, prices and images remain unchanged by this import. Existing duplicate and incomplete legacy records were retained to respect the user's preservation request.
