-- ==============================================================================
-- Step 3: Test with Known Numbers in a dev Supabase project
-- Expected Results for Jan 2026:
-- Total Income: 25,000.00
-- Total Expenditure: 4,250.50
-- Surplus for the period: 20,749.50
-- ==============================================================================

-- Optional: delete from transactions;

insert into transactions (type, tx_date, amount, category_id, method, party, bill_no) values
 ('income', '2026-01-05',  5000,   (select id from categories where name_en = 'Membership fees'),     'cash', 'Kamal',       'R-001'),
 ('income', '2026-01-10', 20000,   (select id from categories where name_en = 'Sponsorships'),        'bank', 'ABC Ltd',     null),
 ('expense','2026-01-12',  3000,   (select id from categories where name_en = 'Ground / court rent'), 'bank', 'Council',     'B-77'),
 ('expense','2026-01-15',  1250.50,(select id from categories where name_en = 'Equipment'),           'cash', 'Sports shop', 'B-78');

-- Run the report verification:
select * from report_income_expenditure('2026-01-01', '2026-01-31');
