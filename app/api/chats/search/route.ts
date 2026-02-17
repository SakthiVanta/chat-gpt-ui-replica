import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    
    if (!session?.user?.id) {
      return NextResponse.json({ chats: [] });
    }

    if (!query) {
      return NextResponse.json({ chats: [] });
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            messages: {
              some: {
                content: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Search chats error:", error);
    return NextResponse.json(
      { error: "Failed to search chats" },
      { status: 500 }
    );
  }
}
