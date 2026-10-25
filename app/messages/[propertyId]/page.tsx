import MessageThreadView from "@/components/MessageThreadView";

export default function ThreadPage({
  params,
  searchParams,
}: {
  params: { propertyId: string };
  searchParams: { with?: string };
}) {
  return <MessageThreadView propertyId={params.propertyId} withUserId={searchParams.with} />;
}
