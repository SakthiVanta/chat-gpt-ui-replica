import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateResponse, generateResponseWithWebSearch, generateChatTitle } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { message, chatId, useWebSearch } = body;

    let chat;
    let isNewChat = false;

    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { messages: true },
      });
    }

    if (!chat) {
      isNewChat = true;
      // Create with a temporary title; AI will generate a better one
      chat = await prisma.chat.create({
        data: {
          title: "New chat",
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

    // Generate AI title in the background for new chats
    let generatedTitle = "";
    if (isNewChat) {
      generateChatTitle(message).then(async (title) => {
        generatedTitle = title;
        try {
          await prisma.chat.update({
            where: { id: chat.id },
            data: { title },
          });
        } catch (err) {
          console.error("Failed to update chat title:", err);
        }
      });
    }

    const history = chat.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const encoder = new TextEncoder();
    const chatRef = chat;
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
              chatId: chatRef.id,
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
        "X-Is-New-Chat": isNewChat ? "true" : "false",
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
