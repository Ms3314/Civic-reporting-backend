-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable to make adminId nullable (if not already)
ALTER TABLE "Comment" ALTER COLUMN "adminId" DROP NOT NULL;

