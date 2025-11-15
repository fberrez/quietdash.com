-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- Add dashboardId column to widget_configs (nullable at first)
ALTER TABLE "widget_configs" ADD COLUMN "dashboardId" TEXT;

-- Create a default dashboard for each existing user
INSERT INTO "dashboards" (id, "userId", name, "isActive", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    u.id,
    'Default Dashboard',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u;

-- Update all existing widget_configs to reference their user's default dashboard
UPDATE "widget_configs" wc
SET "dashboardId" = d.id
FROM "dashboards" d
INNER JOIN "users" u ON d."userId" = u.id
WHERE wc."userId" = u.id AND d.name = 'Default Dashboard';

-- Make dashboardId NOT NULL
ALTER TABLE "widget_configs" ALTER COLUMN "dashboardId" SET NOT NULL;

-- Drop old unique index
DROP INDEX "widget_configs_userId_type_key";

-- Add new unique constraint
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_dashboardId_type_key" UNIQUE ("dashboardId", "type");

-- Drop the old userId column and its foreign key
ALTER TABLE widget_configs DROP CONSTRAINT "widget_configs_userId_fkey";
ALTER TABLE widget_configs DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
