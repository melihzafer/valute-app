ALTER TABLE `expenses` ADD `invoice_id` text REFERENCES invoices(id);--> statement-breakpoint
ALTER TABLE `logs` ADD `invoice_id` text REFERENCES invoices(id);