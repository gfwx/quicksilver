-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_userid_fkey";

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "userid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
