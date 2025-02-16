import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { images, albumName, description = '' } = await request.json();
    
    if (!albumName) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // First, verify the user exists
    const userExists = await pool.query(
      "SELECT email FROM users WHERE email = $1",
      [session.user.email]
    );

    if (userExists.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User not found. Please log in again.' 
      }, { status: 404 });
    }

    // Create albums table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS albums (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        images TEXT[] DEFAULT ARRAY[]::TEXT[],
        collab JSONB DEFAULT '[]'::jsonb,
        mainowner TEXT
      )
    `);

    // Generate a unique ID for the album
    const albumId = `alb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create album with the selected images
    const albumResult = await pool.query(
      "INSERT INTO albums (id, name, description, images, mainowner) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [albumId, albumName, description, images, session.user.email]
    );

    await pool.end();

    return NextResponse.json({ 
      success: true, 
      album: albumResult.rows[0],
      message: `Album "${albumName}" created with ${images.length} images`
    });
  } catch (error) {
    console.error('Error creating album:', error);
    let errorMessage = 'Failed to create album';
    let statusCode = 500;

    if (error instanceof Error) {
      // Handle specific database errors
      const pgError = error as any;
      if (pgError.code === '23503') { // Foreign key violation
        errorMessage = 'Unable to create album. Please ensure you are logged in with a valid account.';
        statusCode = 400;
      } else if (pgError.code === '23505') { // Unique violation
        errorMessage = 'An album with this ID already exists. Please try again.';
        statusCode = 409;
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: statusCode });
  }
}
