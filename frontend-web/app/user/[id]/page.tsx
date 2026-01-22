import { UserProfileClient } from "./user-profile-client";

export default async function UserProfilePage({ params }: { params: unknown }) {
  const resolved = (await params) as { id: string };
  return <UserProfileClient userId={resolved.id} />;
}
