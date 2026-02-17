import { ChatPage } from "@/components/chat/ChatPage";

export default async function ChatPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatPage initialChatId={id} />;
}
