-- CreateTable
CREATE TABLE "Heart" (
    "id" TEXT NOT NULL,
    "captionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Heart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Heart_captionId_idx" ON "Heart"("captionId");

-- CreateIndex
CREATE UNIQUE INDEX "Heart_captionId_sessionId_key" ON "Heart"("captionId", "sessionId");

-- AddForeignKey
ALTER TABLE "Heart" ADD CONSTRAINT "Heart_captionId_fkey" FOREIGN KEY ("captionId") REFERENCES "Caption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
