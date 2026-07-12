import { RideMatchesDetail } from "./RideMatchesDetail";

interface PageProps {
  params: Promise<{ rideId: string }>;
}

export default async function RideMatchesPage({ params }: PageProps) {
  const { rideId } = await params;
  return <RideMatchesDetail rideId={rideId} />;
}
