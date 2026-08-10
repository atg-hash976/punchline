-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "captionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_captionId_idx" ON "Report"("captionId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_captionId_sessionId_key" ON "Report"("captionId", "sessionId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_captionId_fkey" FOREIGN KEY ("captionId") REFERENCES "Caption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
