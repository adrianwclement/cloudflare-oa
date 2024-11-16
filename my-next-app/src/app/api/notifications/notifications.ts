import { v4 as uuidv4 } from "uuid";

interface Notification {
  id?: string;
  type: string;
  content: {
    text: string;
  };
  read: boolean;
  timestamp?: number;
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: any;
}) {
  let notifications: Notification[];

  try {
    const data = await request.json();
    notifications = Array.isArray(data) ? data : [data];

    notifications = notifications.map((notification) => {
      if (!notification.type || !notification.content?.text) {
        throw new Error("Invalid Notification format");
      }
      return {
        ...notification,
        id: uuidv4(),
        timestamp: Date.now(),
      };
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request format" }), {
      status: 400,
    });
  }

  const existingData =
    (await env.NOTIFICATIONS_KV.get("notifications", { type: "json" })) || [];
  const updatedData = [...existingData, ...notifications];

  await env.NOTIFICATIONS_KV.put("notifications", JSON.stringify(updatedData));

  return new Response(JSON.stringify(notifications), {
    headers: { "Content-Type": "application/json" },
    status: 201,
  });
}
