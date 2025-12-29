import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const collection = db.collection("chats");

    const chats = await collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    const formattedChats = chats.map((chat) => ({
      id: chat._id.toString(),
      title: chat.title,
      userId: chat.user_id,
      projectId: chat.project_id,
      updatedAt: chat.updatedAt,
    }));

    return NextResponse.json({
      count: formattedChats.length,
      chats: formattedChats,
    });
  } catch (error) {
    console.error("[GET /api/debug/chats] Error fetching all chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
