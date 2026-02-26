import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getQuarterFromDate } from '../src/lib/quarters.js';

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

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const existingUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@inventory.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Created default admin (username: admin, password: admin123)');
  }

  const existingItems = await prisma.stockItem.count();
  if (existingItems > 0) {
    console.log('Items already exist, skipping seed items.');
  } else {
    const createdItems = [];
    for (const item of ITEMS) {
      const created = await prisma.stockItem.create({ data: item });
      createdItems.push(created);
    }
    console.log(`Created ${createdItems.length} stock items.`);
    const now = new Date();
    const currentQuarter = getQuarterFromDate(now);
    const [item1, item2, item3] = createdItems;
    await prisma.stockIn.createMany({
      data: [
        { itemId: item1.id, receivedDate: now, receivedQuarter: currentQuarter, quantity: 10, specification: 'New batch' },
        { itemId: item2.id, receivedDate: now, receivedQuarter: currentQuarter, quantity: 100 },
        { itemId: item3.id, receivedDate: now, receivedQuarter: currentQuarter, quantity: 5, specification: '4K models' },
      ],
    });
    await prisma.stockOut.createMany({
      data: [
        { itemId: item1.id, requestedDate: now, requestedQuarter: currentQuarter, requestingPerson: 'John Doe', requestReason: 'New hire equipment', quantity: 2 },
        { itemId: item2.id, requestedDate: now, requestedQuarter: currentQuarter, requestingPerson: 'Jane Smith', requestReason: 'Replacement cable', quantity: 5 },
      ],
    });
    console.log('Created stock in/out entries.');
  }
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
