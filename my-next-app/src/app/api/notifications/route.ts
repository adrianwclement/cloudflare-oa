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

export async function POST(request: NextRequest) {
  const notificationsKV = getRequestContext().env.NOTIFICATIONS_KV;
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
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const existingData = ((await notificationsKV.get("notifications", {
    type: "json",
  })) || []) as Notification[];
  const updatedData = [...existingData, ...notifications];

  await notificationsKV.put("notifications", JSON.stringify(updatedData));

  return NextResponse.json(notifications, { status: 201 });
}

export async function GET() {
  const notificationsKV = getRequestContext().env.NOTIFICATIONS_KV;
  const notifications =
    (await notificationsKV.get("notifications", { type: "json" })) || [];

  return NextResponse.json(notifications);
}

export async function DELETE() {
  const notificationsKV = getRequestContext().env.NOTIFICATIONS_KV;

  // Clear all notifications
  await notificationsKV.put("notifications", JSON.stringify([]));

  return NextResponse.json({ message: "Notifications deleted successfully!" });
}
