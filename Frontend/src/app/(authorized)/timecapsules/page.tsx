import { auth } from "@/lib/auth";
import TimeCapsuleClient from "./TimeCapsuleClient";

export default async function TimeCapsulePage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return null;
  }

  return (
    <TimeCapsuleClient userEmail={session.user.email} />
  );
}
