import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { decryptPayload } from "@/lib/cookie-helpers";
import { checkPayload } from "@/lib/helpers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chat_id");
    const encryptedUserPayload = req.headers.get("x-encrypted-user-id");

    if (!encryptedUserPayload) {
      return NextResponse.json(
        { error: "Missing encrypted user payload" },
        { status: 400 },
      );
    }

    const payload = await decryptPayload(encryptedUserPayload);
    if (!checkPayload(payload)) {
      return NextResponse.json(
        { error: "Invalid user payload object" },
        { status: 401 },
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { error: "chat_id query parameter are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const collection = db.collection("messages");

    // Fetch messages: filter by user_id and chat_id, project only 'message', sort by message.id (sequential)
    const messagesCursor = await collection
      .find(
        { user_id: payload.id, chat_id: chatId },
        { projection: { message: 1 } }, // Only return the UIMessage object
      )
      .sort({ created_at: 1 }) // Sort by timestamp
      .toArray();

    // Extract the message objects into array
    const messages = messagesCursor.map((doc) => doc.message);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching messages" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chat_id");

  const encryptedUserPayload = req.headers.get("x-encrypted-user-id");
  if (!encryptedUserPayload) {
    return NextResponse.json(
      { error: "Missing encrypted user payload" },
      { status: 400 },
    );
  }

  const payload = await decryptPayload(encryptedUserPayload);
  if (!chatId) {
    return NextResponse.json(
      { error: "chat_id request parameter is required." },
      { status: 400 },
    );
  }

  const { message, created_at } = await req.json();
  if (!message) {
    return NextResponse.json(
      { error: "message is required in request body." },
      { status: 400 },
    );
  }
  if (!checkPayload(payload)) {
    return NextResponse.json(
      { error: "Invalid user payload." },
      { status: 401 },
    );
  }

  const db = await getDb();
  const collection = db.collection("messages");

  // Insert the new message into the database
  const result = await collection.insertOne({
    user_id: payload.id,
    chat_id: chatId,
    message,
    created_at: created_at,
    updated_at: created_at,
  });

  return NextResponse.json({ message: message, result });
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chat_id");
    const messageId = searchParams.get("message_id");
    const { message: update } = await req.json(); // Partial update (e.g., { parts: [...] })

    const encryptedUserPayload = req.headers.get("x-encrypted-user-id");
    if (!encryptedUserPayload) {
      return NextResponse.json(
        { error: "Missing user payload." },
        { status: 400 },
      );
    }

    const payload = await decryptPayload(encryptedUserPayload);
    if (!checkPayload(payload)) {
      return NextResponse.json(
        { error: "Invalid user payload." },
        { status: 401 },
      );
    }
    if (!chatId) {
      return NextResponse.json({ error: "Missing chat_id." }, { status: 400 });
    }
    if (!messageId) {
      return NextResponse.json(
        { error: "Missing message_id." },
        { status: 400 },
      );
    }
    if (!update) {
      return NextResponse.json(
        { error: "Missing update (partial message)." },
        { status: 400 },
      );
    }
    const userId = payload.id;

    const db = await getDb();
    const collection = db.collection("messages");

    // Find and update the specific message
    const result = await collection.findOneAndUpdate(
      { user_id: userId, chat_id: chatId, "message.id": messageId },
      {
        $set: {
          message: {
            ...update,
            id: messageId,
            updated_at: new Date(),
          },
        },
      }, // Merge partial, preserve id
      { returnDocument: "after", projection: { message: 1 } }, // Return updated doc
    );

    if (!result) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ updatedMessage: result.value.message });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { error: "Internal server error while updating message" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chat_id");
    const messageId = searchParams.get("message_id");

    if (!chatId || !messageId) {
      return NextResponse.json(
        {
          error: "chat_id and message_id query parameters are required",
        },
        { status: 400 },
      );
    }

    const encryptedUserPayload = req.headers.get("x-encrypted-user-id");
    if (!encryptedUserPayload) {
      return NextResponse.json(
        { error: "x-encrypted-user-id header is required" },
        { status: 400 },
      );
    }
    const payload = await decryptPayload(encryptedUserPayload);
    if (!checkPayload(payload)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 401 });
    }

    const userId = payload.id;

    const db = await getDb();
    const collection = db.collection("messages");

    // Delete the specific message
    const result = await collection.deleteOne({
      user_id: userId,
      chat_id: chatId,
      _id: new ObjectId(messageId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json(
      { error: "Internal server error while deleting message" },
      { status: 500 },
    );
  }
}
