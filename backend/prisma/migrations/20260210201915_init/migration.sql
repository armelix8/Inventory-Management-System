-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_ins" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "received_quarter" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "specification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_outs" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "requested_date" TIMESTAMP(3) NOT NULL,
    "requested_quarter" TEXT NOT NULL,
    "requesting_person" TEXT NOT NULL,
    "request_reason" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_outs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_itemName_key" ON "stock_items"("itemName");

-- CreateIndex
CREATE INDEX "stock_ins_item_id_idx" ON "stock_ins"("item_id");

-- CreateIndex
CREATE INDEX "stock_ins_received_date_idx" ON "stock_ins"("received_date");

-- CreateIndex
CREATE INDEX "stock_outs_item_id_idx" ON "stock_outs"("item_id");

-- CreateIndex
CREATE INDEX "stock_outs_requested_date_idx" ON "stock_outs"("requested_date");

-- AddForeignKey
ALTER TABLE "stock_ins" ADD CONSTRAINT "stock_ins_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_outs" ADD CONSTRAINT "stock_outs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
