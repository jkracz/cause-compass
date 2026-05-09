"use client";

import Image from "next/image";
import { useState } from "react";

export function AccountAvatar({
  picture,
  name,
  email,
  size,
  textClassName,
}: {
  picture?: string;
  name?: string;
  email?: string;
  size: number;
  textClassName: string;
}) {
  const [failedPicture, setFailedPicture] = useState<string | null>(null);
  const label = name || email || "User";

  if (picture && picture !== failedPicture) {
    return (
      <Image
        src={picture}
        alt={label}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        unoptimized
        onError={() => setFailedPicture(picture)}
      />
    );
  }

  return (
    <span className={textClassName}>{label.slice(0, 1).toUpperCase()}</span>
  );
}
