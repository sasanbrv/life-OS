/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Goal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Habit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HabitEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MyDayEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subtask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskGoal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_userId_fkey";

-- DropForeignKey
ALTER TABLE "Habit" DROP CONSTRAINT "Habit_userId_fkey";

-- DropForeignKey
ALTER TABLE "HabitEntry" DROP CONSTRAINT "HabitEntry_habitId_fkey";

-- DropForeignKey
ALTER TABLE "HabitEntry" DROP CONSTRAINT "HabitEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "MyDayEntry" DROP CONSTRAINT "MyDayEntry_taskId_fkey";

-- DropForeignKey
ALTER TABLE "MyDayEntry" DROP CONSTRAINT "MyDayEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subtask" DROP CONSTRAINT "Subtask_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskGoal" DROP CONSTRAINT "TaskGoal_goalId_fkey";

-- DropForeignKey
ALTER TABLE "TaskGoal" DROP CONSTRAINT "TaskGoal_taskId_fkey";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Goal";

-- DropTable
DROP TABLE "Habit";

-- DropTable
DROP TABLE "HabitEntry";

-- DropTable
DROP TABLE "MyDayEntry";

-- DropTable
DROP TABLE "Subtask";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "TaskGoal";

-- DropEnum
DROP TYPE "TaskPriority";

-- DropEnum
DROP TYPE "TaskStatus";
