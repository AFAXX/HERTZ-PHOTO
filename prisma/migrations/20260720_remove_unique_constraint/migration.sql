-- DropUniqueConstraint: Remove unique constraint on [contractId, requirementId] to allow multiple photos per category
ALTER TABLE "PhotoSubmission" DROP CONSTRAINT IF EXISTS "PhotoSubmission_contractId_requirementId_key";
