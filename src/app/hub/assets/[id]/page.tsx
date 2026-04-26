import { AssetDetailPage } from "@/components/hub/hub-admin-pages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetDetailPage assetId={id} />;
}
