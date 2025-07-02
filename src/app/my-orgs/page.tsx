import { MyOrgs } from "@/components/my-orgs";
import { getUserPreferences } from "@/server/db/user/queries";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MyOrgsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/onboarding");
  }

  const userPreferences = await getUserPreferences(userId);

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <MyOrgs userPreferences={userPreferences} />
      </div>
    </main>
  );
}
