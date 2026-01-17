-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_items" (
    "id" TEXT NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "podcast_id" TEXT,
    "episode_id" TEXT,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playlists_user_id_idx" ON "playlists"("user_id");

-- CreateIndex
CREATE INDEX "playlists_user_id_updated_at_idx" ON "playlists"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "playlist_items_playlist_id_position_idx" ON "playlist_items"("playlist_id", "position");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
