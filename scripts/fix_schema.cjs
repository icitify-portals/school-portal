const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../src/db/schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// The new definitions
const newGeneralLedger = `export const generalLedger = mysqlTable('general_ledger', {
    id: int('id').autoincrement().primaryKey(),
    transactionDate: timestamp('transaction_date').defaultNow().notNull(),
    periodId: int('period_id'), // Reference to financialPeriods (added dynamically or later)
    accountId: int('account_id').references(() => chartOfAccounts.id).notNull(),
    description: text('description').notNull(),
    debit: decimal('debit', { precision: 12, scale: 2 }).default('0.00'),
    credit: decimal('credit', { precision: 12, scale: 2 }).default('0.00'),
    currency: varchar('currency', { length: 10 }).default('NGN'),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
    reference: varchar('reference', { length: 100 }), // e.g. "INV-001", "PAY-402"
    batchId: varchar('batch_id', { length: 100 }).notNull(), // To link DR and CR lines of the same transaction
    recordedBy: int('recorded_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  });`;

const newStudentBills = `export const studentBills = mysqlTable('student_bills', {
    id: int('id').autoincrement().primaryKey(),
    studentId: int('student_id').references(() => students.id).notNull(),
    sessionId: int('session_id').references(() => academicSessions.id).notNull(),
    billNumber: varchar('bill_number', { length: 50 }).unique().notNull(),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).default('0.00'),
    currency: varchar('currency', { length: 10 }).default('NGN'),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
    status: mysqlEnum('status', ['pending', 'partially_paid', 'paid']).default('pending'),
    partPaymentAllowed: boolean('part_payment_allowed').default(true),
    partPaymentMinPercent: int('part_payment_min_percent').default(60),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow(),
  });`;

const newTransactions = `export const transactions = mysqlTable('transactions', {
    id: int('id').autoincrement().primaryKey(),
    studentId: int('student_id').references(() => students.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('NGN'),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
    type: mysqlEnum('type', ['credit', 'debit']).notNull(),
    purpose: varchar('purpose', { length: 255 }).notNull(), // e.g., "Registration fee", "Hostel fee"
    status: mysqlEnum('status', ['pending', 'completed', 'failed', 'reversed']).default('pending'),
    gateway: mysqlEnum('gateway', ['paystack', 'flutterwave', 'remita', 'opay', 'manual']).default('manual'),
    gatewayReference: varchar('gateway_reference', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
  });`;

// Remove ALL occurrences of the old/duplicated tables using regex
content = content.replace(/export const generalLedger = mysqlTable\('general_ledger', \{[\s\S]*?\}\);/g, '');
content = content.replace(/export const studentBills = mysqlTable\('student_bills', \{[\s\S]*?\}\);/g, '');
content = content.replace(/export const transactions = mysqlTable\('transactions', \{[\s\S]*?\}\);/g, '');

// Now append them right before the advanced accounting module
content = content.replace('// --- ADVANCED ACCOUNTING MODULE ---', 
  newGeneralLedger + '\n\n' + newStudentBills + '\n\n' + newTransactions + '\n\n// --- ADVANCED ACCOUNTING MODULE ---'
);

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Fixed schema!');
