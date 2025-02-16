import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const albumId = params.id;

  if (!albumId) {
    return NextResponse.json(
      { error: "Missing album ID in request" },
      { status: 400 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // First check if the album is in a time capsule
    const capsuleQuery = `
      SELECT c.* FROM capsules c 
      WHERE $1 = ANY(c.albums)
      AND c.unlock_time > NOW()`;
    const capsuleResult = await pool.query(capsuleQuery, [albumId]);

    if (capsuleResult.rows.length > 0) {
      const capsule = capsuleResult.rows[0];
      return NextResponse.json(
        { 
          error: "Album is locked in a time capsule", 
          capsule: {
            unlock_time: capsule.unlock_time,
            theme: capsule.theme
          }
        }, 
        { status: 403 }
      );
    }

    // If not in a time capsule, check if user has access to the album
    const albumQuery = `
      SELECT * FROM albums 
      WHERE id = $1 
      AND (mainowner = $2 OR $2 = ANY(SELECT jsonb_array_elements_text(collab)))`;
    const albumResult = await pool.query(albumQuery, [albumId, session.user.email]);

    if (albumResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Album not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(albumResult.rows[0]);
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const albumId = params.id;

  if (!albumId) {
    return NextResponse.json(
      { error: "Missing album ID in request" },
      { status: 400 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if the album is in a time capsule
    const capsuleQuery = `
      SELECT c.* FROM capsules c 
      WHERE $1 = ANY(c.albums)
      AND c.unlock_time > NOW()`;
    const capsuleResult = await pool.query(capsuleQuery, [albumId]);

    if (capsuleResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete album: it is locked in a time capsule" },
        { status: 403 }
      );
    }

    // Verify ownership before deleting
    const verifyQuery = `SELECT * FROM albums WHERE id = $1 AND mainowner = $2`;
    const verifyResult = await pool.query(verifyQuery, [albumId, session.user.email]);

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Album not found or you do not have permission to delete it" },
        { status: 403 }
      );
    }

    const deleteQuery = `DELETE FROM albums WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(deleteQuery, [albumId]);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const albumId = params.id;
  const data = await req.json();

  if (!albumId) {
    return NextResponse.json(
      { error: "Missing album ID in request" },
      { status: 400 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if the album is in a time capsule
    const capsuleQuery = `
      SELECT c.* FROM capsules c 
      WHERE $1 = ANY(c.albums)
      AND c.unlock_time > NOW()`;
    const capsuleResult = await pool.query(capsuleQuery, [albumId]);

    if (capsuleResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Cannot update album: it is locked in a time capsule" },
        { status: 403 }
      );
    }

    // Verify ownership before updating
    const verifyQuery = `SELECT * FROM albums WHERE id = $1 AND mainowner = $2`;
    const verifyResult = await pool.query(verifyQuery, [albumId, session.user.email]);

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Album not found or you do not have permission to update it" },
        { status: 403 }
      );
    }

    const updateQuery = `UPDATE albums SET name = $1, description = $2 WHERE id = $3 RETURNING *`;
    const { rows } = await pool.query(updateQuery, [
      data.name,
      data.description,
      albumId,
    ]);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
