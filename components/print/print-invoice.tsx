"use client";

import { Printer } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

import { useI18n } from "@/components/locale-provider";
import type { PrintParty } from "@/components/print/print-template";
import { Button } from "@/components/ui/button";
import {
  formatExchangeRate,
  formatMoney,
  type AppCurrency,
} from "@/lib/money";

const PAGE_STYLE = `
  @page { size: A4 portrait; margin: 12mm; }
  html, body { background: #fff !important; color: #171717 !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

export type InvoicePrintValues = {
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  stageName?: string | null;
  currency: AppCurrency;
  subtotal: number;
  vat: number;
  total: number;
  exchangeRateLbp: number;
  vatAmountLbp: number;
  totalLbp: number;
  mofNumber: string;
  tvaNumber: string;
  crNumber: string;
  status: string;
};

export function PrintInvoice({
  party,
  invoice,
}: {
  party: PrintParty;
  invoice: InvoicePrintValues;
}) {
  const { locale, t } = useI18n();
  const dateLabel =
    invoice.issueDate ||
    new Date().toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
      dateStyle: "medium",
    });
  const billingCurrency = invoice.currency;

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="print-sheet mx-auto min-h-[297mm] w-[210mm] bg-white p-8 text-neutral-900"
    >
      <header className="flex items-start justify-between gap-6 border-b-2 border-[#8b5a2b] pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="EDEN ATELIER"
          className="h-16 w-auto object-contain"
        />
        <div className="text-end">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-[#8b5a2b]">
            EDEN ATELIER
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("invoices.printTitle")}
          </h1>
          <p className="mt-1 text-xs text-neutral-600">{dateLabel}</p>
          <dl className="mt-3 space-y-0.5 text-start text-[11px] text-neutral-700">
            <div className="flex justify-between gap-6">
              <dt>{t("invoices.mofNumber")}</dt>
              <dd className="font-medium">{invoice.mofNumber || "—"}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt>{t("invoices.tvaNumber")}</dt>
              <dd className="font-medium">{invoice.tvaNumber || "—"}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt>{t("invoices.crNumber")}</dt>
              <dd className="font-medium">{invoice.crNumber || "—"}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8b5a2b]">
            {t("print.preparedFor")}
          </p>
          <p className="font-medium">{party.clientName}</p>
          {party.contactPerson ? (
            <p className="text-neutral-600">{party.contactPerson}</p>
          ) : null}
          {party.phone ? <p className="text-neutral-600">{party.phone}</p> : null}
          {party.email ? <p className="text-neutral-600">{party.email}</p> : null}
        </div>
        <div className="text-end">
          <p className="text-xs uppercase tracking-wide text-[#8b5a2b]">
            {t("print.project")}
          </p>
          <p className="font-medium">{party.projectNumber}</p>
          <p className="text-neutral-600">
            {t("print.location")}: {party.location}
          </p>
          {invoice.invoiceNumber ? (
            <p className="mt-2 font-medium">
              {t("invoices.invoiceNumber")}: {invoice.invoiceNumber}
            </p>
          ) : null}
          <p className="text-neutral-600">
            {t("invoices.dueDate")}: {invoice.dueDate || "—"}
          </p>
        </div>
      </section>

      <section className="mt-6 text-sm">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b border-neutral-200">
              <th className="py-2 text-start font-normal text-neutral-500">
                {t("invoices.stage")}
              </th>
              <td className="py-2 text-end font-medium">
                {invoice.stageName
                  ? t(`options.paymentStages.${invoice.stageName}`)
                  : "—"}
              </td>
            </tr>
            <tr className="border-b border-neutral-200">
              <th className="py-2 text-start font-normal text-neutral-500">
                {t("invoices.subtotal")} (USD)
              </th>
              <td className="py-2 text-end">
                {formatMoney(
                  billingCurrency === "USD"
                    ? invoice.subtotal
                    : invoice.exchangeRateLbp
                      ? invoice.subtotal / invoice.exchangeRateLbp
                      : invoice.subtotal,
                  locale,
                  "USD"
                )}
              </td>
            </tr>
            <tr className="border-b border-neutral-200">
              <th className="py-2 text-start font-normal text-neutral-500">
                {t("invoices.vat")}
              </th>
              <td className="py-2 text-end">
                {formatMoney(
                  billingCurrency === "USD"
                    ? invoice.vat
                    : invoice.exchangeRateLbp
                      ? invoice.vat / invoice.exchangeRateLbp
                      : invoice.vat,
                  locale,
                  "USD"
                )}
              </td>
            </tr>
            <tr className="border-b border-neutral-300">
              <th className="py-2 text-start font-medium">
                {t("invoices.total")} (USD)
              </th>
              <td className="py-2 text-end text-lg font-semibold">
                {formatMoney(
                  billingCurrency === "USD"
                    ? invoice.total
                    : invoice.exchangeRateLbp
                      ? invoice.total / invoice.exchangeRateLbp
                      : invoice.total,
                  locale,
                  "USD"
                )}
              </td>
            </tr>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="py-2 text-start font-normal text-neutral-600">
                {t("invoices.vatLbpAt")}{" "}
                {formatExchangeRate(invoice.exchangeRateLbp, locale)}
              </th>
              <td className="py-2 text-end font-medium">
                {formatMoney(invoice.vatAmountLbp, locale, "LBP")}
              </td>
            </tr>
            <tr>
              <th className="py-2 text-start font-normal text-neutral-500">
                {t("invoices.totalLbp")}
              </th>
              <td className="py-2 text-end">
                {formatMoney(invoice.totalLbp, locale, "LBP")}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className="mt-12 grid grid-cols-2 gap-10 pt-8">
        {["print.clientApproval", "print.companyRep"].map((key) => (
          <div key={key} className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8b5a2b]">
              {t(key)}
            </p>
            <div className="border-b border-neutral-400 pt-10" />
            <p className="text-xs text-neutral-600">
              {t("print.signature")} / {t("print.name")}
            </p>
            <div className="border-b border-neutral-300 pt-6" />
            <p className="text-xs text-neutral-600">{t("print.date")}</p>
          </div>
        ))}
      </footer>
    </div>
  );
}

export function PrintInvoiceButton({
  party,
  invoice,
}: {
  party: PrintParty;
  invoice: InvoicePrintValues;
}) {
  const { t } = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: invoice.invoiceNumber || t("invoices.printTitle"),
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
          <PrintInvoice party={party} invoice={invoice} />
        </div>
      </div>
    </>
  );
}
