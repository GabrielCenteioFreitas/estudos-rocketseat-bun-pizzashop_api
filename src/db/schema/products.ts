import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orderItems, restaurants, users } from ".";

export const products = pgTable("products", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceInCents: integer('price_in_cents').notNull(),
  restaurantId: text('restaurant_id').references(() => restaurants.id, {
    onDelete: 'cascade',
  }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const productsRelations = relations(products, ({ one, many }) => {
  return {
    restaurant: one(users, {
      fields: [products.restaurantId],
      references: [users.id],
      relationName: 'product_restaurant',
    }),
    orderItems: many(orderItems),
  }
})