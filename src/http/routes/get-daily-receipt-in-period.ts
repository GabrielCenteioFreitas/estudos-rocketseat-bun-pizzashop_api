import dayjs from "dayjs"
import Elysia, { t } from "elysia"
import { auth } from "../auth"
import { UnauthorizedError } from "../errors/unauthorized-error"
import { db } from "../../db/connection"
import { and, count, eq, gte, lte, sql, sum } from "drizzle-orm"
import { orders } from "../../db/schema"

export const getDailyReceiptInPeriod = new Elysia()
  .use(auth)
  .get('/metrics/daily-receipt-in-period', async ({ query, getCurrentUser, set }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const { from, to } = query
    const startDate = from ? dayjs(from) : dayjs().subtract(7, 'days')
    const endDate = to ? dayjs(to) : from ? startDate.add(7, 'days') : dayjs()

    if (endDate.diff(startDate, 'days') > 7) {
      set.status = 400

      return {
        message: 'You cannot list receipt in a larger period than 7 days.'
      }
    }

    const receiptsPerDay = await db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'DD/MM')`,
        receipt: sum(orders.totalInCents).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(
            orders.createdAt,
            startDate
              .startOf('day')
              .add(startDate.utcOffset(), 'minutes')
              .toDate()
          ),
          lte(
            orders.createdAt,
            endDate
              .endOf('day')
              .add(endDate.utcOffset(), 'minutes')
              .toDate()
          ),
        )
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'DD/MM')`)

    const orderedReceiptPerDay = receiptsPerDay.sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number)
      const [dayB, monthB] = b.date.split('/').map(Number)

      if (monthA === monthB) {
        return dayB - dayA
      } else {
        const dateA = new Date(2024, monthA - 1)
        const dateB = new Date(2024, monthB - 1)

        return dateB.getTime() - dateA.getTime()
      }
    })

    return {
      dailyReceipt: orderedReceiptPerDay
    }
  }, {
    query: t.Object({
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
    })
  })