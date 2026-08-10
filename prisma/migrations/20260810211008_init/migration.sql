-- CreateTable
CREATE TABLE "Comic" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "artistName" TEXT,
    "releaseAt" TIMESTAMP(3) NOT NULL,
    "freezeAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicOpen" (
    "id" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComicOpen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caption" (
    "id" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "city" TEXT,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withinWindow" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Caption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matchup" (
    "id" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "winnerCaptionId" TEXT NOT NULL,
    "loserCaptionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Matchup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "captionId" TEXT NOT NULL,
    "winCount" INTEGER NOT NULL,
    "matchCount" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comic_releaseAt_idx" ON "Comic"("releaseAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComicOpen_comicId_sessionId_key" ON "ComicOpen"("comicId", "sessionId");

-- CreateIndex
CREATE INDEX "Caption_comicId_idx" ON "Caption"("comicId");

-- CreateIndex
CREATE INDEX "Caption_comicId_normalizedText_idx" ON "Caption"("comicId", "normalizedText");

-- CreateIndex
CREATE INDEX "Caption_comicId_submittedAt_idx" ON "Caption"("comicId", "submittedAt");

-- CreateIndex
CREATE INDEX "Matchup_comicId_idx" ON "Matchup"("comicId");

-- CreateIndex
CREATE INDEX "Matchup_winnerCaptionId_idx" ON "Matchup"("winnerCaptionId");

-- CreateIndex
CREATE INDEX "Matchup_loserCaptionId_idx" ON "Matchup"("loserCaptionId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_comicId_rank_idx" ON "LeaderboardSnapshot"("comicId", "rank");

-- AddForeignKey
ALTER TABLE "Caption" ADD CONSTRAINT "Caption_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_winnerCaptionId_fkey" FOREIGN KEY ("winnerCaptionId") REFERENCES "Caption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_loserCaptionId_fkey" FOREIGN KEY ("loserCaptionId") REFERENCES "Caption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_captionId_fkey" FOREIGN KEY ("captionId") REFERENCES "Caption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
