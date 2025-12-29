import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const chatsCollection = db.collection("chats");
    const messagesCollection = db.collection("messages");

    // Find all chats for this project
    const chats = await chatsCollection
      .find({ project_id: projectId })
      .toArray();

    const chatIds = chats.map((chat) => chat._id.toString());

    // Find all messages for these chats
    const messages = await messagesCollection
      .find({ chat_id: { $in: chatIds } })
      .sort({ created_at: 1 })
      .toArray();

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      chatId: msg.chat_id,
      userId: msg.user_id,
      message: msg.message,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
    }));

    return NextResponse.json({
      projectId,
      chatCount: chats.length,
      messageCount: formattedMessages.length,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error(
      "[GET /api/debug/messages] Error fetching messages:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
