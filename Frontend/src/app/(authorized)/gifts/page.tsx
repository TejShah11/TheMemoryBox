import { auth } from "@/lib/auth";
import GiftingCenter from "./GiftingCenter";

export default async function TimeCapsulePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  return <GiftingCenter userEmail={session.user.email} />;
}
