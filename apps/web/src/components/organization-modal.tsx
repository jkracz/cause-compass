"use client";

import type React from "react";
import { ExternalLink, X, Heart, Share2, HandHeart, Users } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { useMobile } from "@/hooks/use-mobile";
import { useAppSession } from "@/components/app-session-provider";
import { OrgMark } from "@/components/editorial/org-mark";
import { api } from "@cause/backend/convex/_generated/api";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { sanitizeTagline } from "@cause/lib";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics-client";

type Organization = Doc<"organizations">;

export interface OrganizationModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
}

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
    <div className="mb-3 flex items-center gap-3">
      <span className="bg-accent/70 h-px w-7" aria-hidden />
      <span className="text-accent text-[11px] font-semibold tracking-[0.32em] uppercase">
        {children}
      </span>
    </div>
  );
}

export function OrganizationModal({
  organization,
  isOpen,
  onClose,
}: OrganizationModalProps) {
  const isMobile = useMobile();
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const likeOrganization = useMutation(api.users.likeOrganization);
  const unlikeOrganization = useMutation(api.users.unlikeOrganization);

  const isLiked =
    viewer?.likedOrganizations?.includes(organization.slug) ?? false;

  const handleSaveToggle = async () => {
    if (isLiked) {
      await unlikeOrganization({ guestId, organizationId: organization.slug });
      analytics.capture("organization_removed", {
        organization_id: organization.slug,
        organization_name: organization.name,
        organization_ein: organization.ein,
        source: "modal",
      });
    } else {
      await likeOrganization({ guestId, organizationId: organization.slug });
      analytics.capture("organization_liked", {
        organization_id: organization.slug,
        organization_name: organization.name,
        organization_ein: organization.ein,
        source: "modal",
      });
    }
  };

  const handleWebsiteClick = () => {
    analytics.capture("organization_website_clicked", {
      organization_id: organization.slug,
      organization_name: organization.name,
      organization_ein: organization.ein,
      website_url: organization.websiteUrl,
    });
  };

  const handleDonateClick = () => {
    analytics.capture("organization_donate_clicked", {
      organization_id: organization.slug,
      organization_name: organization.name,
      organization_ein: organization.ein,
      donation_url: organization.donationUrl,
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?org=${encodeURIComponent(
      organization.slug,
    )}`;
    const shareData = {
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);

        analytics.capture("organization_shared", {
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

        analytics.capture("organization_shared", {
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

        analytics.capture("organization_shared", {
          organization_id: organization.slug,
          organization_name: organization.name,
          organization_ein: organization.ein,
          share_method: "clipboard_fallback",
        });
      } catch (clipboardError) {
        console.error("Error sharing:", error);
        console.error("Clipboard fallback error:", clipboardError);
        analytics.captureException(error);
        analytics.captureException(clipboardError);

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
      <div className="border-rule bg-paper-deep relative h-60 w-full shrink-0 overflow-hidden border-b sm:h-72">
        {organization.ein && (
          <div className="text-ink-mute absolute top-5 left-6 z-20 flex cursor-text items-center gap-2 text-[10px] font-semibold tracking-[0.28em] uppercase select-text sm:left-8">
            <span>EIN</span>
            <span className="text-ink-mute font-mono tracking-[0.1em] normal-case select-text">
              {formatEin(organization.ein)}
            </span>
          </div>
        )}

        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <OrgMark
            name={organization.name}
            logoUrl={organization.logoUrl}
            slug={organization.slug}
            size="xl"
            className="border-rule bg-card shadow-[0_22px_50px_-28px_rgba(91,75,158,0.45)]"
          />
        </div>

        <div className="text-ink-mute absolute right-6 bottom-5 text-right text-[11px] font-semibold tracking-[0.32em] uppercase sm:right-8">
          {nteeLabel ?? "Nonprofit"}
        </div>
      </div>

      <div className="px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-10 lg:px-12">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-7">
            <div>
              {(organization.city || organization.state) && (
                <div className="text-ink-mute mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold tracking-[0.32em] uppercase">
                  {organization.city && <span>{organization.city}</span>}
                  {organization.city && organization.state && (
                    <span className="text-rule-strong">·</span>
                  )}
                  {organization.state && <span>{organization.state}</span>}
                </div>
              )}

              <DialogTitle className="font-heading text-ink text-[28px] leading-[1.05] font-semibold tracking-[-0.005em] sm:text-[36px]">
                {organization.name}
              </DialogTitle>
            </div>

            {lead && (
              <p className="font-heading border-accent text-ink border-l-2 pl-5 text-[19px] leading-[1.45] font-medium italic sm:text-[21px]">
                {lead}
              </p>
            )}

            {organization.mission && (
              <section>
                <SectionLabel>The Mission</SectionLabel>
                <p className="text-ink-soft text-[15px] leading-[1.65]">
                  {organization.mission}
                </p>
              </section>
            )}

            {organization.whySupport && organization.whySupport !== lead && (
              <section>
                <SectionLabel>Why Support</SectionLabel>
                <p className="text-ink-soft text-[15px] leading-[1.65]">
                  {organization.whySupport}
                </p>
              </section>
            )}

            {organization.activities && organization.activities.length > 0 && (
              <section>
                <SectionLabel>What They Do</SectionLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {organization.activities.slice(0, 6).map((activity, i) => (
                    <div
                      key={`${activity.name}-${i}`}
                      className="border-rule bg-card hover:border-rule-strong hover:bg-card-hover rounded-[14px] border p-4 transition-colors"
                    >
                      <h4 className="font-heading text-ink mb-1 text-[14px] font-semibold">
                        {activity.name}
                      </h4>
                      {activity.description && (
                        <p className="text-ink-soft text-[13px] leading-[1.55]">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-7">
            <div className="order-last flex flex-col gap-2 lg:sticky lg:top-6 lg:order-none">
              {hasDonate && (
                <a
                  href={organization.donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDonateClick}
                >
                  <Button className="bg-ink text-paper hover:bg-accent hover:text-paper h-11 w-full rounded-full px-6 text-[11px] font-semibold tracking-[0.32em] uppercase shadow-none transition-all hover:shadow-[0_18px_40px_-20px_rgba(200,38,110,0.55)]">
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
                  <Button className="border-rule text-ink-soft hover:border-accent/40 hover:text-accent h-11 w-full rounded-full border bg-transparent px-5 text-[11px] font-semibold tracking-[0.32em] uppercase shadow-none transition-all hover:bg-transparent">
                    Visit Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              <div className="flex items-center gap-2">
                <Button
                  aria-pressed={isLiked}
                  aria-label={
                    isLiked ? "Remove from My Causes" : "Add to My Causes"
                  }
                  className={cn(
                    "h-10 flex-1 rounded-full border px-4 text-[11px] font-medium tracking-[0.16em] uppercase shadow-none transition-colors",
                    isLiked
                      ? "border-accent/50 bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent"
                      : "border-rule text-ink-mute hover:border-accent/40 hover:text-accent bg-transparent hover:bg-transparent",
                  )}
                  onClick={() => void handleSaveToggle()}
                >
                  <Heart
                    className={cn(
                      "mr-1.5 h-3.5 w-3.5 transition-colors",
                      isLiked && "fill-current",
                    )}
                  />
                  {isLiked ? "Saved" : "Save"}
                </Button>
                <Button
                  aria-label="Share organization"
                  className="border-rule text-ink-mute hover:border-accent/40 hover:text-accent h-10 flex-1 rounded-full border bg-transparent px-4 text-[11px] font-medium tracking-[0.16em] uppercase shadow-none transition-colors hover:bg-transparent"
                  onClick={() => void handleShare()}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Share
                </Button>
              </div>
            </div>

            {organization.targetAudience && (
              <section>
                <div className="mb-3 flex items-center gap-3">
                  <span className="bg-accent/70 h-px w-7" aria-hidden />
                  <span className="text-accent inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.32em] uppercase">
                    <Users className="h-3 w-3" />
                    Who They Serve
                  </span>
                </div>
                <p className="text-ink-soft text-[14px] leading-[1.6]">
                  {organization.targetAudience}
                </p>
              </section>
            )}

            {organization.keywords && organization.keywords.length > 0 && (
              <section>
                <SectionLabel>Keywords</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {organization.keywords.map((tag) => (
                    <span
                      key={tag}
                      className="border-rule bg-card text-ink-soft rounded-full border px-3 py-1 text-[12px] font-medium"
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
                      className="border-rule bg-card text-ink-mute hover:border-accent/40 hover:bg-accent-soft hover:text-accent flex h-10 w-10 items-center justify-center rounded-full border transition-all"
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
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="bg-card max-h-[92vh]">
          <DrawerHeader className="border-rule bg-paper-deep flex items-center justify-between border-b px-4 py-3">
            <DrawerTitle className="text-ink-mute text-[11px] font-semibold tracking-[0.32em] uppercase">
              Organization
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Details about {organization.name}
            </DrawerDescription>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-ink-soft hover:bg-card hover:text-accent"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="bg-card overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="border-rule bg-card text-ink max-h-[92vh] w-[calc(100vw-2rem)] !max-w-5xl overflow-auto border p-0 shadow-[0_30px_70px_-40px_rgba(91,75,158,0.55)] sm:!max-w-5xl sm:rounded-[32px]"
      >
        <DialogDescription className="sr-only">
          Details about {organization.name}
        </DialogDescription>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="border-rule bg-card/90 text-ink-soft hover:border-accent/40 hover:bg-card hover:text-accent absolute top-4 right-4 z-50 h-10 w-10 rounded-full border shadow-sm backdrop-blur transition-all"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
        {content}
      </DialogContent>
    </Dialog>
  );
}
