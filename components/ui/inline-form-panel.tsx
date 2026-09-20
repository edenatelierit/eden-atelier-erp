"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

/**
 * In-page expand panel for create/edit forms.
 * Keeps the surrounding page visible while entering data.
 */
export function InlineFormPanel({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <Card
      className={cn(
        "scroll-mt-4 border-primary/20 bg-card shadow-sm ring-1 ring-foreground/10",
        className
      )}
    >
      <CardHeader className="border-b [.border-b]:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-end gap-2 border-t pt-4">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
