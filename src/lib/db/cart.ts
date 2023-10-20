import { cookies } from "next/dist/client/components/headers"
import { prisma } from "./prisma";
import { Cart, CartItem, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type CartWithProducts = Prisma.CartGetPayload<{
    include: { items: { include: { product: true } } }
}>

export type CartItemWithProduct = Prisma.CartItemGetPayload<{
    include: { product: true }
}>

export type ShoppingCart = CartWithProducts & {
    size: number,
    subtotal: number
}

export async function getCart(): Promise<ShoppingCart | null> {
    const session = await getServerSession(authOptions)
    let cart: CartWithProducts | null

    if (session && session.user) {
        cart = await prisma.cart.findFirst({
            where: { userId: session.user.id },
            include: { items: { include: { product: true } } }
        })
    } else {
        const localCartId = cookies().get("localCartId")?.value
        cart =
            localCartId ?
                await prisma.cart.findUnique({
                    where: { id: localCartId },
                    include: { items: { include: { product: true } } }
                }) : null;
    }


    if (!cart) return null;

    return {
        ...cart,
        size: cart.items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: cart.items.reduce(
            (acc, item) => acc + item.product.price * item.quantity,
            0
        )
    }
}

export async function createCart(): Promise<ShoppingCart> {
    const session = await getServerSession(authOptions)

    let newCart: Cart;

    if (session && session.user) {
        newCart = await prisma.cart.create({
            data: { userId: session.user.id }
        })
    } else {
        newCart = await prisma.cart.create({
            data: {}
        })

        cookies().set("localCartId", newCart.id)
    }

    return {
        ...newCart,
        items: [],
        size: 0,
        subtotal: 0
    }
}

export async function mergeAnonymousCartIntoUserCart(userId: string) {
    const localCartId = cookies().get("localCartId")?.value

    const localCart = localCartId ?
        await prisma.cart.findUnique({
            where: { id: localCartId },
            include: { items: true }
        })
        : null;

    if (!localCart) return;

    const userCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true }
    })

    await prisma.$transaction(async tx => {
        // A user account creation does not gurranty a cart association with the user as well
        // A user-cart is only created once user adds items to the cart
        if (userCart) {
            const mergedCartItems = megerCartItems(localCart.items, userCart.items)

            // Delete the items in user cart
            await tx.cartItem.deleteMany({
                where: { cartId: userCart.id }
            })

            // Add the merged cart items with new ids into the user cart
            await tx.cartItem.createMany({
                data: mergedCartItems.map(item => ({
                    cartId: userCart.id,
                    productId: item.productId,
                    quantity: item.quantity
                }))
            })
        } else {
            await tx.cart.create({
                data: {
                    userId,
                    items: {
                        createMany: {
                            data: localCart.items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity
                            }))
                        }
                    }
                }
            })
        }

        // delete the local cart
        await tx.cart.delete({
            where: { id: localCart.id }
        })

        // remove the cookie
        cookies().set("localCartId", "")
    })
}

function megerCartItems(...cartItems: CartItem[][]) {
    return cartItems.reduce((acc, items) => {
        items.forEach(item => {
            const exisTingItem = acc.find(i => i.productId === item.productId);
            if (exisTingItem) exisTingItem.quantity += item.quantity;
            else acc.push(item)
        })
        return acc
    }, [] as CartItem[])
}
