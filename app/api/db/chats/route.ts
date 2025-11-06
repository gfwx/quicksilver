import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
export const runtime = "nodejs";
import { ObjectId } from "mongodb";
import { decryptPayload } from "@/lib/cookie-helpers";
import { checkPayload } from "@/lib/helpers";

export async function GET(req: NextRequest) {
  const encryptedUserPayload = req.headers.get("x-encrypted-user-id");

  if (!encryptedUserPayload) {
    return NextResponse.json(
      { error: "Missing encrypted user payload" },
      { status: 400 },
    );
  }

  const payload = await decryptPayload(encryptedUserPayload);

  if (!checkPayload(payload)) {
    return NextResponse.json({ error: "Payload expired" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const collection = db.collection("chats");

    const chatsCursor = await collection
      .find({ user_id: payload.id })
      .sort({ updatedAt: -1 })
      .toArray();

    const chats = chatsCursor.map((chat) => ({
      id: chat._id.toString(),
      title: chat.title,
      updated: chat.updatedAt,
    }));

    return NextResponse.json({ chats });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user id!" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const collection = db.collection("chats");

    const chat = await collection.insertOne({
      user_id: userId,
      title: "New Chat",
      messages: [],
    });

    return NextResponse.json({ id: chat.insertedId.toString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const chatId = searchParams.get("chat_id");
    const { title } = await req.json(); // Optional partial update

    if (!userId || !chatId) {
      return NextResponse.json(
        { error: "user_id and chat_id query parameters are required" },
        { status: 400 },
      );
    }

    if (!title) {
      // No update fields
      return NextResponse.json(
        { error: "At least one update field (e.g., title) is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const collection = db.collection("chats");

    // Update chat (set updatedAt always)
    const result = await collection.findOneAndUpdate(
      { user_id: userId, _id: new ObjectId(chatId) },
      {
        $set: {
          updatedAt: new Date(),
          title: title,
        },
      },
      {
        returnDocument: "after",
        projection: { _id: 1, title: 1, updatedAt: 1 },
      },
    );

    if (!result) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ updatedChat: result.value });
  } catch (error) {
    console.error("Failed to update chat:", error);
    return NextResponse.json(
      { error: "Internal server error while updating chat" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const chatId = searchParams.get("chat_id");

    if (!userId || !chatId) {
      return NextResponse.json(
        { error: "user_id and chat_id query parameters are required" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Delete chat
    const chatCollection = db.collection("chats");
    const chatResult = await chatCollection.deleteOne({
      user_id: userId,
      _id: new ObjectId(chatId),
    });

    if (chatResult.deletedCount === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Cascade: Delete associated messages
    const messagesCollection = db.collection("messages");
    const messagesResult = await messagesCollection.deleteMany({
      user_id: userId,
      chat_id: chatId,
    });

    return NextResponse.json({
      deleted: true,
      deletedChat: 1,
      deletedMessages: messagesResult.deletedCount,
    });
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return NextResponse.json(
      { error: "Internal server error while deleting chat" },
      { status: 500 },
    );
  }
}
