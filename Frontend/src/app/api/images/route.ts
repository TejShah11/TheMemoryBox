import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { public_id, public_url, owner } = await req.json();

  if (!public_id || !public_url || !owner) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const pool = new Pool({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
  });

  try {
    const query = `
      INSERT INTO images (public_id, public_url, owner)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const userquery = `SELECT ID FROM users WHERE email = $1`;
    const userValues = owner;
    const user = await pool.query(userquery, [userValues]);
    const values = [public_id, public_url, user.rows[0]?.id || ""];
    const { rows } = await pool.query(query, values);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error inserting image record:", error);
    return NextResponse.json(
      { error: "Failed to save image record" },
      { status: 500 },
    );
  } finally {
    await pool.end();
  }
}
