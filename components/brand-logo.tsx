import Image from "next/image";

import { cn } from "@/lib/utils";

const frames = {
  header: "size-8",
  sidebar: "size-24",
  login: "h-44 w-44 max-w-full",
} as const;

export function BrandLogo({
  variant = "sidebar",
  className,
  priority = false,
}: {
  variant?: keyof typeof frames;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden", frames[variant], className)}>
      <Image
        src="/logo.png"
        alt="EDEN ATELIER"
        width={869}
        height={650}
        className="size-full object-contain"
        priority={priority}
      />
    </div>
  );
}
