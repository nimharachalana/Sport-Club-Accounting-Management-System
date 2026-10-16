-- ==============================================================================
-- Step 2: Simplified Income & Expenditure Report Function
-- Runs directly from normal transactions and categories tables
-- ==============================================================================

drop function if exists report_income_expenditure(date, date);

create or replace function report_income_expenditure(p_from date, p_to date)
returns table (section text, category_id uuid, name_en text, name_si text, amount numeric)
language sql stable as $$
  select t.type::text, c.id, c.name_en, c.name_si, sum(t.amount)
  from transactions t
  join categories c on c.id = t.category_id
  where t.tx_date between p_from and p_to
  group by t.type, c.id
  order by case when t.type = 'income' then 0 else 1 end, sum(t.amount) desc, c.name_en;
$$;
