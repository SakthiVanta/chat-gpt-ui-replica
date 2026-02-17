import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateResponse, generateResponseWithWebSearch } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { message, chatId, useWebSearch } = body;

    let chat;

    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { messages: true },
      });
    }

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          userId: session?.user?.id,
          messages: {
            create: {
              role: "user",
              content: message,
            },
          },
        },
        include: { messages: true },
      });
    } else {
      await prisma.message.create({
        data: {
          chatId: chat.id,
          role: "user",
          content: message,
        },
      });
    }

    const history = chat.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let result;
          if (useWebSearch) {
            result = await generateResponseWithWebSearch(message);
          } else {
            result = await generateResponse(message, history);
          }

          let fullResponse = "";

          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }

          await prisma.message.create({
            data: {
              chatId: chat.id,
              role: "assistant",
              content: fullResponse,
            },
          });

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-Id": chat.id,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
