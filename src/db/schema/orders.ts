import { createId } from "@paralleldrive/cuid2";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orderItems, restaurants, users } from ".";
import { relations } from "drizzle-orm";

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'delivering',
  'delivered',
  'canceled',
])

export const orders = pgTable('orders', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  customerId: text('customer_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  restaurantId: text('restaurant_id').references(() => restaurants.id, {
    onDelete: 'cascade',
  }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalInCents: integer('total_in_cents').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const ordersRelations = relations(orders, ({ one, many }) => {
  return {
    customer: one(users, {
      fields: [orders.customerId],
      references: [users.id],
      relationName: 'order_customer',
    }),
    restaurant: one(users, {
      fields: [orders.restaurantId],
      references: [users.id],
      relationName: 'order_restaurant',
    }),
    orderItems: many(orderItems),
  }
})