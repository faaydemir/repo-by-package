-- CreateTable
CREATE TABLE "Repo" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "url" TEXT,
    "htmlUrl" TEXT,
    "description" TEXT,
    "language" TEXT,
    "topics" TEXT,
    "defaultBranch" TEXT,
    "stargazersCount" INTEGER,
    "watchersCount" INTEGER,
    "forksCount" INTEGER,
    "openIssuesCount" INTEGER,
    "license" JSONB,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "pushedAt" TIMESTAMP(3),
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepoRependency" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "commitDate" TIMESTAMP(3) NOT NULL,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepoRependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,

    CONSTRAINT "Dependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DependencyMapping" (
    "id" TEXT NOT NULL,
    "repoRependencyId" TEXT NOT NULL,
    "dependencyId" TEXT NOT NULL,
    "versionOperator" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DependencyMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repo_githubId_key" ON "Repo"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Dependency_name_provider_key" ON "Dependency"("name", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "DependencyMapping_repoRependencyId_dependencyId_key" ON "DependencyMapping"("repoRependencyId", "dependencyId");

-- AddForeignKey
ALTER TABLE "RepoRependency" ADD CONSTRAINT "RepoRependency_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependencyMapping" ADD CONSTRAINT "DependencyMapping_repoRependencyId_fkey" FOREIGN KEY ("repoRependencyId") REFERENCES "RepoRependency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependencyMapping" ADD CONSTRAINT "DependencyMapping_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "Dependency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
