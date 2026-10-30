import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb' // ✅ Note the lowercase "b"

const prismaClientSingleton = () => {
  // Parse the connection string safely
  const dbUrl = new URL(process.env.DATABASE_URL!)

  // Instantiate the adapter directly using your environment variables
  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname === 'localhost' ? '127.0.0.1' : dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3306,
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1), // strips the leading "/"
    allowPublicKeyRetrieval: true,
  })

  return new PrismaClient({
    adapter, 
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
