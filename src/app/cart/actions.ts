"use server"

import { createCart, getCart } from "@/lib/db/cart"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"

export async function setProductQuantity(productId: string, quantity: number) {
    const cart = await getCart() ?? await createCart()
    const articleInCart = cart.items.find(item => item.productId === productId)

    if (articleInCart) {
        if (quantity == 0) {
            // Updating the cart here while deleting/updating a cart item
            // helps us to delete outdated carts which are not linked with a user
            await prisma.cart.update({
                where: { id: cart.id },
                data: {
                    items: {
                        delete: { id: articleInCart.id }
                    }
                }
            })
        } else {
            await prisma.cart.update({
                where: { id: cart.id },
                data: {
                    items: {
                        update: {
                            where: { id: articleInCart.id },
                            data: { quantity }
                        }
                    }
                }
            })
        }
    }

    revalidatePath("/cart")
}
