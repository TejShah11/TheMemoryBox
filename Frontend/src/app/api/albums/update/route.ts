import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { albumId, images } = await request.json();

    if (!albumId) {
      return NextResponse.json(
        { error: "Album ID is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // First check if the user has permission to update this album
    const albumCheck = await pool.query(
      "SELECT mainowner, images FROM albums WHERE id = $1",
      [albumId],
    );

    if (albumCheck.rows.length === 0) {
      await pool.end();
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const album = albumCheck.rows[0];
    // if (album.mainowner !== session.user.email) {
    //   await pool.end();
    //   return NextResponse.json({ error: 'Not authorized to update this album' }, { status: 403 });
    // }

    // Combine existing images with new ones, removing duplicates
    const updatedImages = [...new Set([...album.images, ...images])];

    // Update the album with the new images
    const result = await pool.query(
      "UPDATE albums SET images = $1 WHERE id = $2 RETURNING *",
      [updatedImages, albumId],
    );

    await pool.end();

    return NextResponse.json({
      success: true,
      album: result.rows[0],
      message: `Added ${images.length} images to album`,
    });
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json(
      {
        error: "Failed to update album",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
