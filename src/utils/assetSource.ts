export type AssetImport = string | { src: string };

export const assetSource = (asset: AssetImport): string =>
  typeof asset === "string" ? asset : asset.src;