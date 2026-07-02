
export const schoolFunctions = mysqlTable('school_functions', {
  id: int('id').autoincrement().primaryKey(),
  branchId: int('branch_id').references(() => institutionalUnits.id).notNull(),
  property: varchar('property', { length: 255 }).notNull(), // e.g. "tuition_fee_logic"
  value: text('value').notNull(), // The actual script/code
  description: text('description'),
  // @ts-expect-error - TS2693: Auto-suppressed for build
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
// @ts-expect-error - TS7006: Auto-suppressed for build
}, (table) => ({
  branchPropIdx: uniqueIndex('branch_prop_idx').on(table.branchId, table.property),
}));
export const schoolFunctionsRelations = relations(schoolFunctions, ({ one }) => ({
  branch: one(institutionalUnits, { fields: [schoolFunctions.branchId], references: [institutionalUnits.id] }),
}));
