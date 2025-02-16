import { signOut } from "@/lib/auth";
import { Button } from "../ui/button";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button className="rounded-full px-4 py-2 font-bold" type="submit">
        Sign out
      </Button>
    </form>
  );
}
