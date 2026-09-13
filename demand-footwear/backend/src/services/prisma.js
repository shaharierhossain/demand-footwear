/**
 * Singleton Prisma client — import this everywhere instead of
 * instantiating `new PrismaClient()` per file, to avoid exhausting
 * database connections in development (hot reload) or serverless.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = global.__df_prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__df_prisma = prisma;

module.exports = prisma;
