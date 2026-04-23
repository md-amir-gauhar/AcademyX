CREATE TYPE "public"."video_type" AS ENUM('HLS', 'YOUTUBE');--> statement-breakpoint
ALTER TABLE "contents" ADD COLUMN "video_type" "video_type";