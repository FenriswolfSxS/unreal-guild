export function getAssetsBucket(env) {
  return env.R2_ASSETS || env.MEDIA_BUCKET || env.R2_BUCKET || env.Assets || env.Assests || env.ASSESTS || env.assets || env.r2_assets || null;
}
