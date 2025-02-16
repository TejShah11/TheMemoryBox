import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      albumId,
      openAt,
      theme = "classic",
      reminders = false,
      reminderfreq = "never",
      passwordtoggle = false,
      password = null,
    } = await request.json();

    if (!albumId || !openAt || !theme) {
      return NextResponse.json(
        { error: "Album ID, opening time, and theme are required" },
        { status: 400 },
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Store the full album ID as a text array
    const result = await pool.query(
      `INSERT INTO capsules (albums, unlock_time, theme, passwordtoggle, reminders, reminderfreq, password) 
       VALUES (ARRAY[$1]::text[], $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        albumId,
        openAt,
        theme,
        passwordtoggle,
        reminders,
        reminderfreq,
        password,
      ],
    );

    await pool.end();

    return NextResponse.json({
      success: true,
      capsule: result.rows[0],
      message: "Capsule created successfully",
    });
  } catch (error) {
    console.error("Error creating capsule:", error);
    return NextResponse.json(
      {
        error: "Failed to create capsule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Get all capsules for the user, using direct comparison with text array
    const result = await pool.query(
      `SELECT c.*, a.name as album_name, a.images 
       FROM capsules c
       JOIN albums a ON a.id = ANY(c.albums)
       WHERE a.mainowner = $1 OR EXISTS (
        SELECT 1
        FROM json_array_elements(a.collab) AS col
        WHERE col->>'userid' = $1 AND (col->>'permission' = 'editor' OR col->>'permission' = 'viewer')
        )
       ORDER BY c.unlock_time ASC`,
      [session.user.email],
    );

    await pool.end();

    return NextResponse.json({
      capsules: result.rows,
    });
  } catch (error) {
    console.error("Error fetching capsules:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch capsules",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
