import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AccountSettings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!session?.user?.email) return;
    setDeleting(true);
    const res = await fetch(
      `/api/users/${encodeURIComponent(session.user.email)}`,
      {
        method: "DELETE",
      }
    );
    if (res.ok) {
      await signOut({ redirect: false });
      router.push("/signup");
    } else {
      setDeleting(false);
      // Show error toast or message
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDeleteAccount}
      disabled={deleting}
    >
      {deleting ? "Deleting..." : "Delete Account"}
    </Button>
  );
}