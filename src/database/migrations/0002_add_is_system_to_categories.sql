ALTER TABLE categories ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0;
UPDATE categories SET is_system = 1 WHERE name IN ('Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Subscriptions', 'Other', 'Salary');
