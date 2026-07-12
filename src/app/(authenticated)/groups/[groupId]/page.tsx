import { GroupDetail } from "./GroupDetail";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: PageProps) {
  const { groupId } = await params;
  return <GroupDetail groupId={groupId} />;
}
