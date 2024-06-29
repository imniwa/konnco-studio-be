import { hashPass } from "@/lib/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
    const admin = await prisma.admins.upsert({
        where: {
            username: "admin"
        },
        update: {},
        create: {
            name: "admin",
            username: "admin",
            password: hashPass("admin"),
        }
    })
    const customer = await prisma.customers.upsert({
        where: {
            username: "customer",
        },
        update: {},
        create: {
            name: "customer",
            username: "customer",
            address: "st. customer address",
            email: "customer@konnco.id",
            password: hashPass("customer"),
            phone: "081234567890",
        }
    })
    console.log({ admin, customer })
} catch (e) {
    console.error(`failed to seed: ${e}`)
    await prisma.$disconnect()
    process.exit(1)
}