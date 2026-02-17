import { ChatPage } from "@/components/chat/ChatPage";

export default function ChatPageRoute({ params }: { params: { id: string } }) {
  return <ChatPage initialChatId={params.id} />;
}
