// projects: Core project definitions
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  clientName: text('client_name'),
  type: text('type').notNull(), // 'hourly', 'fixed', 'retainer'
  currency: text('currency').default('USD'),
  hourlyRate: integer('hourly_rate'), // Cents (e.g. $50.00 -> 5000)
  fixedPrice: integer('fixed_price'),
  archived: integer('archived').default(0),
  assetsPath: text('assets_path'), // Local folder path
  createdAt: integer('created_at'),
});

// services: Service catalog from price list
export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // 'Logo Design', 'SEO Monthly'
  billingModel: text('billing_model'), // 'unit', 'subscription', 'hourly'
  defaultPrice: integer('default_price'),
  unitName: text('unit_name'), // 'Page', 'Video', 'Month'
});

// logs: Work records (Both time and unit based)
export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  serviceId: text('service_id').references(() => services.id),
  startTime: integer('start_time'),
  endTime: integer('end_time'),
  duration: integer('duration'), // Seconds
  quantity: real('quantity'), // For unit based tasks (e.g. 1.5 video)
  notes: text('notes'), // Rich Text JSON (TipTap)
  activityScore: integer('activity_score'), // Productivity 0-100
});

// expenses: Project expenses
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  description: text('description'),
  amount: integer('amount'),
  isBillable: integer('is_billable').default(1),
  date: integer('date'),
});

// settings: VS Code style settings
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(), // 'ai.apiKey', 'theme.mode'
  value: text('value'), // JSON string value
});