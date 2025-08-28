-- CreateTable
CREATE TABLE "User" (
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "File" (
    "filename" TEXT NOT NULL DEFAULT '',
    "encoding" TEXT NOT NULL,
    "originalname" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "userid" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("filename")
);

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
