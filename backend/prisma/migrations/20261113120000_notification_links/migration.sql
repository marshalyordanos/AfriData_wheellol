-- In-app notification links
ALTER TABLE "public"."Notification" ADD COLUMN "link" TEXT;
ALTER TABLE "public"."Notification" ADD COLUMN "data" JSONB;
ALTER TABLE "public"."Notification" ADD COLUMN "audience" TEXT;
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");
