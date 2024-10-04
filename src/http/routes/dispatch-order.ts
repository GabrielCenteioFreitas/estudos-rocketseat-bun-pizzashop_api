import Elysia, { t } from "elysia";
import { auth } from "../auth";
import { UnauthorizedError } from "../errors/unauthorized-error";
import { db } from "../../db/connection";
import { and, eq } from "drizzle-orm";
import { orders } from "../../db/schema";

export const dispatchOrder = new Elysia()
  .use(auth)
  .patch('/orders/:orderId/dispatch', async ({ getCurrentUser, set, params }) => {
    const { orderId } = params
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const order = await db.query.orders.findFirst({
      where(fields, { eq }) {
        return and(
          eq(fields.id, orderId),
          eq(fields.restaurantId, restaurantId),
        )
      },
    })

    if (!order) {
      set.status = 400

      return {
        message: 'Order not found.'
      }
    }

    if (order.status !== 'processing') {
      set.status = 400

      return {
        message: 'You can only dispatch processing orders.'
      }
    }

    await db
      .update(orders)
      .set({ status: 'delivering' })
      .where(eq(orders.id, orderId))
  }, {
    params: t.Object({
      orderId: t.String(),
    })
  })