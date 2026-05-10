"use client";

import { useState } from "react";
import type React from "react";
import {
  ExternalLink,
  X,
  Heart,
  Share2,
  HandHeart,
  Users,
  Globe2,
  Layers,
  Quote,
} from "lucide-react";
import Image from "next/image";
import posthog from "posthog-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { useMobile } from "@/hooks/use-mobile";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { sanitizeTagline } from "@cause/lib";

type Organization = Doc<"organizations">;

interface OrganizationModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

const SIZE_LABEL: Record<string, string> = {
  micro: "Grassroots nonprofit",
  small: "Small nonprofit",
  mid: "Mid-size nonprofit",
  large: "Large nonprofit",
  mega: "Major nonprofit",
};

function formatEin(ein?: string) {
  if (!ein) return "";
  const digits = ein.replace(/\D/g, "");
  if (digits.length >= 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  }
  return ein;
}

const NTEE_CATEGORY: Record<string, string> = {
  A: "Arts & Culture",
  B: "Education",
  C: "Environment",
  D: "Animal Welfare",
  E: "Health Care",
  F: "Mental Health",
  G: "Disease & Disorders",
  H: "Medical Research",
  I: "Crime & Justice",
  J: "Employment",
  K: "Food & Nutrition",
  L: "Housing & Shelter",
  M: "Disaster & Safety",
  N: "Recreation & Sports",
  O: "Youth Development",
  P: "Human Services",
  Q: "International",
  R: "Civil Rights",
  S: "Community",
  T: "Philanthropy",
  U: "Science & Tech",
  V: "Social Science",
  W: "Public Benefit",
  X: "Religion",
  Y: "Mutual Benefit",
};

type IconProps = React.SVGProps<SVGSVGElement>;

function XLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ThreadsLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.78 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32l-1.757-1.18c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
    </svg>
  );
}

function LinkedinLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.024-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.941v5.665H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.849.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.849.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="h-px w-6 bg-amber-300/60" />
      <span className="text-[10px] font-semibold tracking-[0.24em] text-amber-200/80 uppercase">
        {children}
      </span>
    </div>
  );
}

export function OrganizationModal({
  organization,
  isOpen,
  onClose,
  onRemove,
  showRemoveButton = false,
}: OrganizationModalProps) {
  const isMobile = useMobile();
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const handleRemoveClick = () => {
    setIsRemoveDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    onRemove?.();
    setIsRemoveDialogOpen(false);
    onClose();
  };

  const handleWebsiteClick = () => {
    posthog.capture("organization_website_clicked", {
      organization_id: organization.slug,
      organization_name: organization.name,
      organization_ein: organization.ein,
      website_url: organization.websiteUrl,
    });
  };

  const handleDonateClick = () => {
    posthog.capture("organization_donate_clicked", {
      organization_id: organization.slug,
      organization_name: organization.name,
      organization_ein: organization.ein,
      donation_url: organization.donationUrl,
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/org/${organization.slug}`;
    const shareData = {
      title: organization.name,
      text: `Check out ${organization.name} - ${organization.whySupport?.slice(0, 100)}...`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);

        posthog.capture("organization_shared", {
          organization_id: organization.slug,
          organization_name: organization.name,
          organization_ein: organization.ein,
          share_method: "native_share",
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!", {
          description: "Organization link has been copied to your clipboard.",
        });

        posthog.capture("organization_shared", {
          organization_id: organization.slug,
          organization_name: organization.name,
          organization_ein: organization.ein,
          share_method: "clipboard",
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!", {
          description: "Organization link has been copied to your clipboard.",
        });

        posthog.capture("organization_shared", {
          organization_id: organization.slug,
          organization_name: organization.name,
          organization_ein: organization.ein,
          share_method: "clipboard_fallback",
        });
      } catch (clipboardError) {
        console.error("Error sharing:", error);
        console.error("Clipboard fallback error:", clipboardError);
        posthog.captureException(error);
        posthog.captureException(clipboardError);

        toast.error("Share failed", {
          description: "Unable to share or copy link. Please try again.",
        });
      }
    }
  };

  const lead =
    sanitizeTagline(organization.tagline) ||
    organization.oneSentenceSummary ||
    organization.whySupport;

  const nteeLabel =
    organization.nteeMajor && NTEE_CATEGORY[organization.nteeMajor];

  const sizeLabel =
    (organization.incomeBucket && SIZE_LABEL[organization.incomeBucket]) ||
    (organization.assetBucket && SIZE_LABEL[organization.assetBucket]);

  const socials = organization.socialMediaUrls;
  const socialLinks: Array<{
    key: string;
    href: string;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [];
  if (socials?.linkedin)
    socialLinks.push({
      key: "linkedin",
      href: socials.linkedin,
      label: "LinkedIn",
      Icon: LinkedinLogo,
    });
  if (socials?.x || socials?.twitter)
    socialLinks.push({
      key: "x",
      href: socials.x || socials.twitter || "",
      label: "X",
      Icon: XLogo,
    });
  if (socials?.instagram)
    socialLinks.push({
      key: "instagram",
      href: socials.instagram,
      label: "Instagram",
      Icon: InstagramLogo,
    });
  if (socials?.facebook)
    socialLinks.push({
      key: "facebook",
      href: socials.facebook,
      label: "Facebook",
      Icon: FacebookLogo,
    });
  if (socials?.youtube)
    socialLinks.push({
      key: "youtube",
      href: socials.youtube,
      label: "YouTube",
      Icon: YoutubeLogo,
    });
  if (socials?.threads)
    socialLinks.push({
      key: "threads",
      href: socials.threads,
      label: "Threads",
      Icon: ThreadsLogo,
    });

  const hasDonate = Boolean(organization.donationUrl);
  const hasWebsite = Boolean(organization.websiteUrl);

  const content = (
    <div className="flex flex-col">
      <div className="relative h-60 w-full shrink-0 overflow-hidden bg-neutral-950 sm:h-72">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-950 via-neutral-950 to-fuchsia-950/70" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-pink-500/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
        </div>

        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.035]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="org-grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M32 0 L 0 0 0 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#org-grid)" />
        </svg>

        {organization.ein && (
          <div className="absolute top-4 left-5 z-20 flex cursor-text items-center gap-2 text-[10px] font-semibold tracking-[0.28em] text-white/70 uppercase select-text">
            <span>EIN</span>
            <span className="font-mono tracking-[0.1em] text-white/60 normal-case select-text">
              {formatEin(organization.ein)}
            </span>
          </div>
        )}

        <div className="relative z-10 flex h-full items-center justify-center px-6">
          {organization.logoUrl ? (
            <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl shadow-black/50 sm:h-48 sm:w-48">
              <Image
                src={organization.logoUrl}
                alt={organization.name}
                fill
                className="object-contain p-3"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-pink-400 to-purple-600 shadow-2xl shadow-black/50 sm:h-48 sm:w-48">
              <span className="font-heading text-5xl font-bold text-white drop-shadow">
                {organization.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 3)
                  .toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="absolute right-5 bottom-4 text-right text-[10px] font-semibold tracking-[0.22em] text-white/55 uppercase">
          {nteeLabel ?? "Nonprofit"}
        </div>
      </div>

      <div className="px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-10 lg:px-12">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-7">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold tracking-[0.24em] text-white/55 uppercase">
                <span>{organization.city}</span>
                <span className="text-white/30">·</span>
                <span>{organization.state}</span>
                {organization.geographicFocus && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="text-amber-200/80">
                      {organization.geographicFocus} reach
                    </span>
                  </>
                )}
              </div>

              <DialogTitle className="font-heading text-[28px] leading-[1.08] font-bold text-white sm:text-[36px]">
                {organization.name}
              </DialogTitle>

              {(nteeLabel || sizeLabel || organization.geographicFocus) && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {organization.geographicFocus && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                      <Globe2 className="h-3 w-3" />
                      {organization.geographicFocus}
                    </span>
                  )}
                  {sizeLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/80">
                      <Layers className="h-3 w-3" />
                      {sizeLabel}
                    </span>
                  )}
                  {nteeLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/80">
                      {nteeLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            {lead && (
              <p className="font-heading border-l-2 border-pink-400/70 pl-5 text-[18px] leading-[1.45] font-medium text-white/92 italic sm:text-[20px]">
                <Quote className="mb-1 inline h-3.5 w-3.5 text-pink-300/70" />{" "}
                {lead}
              </p>
            )}

            {organization.mission && (
              <section>
                <SectionLabel>The Mission</SectionLabel>
                <p className="text-[14.5px] leading-[1.65] text-white/80">
                  {organization.mission}
                </p>
              </section>
            )}

            {organization.whySupport && organization.whySupport !== lead && (
              <section>
                <SectionLabel>Why Support</SectionLabel>
                <p className="text-[14.5px] leading-[1.65] text-white/80">
                  {organization.whySupport}
                </p>
              </section>
            )}

            {organization.activities && organization.activities.length > 0 && (
              <section>
                <SectionLabel>What They Do</SectionLabel>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {organization.activities.slice(0, 6).map((activity, i) => (
                    <div
                      key={`${activity.name}-${i}`}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <h4 className="font-heading mb-1 text-[13px] font-semibold text-white">
                        {activity.name}
                      </h4>
                      {activity.description && (
                        <p className="text-[12px] leading-[1.55] text-white/65">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-5">
            <div className="order-last rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-5 shadow-lg shadow-black/20 lg:sticky lg:top-6 lg:order-none">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-px w-6 bg-pink-300/60" />
                <span className="text-[10px] font-semibold tracking-[0.24em] text-pink-200/80 uppercase">
                  Take Action
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {hasDonate && (
                  <a
                    href={organization.donationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDonateClick}
                  >
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 font-semibold text-white shadow-lg shadow-pink-500/25 hover:from-pink-400 hover:to-fuchsia-500">
                      <HandHeart className="mr-2 h-4 w-4" />
                      Donate
                    </Button>
                  </a>
                )}
                {hasWebsite && (
                  <a
                    href={organization.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWebsiteClick}
                  >
                    <Button
                      variant={hasDonate ? "outline" : "default"}
                      className={`w-full ${hasDonate ? "border-white/20 bg-white/[0.04] text-white hover:bg-white/10" : ""}`}
                    >
                      Visit Website
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  className="w-full border-white/15 bg-transparent text-white/80 hover:bg-white/[0.06]"
                  onClick={() => void handleShare()}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                {showRemoveButton && (
                  <Button
                    variant="destructive-outline"
                    className="w-full"
                    onClick={handleRemoveClick}
                  >
                    <Heart className="mr-2 h-4 w-4 fill-current" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {organization.targetAudience && (
              <section className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-4">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-amber-300/80" />
                  <span className="text-[10px] font-semibold tracking-[0.24em] text-white/60 uppercase">
                    Who They Serve
                  </span>
                </div>
                <p className="text-[13.5px] leading-[1.55] text-white/85">
                  {organization.targetAudience}
                </p>
              </section>
            )}

            {organization.keywords && organization.keywords.length > 0 && (
              <section>
                <SectionLabel>Tags</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {organization.keywords.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/75"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {socialLinks.length > 0 && (
              <section>
                <SectionLabel>Connect</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(({ key, href, label, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="group/social flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition-all hover:scale-105 hover:border-pink-400/40 hover:bg-pink-500/15 hover:text-pink-100"
                    >
                      <Icon className="h-[15px] w-[15px]" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{organization.name}&quot;
              from your saved organizations? You can always add it back later by
              discovering it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <DrawerTitle className="text-[11px] font-semibold tracking-[0.24em] text-white/60 uppercase">
              Organization
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] !max-w-5xl overflow-auto border-white/10 bg-neutral-950/95 p-0 text-white backdrop-blur-xl sm:!max-w-5xl sm:rounded-2xl">
        {content}
      </DialogContent>
    </Dialog>
  );
}
