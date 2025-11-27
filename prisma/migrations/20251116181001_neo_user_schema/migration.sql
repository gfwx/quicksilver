/*
  Warnings:

  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "profileName" TEXT NOT NULL DEFAULT 'New Profile',
    "lastOpened" DATETIME,
    "profilePictureUrl" TEXT,
    "profileDescription" TEXT
);
INSERT INTO "new_User" ("createdAt", "id", "lastOpened", "profileDescription", "profilePictureUrl", "updatedAt") SELECT "createdAt", "id", "lastOpened", "profileDescription", "profilePictureUrl", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
