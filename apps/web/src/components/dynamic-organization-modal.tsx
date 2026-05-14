"use client";

import dynamic from "next/dynamic";
import type { OrganizationModalProps } from "@/components/organization-modal";

export const DynamicOrganizationModal = dynamic<OrganizationModalProps>(
  () =>
    import("@/components/organization-modal").then(
      (mod) => mod.OrganizationModal,
    ),
  { ssr: false },
);
