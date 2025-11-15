import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const userId = params.get("user");
  const projectId = params.get("project");

  if (!userId || !projectId) {
    return NextResponse.json(
      { error: "Missing encrypted user payload or project id" },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("chats");

    const chatsCursor = await collection
      .find({ user_id: userId, project_id: projectId })
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
  const { userId, projectId } = await req.json();

  if (!projectId) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Missing encrypted user payload" },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("chats");

    const chat = await collection.insertOne({
      user_id: userId,
      project_id: projectId,
      title: "New Chat",
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
    const { title, userId, projectId, chatId } = await req.json();

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: "Missing encrypted user ID or project ID" },
        { status: 400 },
      );
    }

    if (!chatId) {
      return NextResponse.json({ error: "Missing Chat ID." }, { status: 400 });
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
    const { userId, projectId } = await req.json();

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: "Missing encrypted user payload or project id" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chat_id");

    if (!chatId) {
      return NextResponse.json(
        { error: "chat_id query parameter is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const session = db.client.startSession();

    const txResult = await session
      .withTransaction(async () => {
        // Delete chat
        const chatCollection = db.collection("chats");
        const chatResult = await chatCollection.deleteOne({
          user_id: userId,
          _id: new ObjectId(chatId),
        });

        if (chatResult.deletedCount === 0) {
          return Promise.reject({ error: "Chat not found!" });
        }

        // Cascade: Delete associated messages
        const messagesCollection = db.collection("messages");
        const messagesResult = await messagesCollection.deleteMany({
          user_id: userId,
          chat_id: chatId,
        });

        return Promise.resolve(messagesResult);
      })
      .catch((error) => {
        console.error("Transaction failed: ", error);
        return { error: `An error occured with deleting the chat: ${error}` };
      });

    if ("error" in txResult) {
      return NextResponse.json(
        { error: `Internal error: ${txResult.error}` },
        { status: 401 },
      );
    } else {
      return NextResponse.json({
        acknowledged: txResult.acknowledged,
        deleted: txResult.deletedCount,
        id: chatId,
      });
    }
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return NextResponse.json(
      { error: "Internal server error while deleting chat" },
      { status: 500 },
    );
  }
}
