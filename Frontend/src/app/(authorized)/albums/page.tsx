import { auth } from "@/lib/auth";
import AlbumsClient from "./AlbumsClient";

export default async function AlbumsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  return <AlbumsClient userEmail={session.user.email} />;
}
