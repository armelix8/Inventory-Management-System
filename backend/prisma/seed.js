/**
 * Prisma Seed Script
 * Run with: node prisma/seed.js
 * Or: npx prisma db seed
 *
 * Populates PostgreSQL with test data for development.
 * You run this locally — the application does not connect directly.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ITEMS = [
  { itemName: 'Laptop Dell XPS 15', supplier: 'Dell Inc.', unit: 'Piece', unitPrice: 1299.99 },
  { itemName: 'USB-C Cable 2m', supplier: 'TechSupply Co.', unit: 'Piece', unitPrice: 12.50 },
  { itemName: 'Monitor LG 27"', supplier: 'LG Electronics', unit: 'Piece', unitPrice: 349.00 },
  { itemName: 'Wireless Mouse', supplier: 'Logitech', unit: 'Piece', unitPrice: 29.99 },
  { itemName: 'A4 Paper Ream', supplier: 'Office Depot', unit: 'Ream', unitPrice: 4.99 },
];

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const existingUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@inventory.com',
        password: hashedPassword,
      },
    });
    console.log('Created default admin user (username: admin, password: admin123)');
  }

  // Create stock items (Items Master)
  const createdItems = [];
  for (const item of ITEMS) {
    const created = await prisma.stockItem.create({ data: item });
    createdItems.push(created);
  }
  console.log(`Created ${createdItems.length} stock items.`);

  const [item1, item2, item3] = createdItems;
  const now = new Date();
  const currentQuarter = `Q${Math.floor((now.getMonth() + 1) / 3) + 1} ${now.getFullYear()}`;

  // Stock In entries
  await prisma.stockIn.createMany({
    data: [
      { itemId: item1.id, receivedDate: now, receivedQuarter: currentQuarter, quantity: 10, specification: 'New batch' },
      { itemId: item2.id, receivedDate: now, receivedQuarter: currentQuarter, quantity: 100 },
      { itemId: item3.id, receivedDate: now, receivedQuarter: currentQuarter, quantity: 5, specification: '4K models' },
    ],
  });
  console.log('Created stock in entries.');

  // Stock Out entries (less than stock in so balance remains positive)
  await prisma.stockOut.createMany({
    data: [
      { itemId: item1.id, requestedDate: now, requestedQuarter: currentQuarter, requestingPerson: 'John Doe', requestReason: 'New hire equipment', quantity: 2 },
      { itemId: item2.id, requestedDate: now, requestedQuarter: currentQuarter, requestingPerson: 'Jane Smith', requestReason: 'Replacement cable', quantity: 5 },
    ],
  });
  console.log('Created stock out entries.');

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
