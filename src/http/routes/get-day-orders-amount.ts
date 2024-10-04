import dayjs from "dayjs"
import Elysia from "elysia"
import { auth } from "../auth"
import { UnauthorizedError } from "../errors/unauthorized-error"
import { db } from "../../db/connection"
import { and, count, eq, gte, sql } from "drizzle-orm"
import { orders } from "../../db/schema"

export const getDayOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/day-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const today = dayjs()
    const yesterday = today.subtract(1, 'day')
    const startOfYesterday = yesterday.startOf('day')

    const orderPerDay = await db
      .select({
        dayWithMonthAndYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfYesterday.toDate()),
        )
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)

    const todayWithMonthAndYear = today.format('YYYY-MM-DD')
    const yesterdayWithMonthAndYear = yesterday.format('YYYY-MM-DD')

    const todayOrdersAmount = orderPerDay.find((orderAmount) => 
      orderAmount.dayWithMonthAndYear === todayWithMonthAndYear
    )

    const yesterdayOrdersAmount = orderPerDay.find((orderAmount) => 
      orderAmount.dayWithMonthAndYear === yesterdayWithMonthAndYear
    )

    const diffFromYesterday = todayOrdersAmount && yesterdayOrdersAmount
      ? (todayOrdersAmount.amount / yesterdayOrdersAmount.amount) * 100
      : todayOrdersAmount
        ? -100
        : 0


    return {
      amount: todayOrdersAmount?.amount,
      diffFromYesterday: Number((diffFromYesterday - 100).toFixed(2))
    }
  })