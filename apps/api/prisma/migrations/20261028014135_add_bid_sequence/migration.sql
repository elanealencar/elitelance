/*
  Warnings:

  - A unique constraint covering the columns `[lotId,sequence]` on the table `Bid` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "sequence" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Bid_lotId_sequence_key" ON "Bid"("lotId", "sequence");
