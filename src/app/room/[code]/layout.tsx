import { RoomProvider } from "@/providers/RoomProvider";

interface RoomLayoutProps {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}

export default async function RoomLayout({ children, params }: RoomLayoutProps) {
  const { code } = await params;

  return <RoomProvider roomCode={code.toUpperCase()}>{children}</RoomProvider>;
}
