import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";

export default async function Home() {
  const cookieStore = await cookies();
  const hasVisited = cookieStore.has("hasVisited");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative w-full flex-1">
        <div className="relative z-10 container flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-12">
          <GlassmorphicCard className="max-w-md">
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Cause Compass
                </h1>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Discover nonprofits that align with your values and make a
                  difference
                </p>
              </div>

              <div className="space-y-4">
                {hasVisited ? (
                  <>
                    <Link href="/my-orgs" className="inline-block w-full">
                      <Button size="lg" className="w-full">
                        My Organizations
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/onboarding" className="inline-block w-full">
                      <Button size="lg" variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Start New Journey
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/onboarding" className="inline-block w-full">
                    <Button size="lg" className="w-full">
                      Begin Your Journey
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </GlassmorphicCard>
        </div>
      </main>
    </div>
  );
}
