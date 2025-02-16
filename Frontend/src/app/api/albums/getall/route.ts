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

    const albumsResult = await pool.query(
      `
      SELECT * FROM albums 
      WHERE mainowner = $1
      OR EXISTS (
        SELECT 1
        FROM json_array_elements(collab) AS c
        WHERE c->>'userid' = $1 AND (c->>'permission' = 'editor' OR c->>'permission' = 'viewer')
      )
      ORDER BY id DESC
      `,
      [session.user.email],
    );

    console.log("Fetched albums:", albumsResult.rows);

    await pool.end();

    return NextResponse.json({
      albums: albumsResult.rows,
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
