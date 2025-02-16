import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

export async function POST(req: Request) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { albumId, collaboratorEmail } = await req.json();

    // Validate input
    if (!albumId || !collaboratorEmail) {
      return NextResponse.json(
        {
          error: "Invalid input. Album ID and collaborator email are required.",
        },
        { status: 400 },
      );
    }

    // Verify that the current user owns the album or has permission to share it
    const ownershipResult = await pool.query(
      `
      SELECT 1
      FROM albums
      WHERE id = $1 AND (mainowner = $2
      OR EXISTS (
        SELECT 1
        FROM json_array_elements(collab) AS c
        WHERE c->>'userid' = $2 AND (c->>'permission' = 'editor')
      ))
      `,
      [albumId, session.user.email],
    );

    if (ownershipResult.rowCount === 0) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to modify this album's collaborators.",
        },
        { status: 403 },
      );
    }

    // Fetch current collaborators
    const currentAlbumResult = await pool.query(
      `SELECT collab FROM albums WHERE id = $1`,
      [albumId],
    );

    const currentCollab = currentAlbumResult.rows[0].collab || [];

    // Remove the specified collaborator
    const updatedCollab = currentCollab.filter(
      (existingCollab: { userid: string }) =>
        existingCollab.userid !== collaboratorEmail,
    );

    // Check if collaborator was actually removed
    if (updatedCollab.length === currentCollab.length) {
      return NextResponse.json(
        { error: "Collaborator not found." },
        { status: 404 },
      );
    }

    await pool.query(
      `
      UPDATE albums
      SET collab = $1::jsonb
      WHERE id = $2
      `,
      [JSON.stringify(updatedCollab), albumId],
    );

    return NextResponse.json({
      message: "Collaborator removed successfully!",
      removedCollaborator: collaboratorEmail,
    });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json(
      {
        error: "Failed to remove collaborator",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await pool.end();
  }
}
