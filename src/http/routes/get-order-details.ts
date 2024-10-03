import Elysia, { t } from "elysia";
import { auth } from "../auth";
import { UnauthorizedError } from "../errors/unauthorized-error";
import { db } from "../../db/connection";

export const getOrderDetails = new Elysia()
  .use(auth)
  .get('/orders/:orderId', async ({ getCurrentUser, params, set }) => {
    const { orderId } = params
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const order = await db.query.orders.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, orderId)
      },
      with: {
        customer: {
          columns: {
            name: true,
            phone: true,
            email: true,
          }
        },
        orderItems: {
          with: {
            product: {
              columns: {
                name: true,
                priceInCents: true,
              }
            },
          },
          columns: {
            id: true,
            quantity: true,
          }
        },
      },
      columns: {
        id: true,
        status: true,
        totalInCents: true,
        createdAt: true,
      }
    })

    if (!order) {
      set.status = 400
      return {
        message: 'Order not found.'
      }
    }

    return {
      order,
    }
  }, {
    params: t.Object({
      orderId: t.String(),
    }),
  })