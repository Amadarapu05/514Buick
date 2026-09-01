import { TvDashboard } from "@/components/tv/tv-dashboard";

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ speed?: string }>;
}) {
  const { speed } = await searchParams;
  return <TvDashboard speed={speed} />;
}
