import Elysia, { t } from "elysia";
import { auth } from "../auth";
import { UnauthorizedError } from "../errors/unauthorized-error";
import { db } from "../../db/connection";
import { eq } from "drizzle-orm";
import { orders } from "../../db/schema";

export const cancelOrder = new Elysia()
  .use(auth)
  .patch('/orders/:orderId/cancel', async ({ getCurrentUser, set, params }) => {
    const { orderId } = params
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const order = await db.query.orders.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, orderId)
      },
    })

    if (!order) {
      set.status = 400

      return {
        message: 'Order not found.'
      }
    }

    if (!['pending', 'processing'].includes(order.status)) {
      set.status = 400

      return {
        message: 'You can only cancel pending orders after dispatch.'
      }
    }

    await db
      .update(orders)
      .set({ status: 'canceled' })
      .where(eq(orders.id, orderId))
  }, {
    params: t.Object({
      orderId: t.String(),
    })
  })