import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

interface Notification {
  id?: string;
  type: string;
  content: {
    text: string;
  };
  read: boolean;
  timestamp?: number;
}

export const runtime = "edge";

// Function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
};

export async function POST(request: NextRequest) {
  // console.log("Here Pre-POST");

  const notificationsKV =
    getRequestContext().env.__NEXT_ON_PAGES__KV_SUSPENSE_CACHE;
  let notifications: Notification[];

  try {
    const data = await request.json();
    notifications = Array.isArray(data) ? data : [data];

    notifications = notifications.map((notification) => {
      if (!notification.type || !notification.content?.text) {
        throw new Error("Invalid Notification format");
      }
      return {
        id: uuidv4(),
        ...notification,
        timestamp: Date.now(),
      };
    });
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    );
  }

  const existingData = ((await notificationsKV.get("notifications", {
    type: "json",
  })) || []) as Notification[];
  const updatedData = [...existingData, ...notifications];

  await notificationsKV.put("notifications", JSON.stringify(updatedData));

  // console.log("Here POST");

  return addCorsHeaders(NextResponse.json(notifications, { status: 201 }));
}

export async function GET() {
  const notificationsKV =
    getRequestContext().env.__NEXT_ON_PAGES__KV_SUSPENSE_CACHE;
  const notifications =
    (await notificationsKV.get("notifications", { type: "json" })) || [];

  // console.log("Here GET");

  return addCorsHeaders(NextResponse.json(notifications));
}

export async function DELETE() {
  const notificationsKV =
    getRequestContext().env.__NEXT_ON_PAGES__KV_SUSPENSE_CACHE;

  // Clear all notifications
  await notificationsKV.put("notifications", JSON.stringify([]));

  // console.log("Here DELETE");

  return addCorsHeaders(
    NextResponse.json({ message: "Notifications deleted successfully!" })
  );
}
