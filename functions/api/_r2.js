export function getAssetsBucket(env) {
  return env.ASSETS || env.R2_ASSETS || env.Assets || env.Assests || env.ASSESTS || env.assets || env.r2_assets || null;
}
