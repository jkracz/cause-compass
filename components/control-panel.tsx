"use client";

import { useState } from "react";
import {
  RotateCcw,
  Sparkles,
  Brain,
  Sprout,
  Edit3,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Organization } from "@/lib/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

interface ControlPanelProps {
  userPreferences: Record<string, any>;
  likedOrgs: Organization[];
  onEditReflection: () => void;
  onAnswerMoreQuestions: () => void;
  onGetMoreMatches: () => void;
  onStartOver: () => void;
}

export function ControlPanel({
  userPreferences,
  likedOrgs,
  onEditReflection,
  onAnswerMoreQuestions,
  onGetMoreMatches,
  onStartOver,
}: ControlPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const isMobile = useMobile();

  // Generate reflection summary from user preferences
  const generateReflectionSummary = () => {
    if (!userPreferences || Object.keys(userPreferences).length === 0) {
      return "Complete your mirror check to see your reflection here.";
    }

    const causes = userPreferences.causes || [];
    const helpMethod = userPreferences.helpMethod || [];
    const changeScope = userPreferences.changeScope || "global";

    let summary = "You care deeply about ";

    if (causes.length > 0) {
      const causeLabels = causes.map((cause: string) => {
        const causeMap: Record<string, string> = {
          environment: "environmental protection",
          education: "education",
          health: "health & wellness",
          poverty: "fighting poverty",
          rights: "human rights",
          arts: "arts & culture",
          animals: "animal welfare",
          disaster: "disaster relief",
          "mental-health": "mental health",
          food: "food security",
          technology: "technology innovation",
          community: "community development",
        };
        return causeMap[cause] || cause;
      });

      if (causeLabels.length === 1) {
        summary += causeLabels[0];
      } else if (causeLabels.length === 2) {
        summary += `${causeLabels[0]} and ${causeLabels[1]}`;
      } else {
        summary += `${causeLabels.slice(0, -1).join(", ")}, and ${causeLabels[causeLabels.length - 1]}`;
      }
    } else {
      summary += "making a positive impact";
    }

    if (changeScope === "local") {
      summary += " in your local community";
    } else if (changeScope === "national") {
      summary += " across the country";
    } else {
      summary += " wherever it matters most";
    }

    if (helpMethod.length > 0) {
      const methodLabels = helpMethod.map((method: string) => {
        const methodMap: Record<string, string> = {
          donating: "donating",
          volunteering: "volunteering",
          sharing: "sharing information",
          connecting: "connecting people",
          learning: "learning more",
        };
        return methodMap[method] || method;
      });

      summary += ". You prefer to help through ";
      if (methodLabels.length === 1) {
        summary += methodLabels[0];
      } else if (methodLabels.length === 2) {
        summary += `${methodLabels[0]} and ${methodLabels[1]}`;
      } else {
        summary += `${methodLabels.slice(0, -1).join(", ")}, and ${methodLabels[methodLabels.length - 1]}`;
      }
    }

    summary += ".";
    return summary;
  };

  // Get unique categories from liked organizations
  const getUniqueCategoriesFromLikedOrgs = () => {
    const categories = new Set<string>();
    likedOrgs.forEach((org) => {
      org.tags.forEach((tag) => categories.add(tag));
    });
    return Array.from(categories);
  };

  const uniqueCategories = getUniqueCategoriesFromLikedOrgs();
  const mosaicProgress = Math.min((likedOrgs.length / 10) * 100, 100); // Progress based on 10 orgs max

  const ControlContent = () => (
    <div className={cn("space-y-4", isMobile ? "pb-6" : "space-y-6")}>
      <div className="text-center">
        <h2
          className={cn(
            "font-bold tracking-tight text-white",
            isMobile ? "text-xl" : "text-2xl",
          )}
        >
          Control Center
        </h2>
        <div className="mx-auto mt-1 h-1 w-16 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500"></div>
      </div>

      {/* Your Reflection */}
      <div className="glass-premium rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-600">
            <span className="text-lg">🪞</span>
          </div>
          <h3
            className={cn(
              "font-semibold text-white",
              isMobile ? "text-base" : "text-lg",
            )}
          >
            Your Reflection
          </h3>
        </div>

        <p
          className={cn(
            "mb-4 leading-relaxed text-white/90",
            isMobile ? "text-sm" : "",
          )}
        >
          {generateReflectionSummary()}
        </p>

        {/* Mosaic visualization */}
        {uniqueCategories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {uniqueCategories.slice(0, 6).map((category, index) => (
              <div
                key={category}
                className="h-5 w-5 transform rounded-md transition-all duration-300 hover:scale-110 hover:rotate-12"
                style={{
                  backgroundColor: `hsl(${(index * 60) % 360}, 80%, 65%)`,
                  boxShadow: `0 0 12px hsla(${(index * 60) % 360}, 80%, 65%, 0.5)`,
                }}
                title={category}
              />
            ))}
            {uniqueCategories.length > 6 && (
              <div className="flex h-5 w-5 transform items-center justify-center rounded-md bg-white/30 transition-all duration-300 hover:scale-110">
                <span className="text-xs font-medium text-white">
                  +{uniqueCategories.length - 6}
                </span>
              </div>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full border-white/20 bg-white/10 text-white transition-all duration-300 hover:bg-white/20 hover:shadow-md hover:shadow-pink-500/20"
          onClick={onEditReflection}
        >
          <Edit3 className="mr-2 h-3.5 w-3.5" />
          Edit my reflection
        </Button>
      </div>

      {/* Answer More Questions */}
      <div className="glass-premium rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <h3
            className={cn(
              "font-semibold text-white",
              isMobile ? "text-base" : "text-lg",
            )}
          >
            Answer More Questions
          </h3>
        </div>

        <p className={cn("mb-4 text-white/90", isMobile ? "text-sm" : "")}>
          Want to refine your reflection?
        </p>

        <Button
          variant="outline"
          size="sm"
          className="w-full border-white/20 bg-white/10 text-white transition-all duration-300 hover:bg-white/20 hover:shadow-md hover:shadow-blue-500/20"
          onClick={onAnswerMoreQuestions}
        >
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Answer a quick question
        </Button>
      </div>

      {/* Get More Matches */}
      <div className="glass-premium rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-teal-600">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <h3
            className={cn(
              "font-semibold text-white",
              isMobile ? "text-base" : "text-lg",
            )}
          >
            Get More Matches
          </h3>
        </div>

        <Button
          variant="default"
          size="sm"
          className="w-full border-none bg-gradient-to-r from-green-500 to-emerald-600 text-white transition-all duration-300 hover:from-green-600 hover:to-emerald-700 hover:shadow-md hover:shadow-green-500/30"
          onClick={onGetMoreMatches}
        >
          Show me more orgs like these
        </Button>
      </div>

      {/* Mosaic Progress */}
      <div className="glass-premium rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-600">
            <span className="text-lg">🧭</span>
          </div>
          <h3
            className={cn(
              "font-semibold text-white",
              isMobile ? "text-base" : "text-lg",
            )}
          >
            Your Journey
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div
              className={cn(
                "flex justify-between text-white/90",
                isMobile ? "text-sm" : "text-sm",
              )}
            >
              <span>Organizations liked</span>
              <span className="font-semibold">{likedOrgs.length}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-1000 ease-out"
                style={{ width: `${mosaicProgress}%` }}
              ></div>
            </div>

            <div
              className={cn(
                "flex justify-between text-white/90",
                isMobile ? "text-sm" : "text-sm",
              )}
            >
              <span>Categories explored</span>
              <span className="font-semibold">{uniqueCategories.length}</span>
            </div>
          </div>

          {uniqueCategories.length > 0 && (
            <div className="space-y-2">
              <p
                className={cn(
                  "text-white/70",
                  isMobile ? "text-xs" : "text-xs",
                )}
              >
                Your interests:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {uniqueCategories.slice(0, 4).map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className={cn(
                      "bg-white/15 transition-all duration-300 hover:bg-white/25",
                      isMobile ? "text-xs" : "text-xs",
                    )}
                  >
                    {category}
                  </Badge>
                ))}
                {uniqueCategories.length > 4 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "bg-white/15 transition-all duration-300 hover:bg-white/25",
                      isMobile ? "text-xs" : "text-xs",
                    )}
                  >
                    +{uniqueCategories.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Over */}
      <div className="glass-premium rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-red-500/30 text-red-300 transition-all duration-300 hover:bg-red-950/30 hover:text-red-200"
          onClick={onStartOver}
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Start over
        </Button>
      </div>
    </div>
  );

  // Mobile version with drawer
  if (isMobile) {
    return (
      <>
        {/* Floating Action Button for Mobile */}
        <Drawer open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <DrawerTrigger asChild>
            <Button
              size="lg"
              className="fixed right-6 bottom-6 z-[9999] h-14 w-14 cursor-pointer rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open Control Center</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[85vh] border-t border-white/20 bg-gradient-to-b from-purple-900/95 via-indigo-900/95 to-pink-800/95 backdrop-blur-xl">
            <DrawerHeader className="pb-4">
              <DrawerTitle className="sr-only">Control Center</DrawerTitle>
            </DrawerHeader>
            <div className="h-full overflow-y-auto px-2">
              <ControlContent />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop version with sidebar
  return (
    <div
      className={cn(
        "fixed top-0 right-0 z-40 h-full transition-all duration-500 ease-in-out",
        isCollapsed ? "w-12" : "w-96",
      )}
    >
      {/* Glassmorphic background with gradient overlay */}
      <div className="absolute inset-0 border-l border-white/20 bg-gradient-to-b from-purple-900/80 via-indigo-900/80 to-pink-800/80 shadow-2xl backdrop-blur-lg"></div>

      {/* Toggle Button with animation */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-1/2 left-0 z-50 h-12 w-12 -translate-y-1/2 cursor-pointer rounded-full border border-white/30 bg-white/10 shadow-lg backdrop-blur-xl transition-all duration-500 hover:bg-white/20",
          isCollapsed ? "-translate-x-1/2" : "-translate-x-1/2 rotate-180",
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="relative h-6 w-6">
          <span
            className={cn(
              "absolute left-0 block h-0.5 w-6 rounded-full bg-white transition-all duration-300",
              isCollapsed ? "top-1 rotate-0" : "top-2.5 rotate-45",
            )}
          ></span>
          <span
            className={cn(
              "absolute top-2.5 left-0 block h-0.5 w-6 rounded-full bg-white transition-all duration-300",
              isCollapsed ? "opacity-100" : "opacity-0",
            )}
          ></span>
          <span
            className={cn(
              "absolute left-0 block h-0.5 w-6 rounded-full bg-white transition-all duration-300",
              isCollapsed ? "top-4 rotate-0" : "top-2.5 -rotate-45",
            )}
          ></span>
        </div>
      </Button>

      {/* Panel Content with scroll animation */}
      <div
        className={cn(
          "relative h-full overflow-y-auto p-6 transition-all duration-500",
          isCollapsed ? "invisible opacity-0" : "opacity-100",
        )}
      >
        <ControlContent />
      </div>
    </div>
  );
}
