"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/components/locale-provider";

export type PrintParty = {
  projectNumber: string;
  clientName: string;
  location: string;
  contactPerson?: string | null;
  phone?: string;
  email?: string;
};

export function PrintTemplate({
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
  const { locale, t } = useI18n();
  const dateLabel =
    documentDate ||
    new Date().toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
      dateStyle: "medium",
    });

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
            {title}
          </h1>
          <p className="mt-1 text-xs text-neutral-600">{dateLabel}</p>
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
        </div>
      </section>

      <section className="mt-6 text-sm leading-6">{children}</section>

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
