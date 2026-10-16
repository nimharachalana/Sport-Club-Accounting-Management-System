-- ==============================================================================
-- Step 1: Clean up double-entry layer (run in Supabase SQL Editor if previously executed)
-- ==============================================================================

drop trigger if exists trg_post_tx on transactions;
drop trigger if exists trg_post_opening on settings;
drop trigger if exists trg_categories_account on categories;

alter table categories drop column if exists account_id;
drop table if exists bank_reconciliation_items, bank_reconciliations;
drop table if exists journal_lines, journal_entries, accounts;
drop type if exists account_type;
drop type if exists recon_kind;

drop function if exists post_transaction(), post_opening(), categories_ensure_account(), check_entry_balanced();
drop function if exists post_transfer(date, pay_method, numeric, text), post_manual_journal(date, text, jsonb);
drop function if exists report_trial_balance(date, date), report_summary(text, date, date),
  report_journal(date, date), report_ledger(uuid, date, date), report_balance_sheet(date, date),
  report_receipts_payments(date, date), report_cash_book(date, date), report_monthly_summary(date, date),
  bank_book_balance(date), books_health();

alter table settings drop column if exists opening_date;
