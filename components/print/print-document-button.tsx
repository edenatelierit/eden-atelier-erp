"use client";

import { Printer } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useReactToPrint } from "react-to-print";

import { useI18n } from "@/components/locale-provider";
import { PrintTemplate, type PrintParty } from "@/components/print/print-template";
import { Button } from "@/components/ui/button";

const PAGE_STYLE = `
  @page { size: A4 portrait; margin: 12mm; }
  html, body { background: #fff !important; color: #171717 !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

export function PrintDocumentButton({
  title,
  party,
  documentDate,
  children,
}: {
  title: string;
  party: PrintParty;
  documentDate?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: title,
    pageStyle: PAGE_STYLE,
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handlePrint();
        }}
      >
        <Printer />
        {t("common.printExport")}
      </Button>
      <div className="pointer-events-none fixed start-[-12000px] top-0">
        <div ref={contentRef}>
          <PrintTemplate title={title} party={party} documentDate={documentDate}>
            {children}
          </PrintTemplate>
        </div>
      </div>
    </>
  );
}
