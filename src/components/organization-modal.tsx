"use client";

import { useState } from "react";
import { ExternalLink, X, Heart, Share2 } from "lucide-react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MockOrganization } from "@/lib/types";
import { useMobile } from "@/hooks/use-mobile";

interface OrganizationModalProps {
  organization: MockOrganization;
  isOpen: boolean;
  onClose: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/org/${organization.id}`;
    const shareData = {
      title: organization.name,
      text: `Check out ${organization.name} - ${organization.description.slice(0, 100)}...`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!", {
          description: "Organization link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!", {
          description: "Organization link has been copied to your clipboard.",
        });
      } catch (clipboardError) {
        toast.error("Share failed", {
          description: "Unable to share or copy link. Please try again.",
        });
      }
    }
  };

  const content = (
    <>
      <div className="relative h-48 w-full sm:h-64">
        <Image
          src={organization.imageUrl || "/placeholder.svg"}
          alt={organization.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <DialogTitle className="text-2xl font-bold">
            {organization.name}
          </DialogTitle>
          <p className="text-muted-foreground">{organization.location}</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {organization.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mb-6 space-y-4">
          <p>{organization.description}</p>

          <div className="bg-muted grid grid-cols-2 gap-4 rounded-lg p-4">
            <div>
              <h3 className="text-sm font-medium">Founded</h3>
              <p>{organization.founded}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Impact</h3>
              <p>{organization.impact}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 space-y-3">
          <a
            href={organization.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              Visit Website
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>

          {showRemoveButton && (
            <div className="flex gap-2">
              <Button
                variant="destructive-outline"
                className="flex-1"
                onClick={handleRemoveClick}
              >
                <Heart className="mr-2 h-4 w-4 fill-current" />
                Remove
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          )}

          {!showRemoveButton && (
            <Button variant="outline" className="w-full" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Organization
            </Button>
          )}
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
              Are you sure you want to remove "{organization.name}" from your
              saved organizations? You can always add it back later by
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
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Organization Details</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-auto p-0 sm:rounded-lg">
        {content}
      </DialogContent>
    </Dialog>
  );
}
