"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, Loader2, Plus, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { createTransaction, saveAccount } from "@/actions/accounting";
import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatExchangeRate, formatMoney } from "@/lib/money";
import { masterLabel } from "@/lib/master-data";
import type { CategoryOption } from "@/lib/validations/category";
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  TRANSACTION_TYPES,
  accountFormSchema,
  emptyAccountValues,
  emptyTransactionValues,
  transactionFormSchema,
  type AccountFormValues,
  type AccountTypeValue,
  type CurrencyValue,
  type TransactionFormValues,
  type TransactionTypeValue,
} from "@/lib/validations/accounting";

export type FinanceAccountRow = {
  id: string;
  name: string;
  type: AccountTypeValue;
  balance: number;
  currency: CurrencyValue;
};

export type FinanceTransactionRow = {
  id: string;
  date: string;
  type: TransactionTypeValue;
  category: string;
  categoryId: string | null;
  categoryNameEn: string | null;
  categoryNameAr: string | null;
  amount: number;
  currency: CurrencyValue;
  exchangeRate: number | null;
  accountName: string;
  accountCurrency: CurrencyValue;
  projectNumber: string | null;
};

export type FinanceProjectOption = {
  id: string;
  projectNumber: string;
};

function AccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: emptyAccountValues,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(emptyAccountValues);
  }, [open, form]);

  async function onSubmit(values: AccountFormValues) {
    setServerError(null);
    const result = await saveAccount(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("accounting.addAccount")}</DialogTitle>
          <DialogDescription>{t("accounting.subtitle")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField span="wide" data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="acc-name">{t("accounting.accountName")}</FieldLabel>
                <Input id="acc-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.type}>
                <FieldLabel>{t("accounting.accountType")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`options.accountTypes.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {ACCOUNT_TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.accountTypes.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.type]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.currency}>
                <FieldLabel>{t("accounting.currency")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`options.currencies.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {CURRENCIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.currencies.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.currency]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.balance}>
                <FieldLabel htmlFor="acc-balance">
                  {t("accounting.openingBalance")}
                </FieldLabel>
                <Input
                  id="acc-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("balance")}
                />
                <FieldError errors={[form.formState.errors.balance]} />
              </FormField>
            </FormGrid>
          </FieldGroup>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("accounting.saveAccount")
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TransactionDialog({
  open,
  onOpenChange,
  accounts,
  projects,
  expenseCategories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccountRow[];
  projects: FinanceProjectOption[];
  expenseCategories: CategoryOption[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      ...emptyTransactionValues,
      accountId: accounts[0]?.id ?? "",
      currency: accounts[0]?.currency ?? "USD",
      categoryId: expenseCategories[0]?.id ?? "",
    },
  });

  const accountId = form.watch("accountId");
  const currency = form.watch("currency");
  const type = form.watch("type");
  const selectedAccount = accounts.find((item) => item.id === accountId);
  const conversion = Boolean(
    selectedAccount && selectedAccount.currency !== currency
  );

  useEffect(() => {
    form.setValue("conversion", conversion);
  }, [conversion, form]);

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset({
      ...emptyTransactionValues,
      accountId: accounts[0]?.id ?? "",
      currency: accounts[0]?.currency ?? "USD",
      categoryId: expenseCategories[0]?.id ?? "",
    });
  }, [open, accounts, expenseCategories, form]);

  async function onSubmit(values: TransactionFormValues) {
    setServerError(null);
    const result = await createTransaction({ ...values, conversion });
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("accounting.addTransaction")}</DialogTitle>
          <DialogDescription>{t("accounting.cashbookHint")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.date}>
                <FieldLabel htmlFor="tx-date">{t("accounting.date")}</FieldLabel>
                <Input id="tx-date" type="date" {...form.register("date")} />
                <FieldError errors={[form.formState.errors.date]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.accountId}>
                <FieldLabel>{t("accounting.account")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="accountId"
                  render={({ field }) => {
                    const selected = accounts.find((item) => item.id === field.value);
                    return (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (!value) return;
                          field.onChange(value);
                          const account = accounts.find((item) => item.id === value);
                          if (account) form.setValue("currency", account.currency);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {selected
                              ? `${selected.name} (${selected.currency})`
                              : t("accounting.selectAccount")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {accounts.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} · {item.currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                <FieldError errors={[form.formState.errors.accountId]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.currency}>
                <FieldLabel>{t("accounting.currency")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`options.currencies.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {CURRENCIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.currencies.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.type}>
                <FieldLabel>{t("accounting.type")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`options.transactionTypes.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {TRANSACTION_TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.transactionTypes.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.type]} />
              </FormField>
              {type === "EXPENSE" ? (
                <FormField data-invalid={!!form.formState.errors.categoryId}>
                  <FieldLabel>{t("accounting.expenseCategory")}</FieldLabel>
                  <Controller
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => {
                      const selected = expenseCategories.find(
                        (row) => row.id === field.value
                      );
                      return (
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) => {
                            if (value) field.onChange(value);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {selected
                                ? masterLabel(selected, locale)
                                : t("accounting.selectCategory")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            {expenseCategories.map((row) => (
                              <SelectItem key={row.id} value={row.id}>
                                {masterLabel(row, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                  <FieldError errors={[form.formState.errors.categoryId]} />
                </FormField>
              ) : (
                <FormField data-invalid={!!form.formState.errors.category}>
                  <FieldLabel htmlFor="tx-category">{t("accounting.category")}</FieldLabel>
                  <Input id="tx-category" {...form.register("category")} />
                  <FieldError errors={[form.formState.errors.category]} />
                </FormField>
              )}
              <FormField data-invalid={!!form.formState.errors.amount}>
                <FieldLabel htmlFor="tx-amount">{t("accounting.amount")}</FieldLabel>
                <Input
                  id="tx-amount"
                  type="number"
                  min="0.01"
                  step={currency === "LBP" ? "1" : "0.01"}
                  {...form.register("amount")}
                />
                <FieldError errors={[form.formState.errors.amount]} />
              </FormField>
              {conversion ? (
                <FormField span="wide" data-invalid={!!form.formState.errors.exchangeRate}>
                  <FieldLabel htmlFor="tx-rate">{t("accounting.exchangeRate")}</FieldLabel>
                  <Input
                    id="tx-rate"
                    type="number"
                    min="1"
                    step="1"
                    {...form.register("exchangeRate")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("accounting.conversionHint")}
                  </p>
                  <FieldError errors={[form.formState.errors.exchangeRate]} />
                </FormField>
              ) : null}
              <FormField>
                <FieldLabel htmlFor="tx-ref">{t("accounting.reference")}</FieldLabel>
                <Input id="tx-ref" {...form.register("reference")} />
              </FormField>
              <FormField>
                <FieldLabel>{t("accounting.project")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="projectId"
                  render={({ field }) => {
                    const selected = projects.find((item) => item.id === field.value);
                    return (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? "" : value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {selected?.projectNumber ?? t("accounting.noProject")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="none">
                            {t("accounting.noProject")}
                          </SelectItem>
                          {projects.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.projectNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="tx-notes">{t("accounting.notes")}</FieldLabel>
                <Input id="tx-notes" {...form.register("notes")} />
              </FormField>
            </FormGrid>
          </FieldGroup>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("accounting.saveTransaction")
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceWorkspace({
  accounts,
  transactions,
  projects,
  expenseCategories,
}: {
  accounts: FinanceAccountRow[];
  transactions: FinanceTransactionRow[];
  projects: FinanceProjectOption[];
  expenseCategories: CategoryOption[];
}) {
  const { locale, t } = useI18n();
  const [accountOpen, setAccountOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const usdTotal = accounts
    .filter((item) => item.currency === "USD")
    .reduce((sum, item) => sum + item.balance, 0);
  const lbpTotal = accounts
    .filter((item) => item.currency === "LBP")
    .reduce((sum, item) => sum + item.balance, 0);

  const visibleTransactions = useMemo(() => {
    if (categoryFilter === "all") return transactions;
    return transactions.filter((item) => item.categoryId === categoryFilter);
  }, [categoryFilter, transactions]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("accounting.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("accounting.subtitle")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setAccountOpen(true)}>
            <Plus />
            {t("accounting.addAccount")}
          </Button>
          <Button
            onClick={() => setTransactionOpen(true)}
            disabled={accounts.length === 0}
          >
            <Plus />
            {t("accounting.addTransaction")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("accounting.usdCashbox")}</CardTitle>
            <CardDescription>USD</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-heading text-3xl font-semibold tracking-tight">
              {formatMoney(usdTotal, locale, "USD")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("accounting.lbpCashbox")}</CardTitle>
            <CardDescription>LBP</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-heading text-3xl font-semibold tracking-tight">
              {formatMoney(lbpTotal, locale, "LBP")}
            </p>
          </CardContent>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">{t("accounting.emptyAccounts")}</p>
            <Button onClick={() => setAccountOpen(true)}>
              <Plus />
              {t("accounting.addAccount")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {account.type === "BANK" ? (
                    <Landmark className="size-4 text-muted-foreground" />
                  ) : (
                    <Wallet className="size-4 text-muted-foreground" />
                  )}
                  {account.name}
                </CardTitle>
                <CardDescription>
                  {t(`options.accountTypes.${account.type}`)} · {account.currency}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-heading text-2xl font-semibold tracking-tight">
                  {formatMoney(account.balance, locale, account.currency)}
                </p>
                <p className="text-xs text-muted-foreground">{t("accounting.balance")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("accounting.cashbook")}</CardTitle>
            <CardDescription>{t("accounting.cashbookHint")}</CardDescription>
          </div>
          <Select value={categoryFilter} onValueChange={(value) => value && setCategoryFilter(value)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue>
                {categoryFilter === "all"
                  ? t("accounting.allCategories")
                  : masterLabel(
                      expenseCategories.find((item) => item.id === categoryFilter) ?? {
                        nameEn: t("accounting.category"),
                        nameAr: t("accounting.category"),
                      },
                      locale
                    )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="all">{t("accounting.allCategories")}</SelectItem>
              {expenseCategories.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {masterLabel(item, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-4">
          {visibleTransactions.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              {t("accounting.emptyLedger")}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t("accounting.date")}</TableHead>
                    <TableHead>{t("accounting.account")}</TableHead>
                    <TableHead>{t("accounting.category")}</TableHead>
                    <TableHead>{t("accounting.type")}</TableHead>
                    <TableHead>{t("accounting.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleTransactions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
                        {item.accountName}
                        {item.projectNumber ? (
                          <span className="block text-xs text-muted-foreground">
                            {item.projectNumber}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {item.categoryNameEn
                          ? masterLabel(
                              {
                                nameEn: item.categoryNameEn,
                                nameAr: item.categoryNameAr ?? item.categoryNameEn,
                              },
                              locale
                            )
                          : item.category}
                        {item.exchangeRate ? (
                          <span className="block text-xs text-muted-foreground">
                            {t("accounting.exchangeRate")}{" "}
                            {formatExchangeRate(item.exchangeRate, locale)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.type === "INCOME"
                              ? "default"
                              : item.type === "EXPENSE"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {t(`options.transactionTypes.${item.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.type === "INCOME" ? "+" : "−"}
                        {formatMoney(item.amount, locale, item.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
      <TransactionDialog
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
        accounts={accounts}
        projects={projects}
        expenseCategories={expenseCategories}
      />
    </div>
  );
}
