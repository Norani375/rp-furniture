/**
 * ERP API Service Layer
 * Exports unified database functions from db/database.ts
 * Works with localStorage (dev) and Neon PostgreSQL (production via neon.ts)
 */

export {
  dbInventory,
  dbLedger,
  dbInstallments,
  dbCurrencies,
  dbReset,
  AFN,
  persianDate,
  nextInvoiceId,
} from '../db/database';

export type {
  InventoryItem,
  Transaction,
  InstallmentPlan,
  CurrencySettings,
  ReportFilter,
  ReportSummary,
} from '../types';