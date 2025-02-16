import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Get all albums where user is mainowner or collaborator
    // Also check if album is in a time capsule
    const albumsResult = await pool.query(
      `WITH locked_albums AS (
        SELECT DISTINCT unnest(albums) as album_id
        FROM capsules
        WHERE unlock_time > NOW()
      )
      SELECT a.*, 
        CASE WHEN la.album_id IS NOT NULL THEN true ELSE false END as is_locked
      FROM albums a
      LEFT JOIN locked_albums la ON a.id = la.album_id
      WHERE a.mainowner = $1 
      OR (a.collab IS NOT NULL AND a.collab::text LIKE '%' || $1 || '%')
      ORDER BY a.id DESC`,
      [session.user.email]
    );

    console.log("Fetched albums:", albumsResult.rows);

    await pool.end();

    // Filter out locked albums from the response
    const unlockedAlbums = albumsResult.rows.filter(album => !album.is_locked);

    return NextResponse.json({ 
      albums: unlockedAlbums 
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch albums",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
