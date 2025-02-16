import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

export async function POST(request: Request) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { capsuleId, recipient } = await request.json();

    if (!capsuleId || !recipient) {
      return NextResponse.json(
        { error: "Capsule ID and recipient email are required" },
        { status: 400 },
      );
    }

    // Check if capsule exists
    const capsuleResult = await pool.query(
      `SELECT * FROM capsules WHERE id = $1`,
      [capsuleId],
    );

    if (capsuleResult.rowCount === 0) {
      return NextResponse.json({ error: "Capsule not found" }, { status: 404 });
    }

    const albumId = capsuleResult.rows[0]?.albums?.[0];
    if (!albumId) {
      return NextResponse.json(
        { error: "Capsule does not contain any album" },
        { status: 400 },
      );
    }

    // Verify ownership of the album
    const albumResult = await pool.query(
      `SELECT * FROM albums WHERE id = $1 AND mainowner = $2`,
      [albumId, session.user.email],
    );

    if (albumResult.rowCount === 0) {
      return NextResponse.json(
        { error: "You do not own the specified album" },
        { status: 403 },
      );
    }

    // Transfer album ownership
    await pool.query(`UPDATE albums SET mainowner = $1 WHERE id = $2`, [
      recipient,
      albumId,
    ]);

    console.log(
      `Album ownership transferred from ${session.user.email} to ${recipient}`,
    );

    // Remove all collaborators
    await pool.query(`UPDATE albums SET collab = '[]'::jsonb WHERE id = $1`, [
      albumId,
    ]);

    console.log("All collaborators removed");

    return NextResponse.json({
      success: true,
      message: "Album ownership transferred successfully",
    });
  } catch (error) {
    console.error("Error transferring album ownership:", error);
    return NextResponse.json(
      {
        error: "Failed to transfer album ownership",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    // Ensure pool is closed
    await pool.end();
  }
}
