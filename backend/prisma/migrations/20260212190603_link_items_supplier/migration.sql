-- AlterTable
ALTER TABLE "stock_items" ADD COLUMN     "supplier_id" TEXT;

-- CreateIndex
CREATE INDEX "stock_items_supplier_id_idx" ON "stock_items"("supplier_id");

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
