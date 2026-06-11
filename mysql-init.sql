-- 本地 MySQL 初始化脚本
-- 执行顺序：
-- 1) mysql -u root -p < mysql-init.sql
-- 2) 配置 .env.local 的 DATABASE_URL
-- 3) 执行 prisma migrate dev（推荐）或直接使用本脚本中的建表结构

CREATE DATABASE IF NOT EXISTS kaoyan_notes
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kaoyan_notes;

-- 可选：创建业务用户
-- CREATE USER IF NOT EXISTS 'kaoyan_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON kaoyan_notes.* TO 'kaoyan_user'@'localhost';
-- FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(191) NOT NULL,
  `username` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_username_key`(`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Subject` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Subject_name_key`(`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Tag` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Tag_name_key`(`name`),
  INDEX `Tag_name_idx`(`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Note` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `contentJson` JSON NOT NULL,
  `plainText` LONGTEXT NOT NULL,
  `isWrongQuestion` BOOLEAN NOT NULL DEFAULT false,
  `subjectId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Note_title_idx`(`title`),
  INDEX `Note_subjectId_idx`(`subjectId`),
  INDEX `Note_isWrongQuestion_idx`(`isWrongQuestion`),
  CONSTRAINT `Note_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ImageAsset` (
  `id` VARCHAR(191) NOT NULL,
  `path` VARCHAR(191) NOT NULL,
  `alt` VARCHAR(191) NULL,
  `mimeType` VARCHAR(191) NULL,
  `size` INTEGER NULL,
  `noteId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ImageAsset_path_key`(`path`),
  INDEX `ImageAsset_noteId_idx`(`noteId`),
  CONSTRAINT `ImageAsset_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `_NoteToTag` (
  `A` VARCHAR(191) NOT NULL,
  `B` VARCHAR(191) NOT NULL,
  UNIQUE INDEX `_NoteToTag_AB_unique`(`A`, `B`),
  INDEX `_NoteToTag_B_index`(`B`),
  CONSTRAINT `_NoteToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Note`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_NoteToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
