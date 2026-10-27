/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `Bid` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "previousHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Bid_hash_key" ON "Bid"("hash");
