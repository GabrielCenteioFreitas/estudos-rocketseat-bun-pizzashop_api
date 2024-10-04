import Elysia from "elysia"
import { auth } from "../auth"
import { UnauthorizedError } from "../errors/unauthorized-error"
import dayjs from "dayjs"
import { db } from "../../db/connection"
import { orders } from "../../db/schema"
import { and, count, eq, gte, sql, sum } from "drizzle-orm"

export const getMonthOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/month-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const today = dayjs()
    const lastMonth = today.subtract(1, 'month')
    const startOfLastMonth = lastMonth.startOf('month')

    const ordersPerMonth = await db
      .select({
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfLastMonth.toDate()),
        )
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const lastMonthWithYear = lastMonth.format('YYYY-MM')
    const currentMonthWithYear = today.format('YYYY-MM')

    const currentMonthOrdersAmount = ordersPerMonth.find((orderPerMonth) => 
      orderPerMonth.monthWithYear === currentMonthWithYear
    )

    const lastMonthOrdersAmount = ordersPerMonth.find((orderPerMonth) => 
      orderPerMonth.monthWithYear === lastMonthWithYear
    )

    const diffFromLastMonth = currentMonthOrdersAmount && lastMonthOrdersAmount
      ? (currentMonthOrdersAmount.amount / lastMonthOrdersAmount.amount) * 100
      : null

    return {
      amount: currentMonthOrdersAmount?.amount,
      diffFromLastMonth: diffFromLastMonth
        ? Number((diffFromLastMonth - 100).toFixed(2))
        : 0,
    }
  })