const { PrismaClient } = require('@prisma/client');

// Single shared Prisma instance — repositories import this, nothing else touches PrismaClient directly.
const prisma = new PrismaClient();

module.exports = { prisma };
