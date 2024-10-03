/* eslint-disable drizzle/enforce-delete-with-where */ 

import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import chalk from 'chalk'
import { db } from './connection'
import { authLinks, orderItems, orders, products, restaurants, users } from './schema'

/**
 * Reset database
 */
await db.delete(users)
await db.delete(restaurants)
await db.delete(orderItems)
await db.delete(orders)
await db.delete(products)
await db.delete(authLinks)

console.log(chalk.yellow('✔ Database reset!'))

/**
 * Create customers
 */
const [customer1, customer2] = await db.insert(users).values([
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'customer',
  },
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'customer',
  },
]).returning()
console.log(chalk.yellow('✔ Customers created!'))

/**
 * Create manager
 */
const [manager] = await db.insert(users).values([
  {
    name: faker.person.fullName(),
    email: 'admin@admin.com',
    role: 'manager',
  },
]).returning({
  id: users.id,
})
console.log(chalk.yellow('✔ Manager created!'))

/**
 * Create restaurant
 */
const [restaurant] = await db.insert(restaurants).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    managerId: manager.id,
  },
]).returning()
console.log(chalk.yellow('✔ Restaurant created!'))

function generateProduct() {
  return {
    name: faker.commerce.productName(),
    restaurantId: restaurant.id,
    description: faker.commerce.productDescription(),
    priceInCents: Number(faker.commerce.price({ min: 190, max: 490, dec: 0 })),
  }
}

/**
 * Create products
 */
const availableProducts = await db.insert(products).values([
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
]).returning()
console.log(chalk.yellow('✔ Products created!'))

/**
 * Create orders
 */
type OrderItemsInsert = typeof orderItems.$inferInsert
type OrderInsert = typeof orders.$inferInsert
const orderItemsToInsert: OrderItemsInsert[] = []
const ordersToInsert: OrderInsert[] = []

for (let i = 0; i < 200; i++) {
  const orderId = createId()

  const orderProducts = faker.helpers.arrayElements(availableProducts, {
    min: 1,
    max: 3,
  })

  let totalInCents = 0;
  
  orderProducts.forEach(orderProduct => {
    const quantity = faker.number.int({
      min: 1,
      max: 3,
    })
    totalInCents += orderProduct.priceInCents * quantity

    orderItemsToInsert.push({
      orderId,
      productId: orderProduct.id,
      priceInCents: orderProduct.priceInCents,
      quantity,
    })
  })

  ordersToInsert.push({
    id: orderId,
    customerId: faker.helpers.arrayElement([customer1, customer2]).id,
    restaurantId: restaurant.id,
    totalInCents,
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'delivering',
      'delivered',
      'canceled',
    ]),
    createdAt: faker.date.recent({ days: 40 }),
  })
}

await db.insert(orders).values(ordersToInsert)
await db.insert(orderItems).values(orderItemsToInsert)
console.log(chalk.yellow('✔ Orders created!'))

console.log(chalk.greenBright('Database seeded successfully!'))

process.exit()