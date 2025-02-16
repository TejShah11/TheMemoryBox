import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";
import { Resend } from "resend";
import { AlbumAccessEmail } from "@/../emails/index"; // Import the email component

export async function POST(req: Request) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { albumId, collaborator } = await req.json();

    // Validate input
    if (!albumId || !collaborator || !collaborator.userid) {
      return NextResponse.json(
        { error: "Invalid input. Album ID and collaborator are required." },
        { status: 400 },
      );
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collaborator.userid)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    // Verify that the current user owns the album or has permission to share it
    const ownershipResult = await pool.query(
      `
      SELECT mainowner, name
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
        { error: "You don't have permission to share this album." },
        { status: 403 },
      );
    }

    // Extract album details
    const { mainowner: albumOwner, name: albumName } = ownershipResult.rows[0];

    // Fetch current collaborators
    const currentAlbumResult = await pool.query(
      `SELECT collab FROM albums WHERE id = $1`,
      [albumId],
    );

    const currentCollab = currentAlbumResult.rows[0]?.collab || [];

    const existingCollabIndex = currentCollab.findIndex(
      (existingCollab: { userid: string }) =>
        existingCollab.userid === collaborator.userid,
    );

    if (existingCollabIndex !== -1) {
      const existingCollab = currentCollab[existingCollabIndex];
      // If existing collaborator is a viewer and request is to make them an editor
      if (
        existingCollab.permission === "viewer" &&
        collaborator.permission === "editor"
      ) {
        currentCollab[existingCollabIndex].permission = "editor";

        await pool.query(
          `
        UPDATE albums
        SET collab = $1
        WHERE id = $2
        `,
          [JSON.stringify(currentCollab), albumId],
        );

        // Send email about permission upgrade
        const mail = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: collaborator.userid,
          subject: `Album Access Updated: ${albumName}`,
          react: AlbumAccessEmail({
            senderEmail: albumOwner,
            receiverEmail: collaborator.userid,
            permissionGranter: albumOwner,
            albumLink: `localhost:3000/albums/${albumId}`,
            albumName: albumName,
            permissionLevel: PermissionLevel.EDIT,
          }),
        });

        console.log("Email sent:", mail);

        return NextResponse.json({
          message: "Collaborator permission upgraded to editor!",
          collaborator: {
            userid: collaborator.userid,
            permission: "editor",
          },
        });
      }

      return NextResponse.json(
        {
          error:
            "Collaborator already exists with the same or higher permission.",
        },
        { status: 400 },
      );
    }

    // Add new collaborator
    const updatedCollab = [
      ...currentCollab,
      {
        userid: collaborator.userid,
        permission: collaborator.permission || "viewer",
      },
    ];

    await pool.query(
      `
      UPDATE albums
      SET collab = $1
      WHERE id = $2
      `,
      [JSON.stringify(updatedCollab), albumId],
    );

    // Send welcome email to new collaborator
    const mail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: collaborator.userid,
      subject: `You've been added to album: ${albumName}`,
      react: AlbumAccessEmail({
        senderEmail: albumOwner,
        receiverEmail: collaborator.userid,
        permissionGranter: albumOwner,
        albumLink: `localhost:3000/albums/${albumId}`,
        albumName: albumName,
        permissionLevel:
          collaborator.permission === "editor"
            ? PermissionLevel.EDIT
            : PermissionLevel.VIEW,
      }),
    });

    console.log("Email sent:", mail);

    return NextResponse.json({
      message: "Collaborator added successfully!",
      collaborator: {
        userid: collaborator.userid,
        permission: collaborator.permission || "viewer",
      },
    });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json(
      {
        error: "Failed to add collaborator",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await pool.end();
  }
}

// Enum for permission levels (make sure to export this)
export enum PermissionLevel {
  VIEW = "View",
  EDIT = "Edit",
  ADMIN = "Admin",
}
