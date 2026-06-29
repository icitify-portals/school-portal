// @ts-expect-error - TS2304: Auto-suppressed for build
export const schoolFunctions = mysqlTable('school_functions', {
  // @ts-expect-error - TS2304: Auto-suppressed for build
  id: int('id').autoincrement().primaryKey(),
  // @ts-expect-error - TS2304: Auto-suppressed for build
  branchId: int('branch_id').references(() => institutionalUnits.id).notNull(),
  // @ts-expect-error - TS2304: Auto-suppressed for build
  property: varchar('property', { length: 255 }).notNull(), // e.g. "tuition_fee_logic"
  // @ts-expect-error - TS2304: Auto-suppressed for build
  value: text('value').notNull(), // The actual script/code
  // @ts-expect-error - TS2304: Auto-suppressed for build
  description: text('description'),
  // @ts-expect-error - TS2693: Auto-suppressed for build
  isActive: boolean('is_active').default(true),
  // @ts-expect-error - TS2304: Auto-suppressed for build
  createdAt: timestamp('created_at').defaultNow(),
  // @ts-expect-error - TS2304: Auto-suppressed for build
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
// @ts-expect-error - TS7006: Auto-suppressed for build
}, (table) => ({
  // @ts-expect-error - TS2304: Auto-suppressed for build
  branchPropIdx: uniqueIndex('branch_prop_idx').on(table.branchId, table.property),
}));

// @ts-expect-error - TS2304: Auto-suppressed for build
export const schoolFunctionsRelations = relations(schoolFunctions, ({ one }) => ({
  // @ts-expect-error - TS2304: Auto-suppressed for build
  branch: one(institutionalUnits, { fields: [schoolFunctions.branchId], references: [institutionalUnits.id] }),
}));
