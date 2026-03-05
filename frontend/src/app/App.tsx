import { LoginForm } from "@/features/auth/ui/LoginForm.tsx";
import { useAppStore } from "@/app/stores/app.store";
import { ChatLayout } from "@/widgets/chat/ui/ChatLayout.tsx";

export default function App() {
  const accessToken = useAppStore((state) => state.accessToken);
  // const accessToken = true
  return (
    <div className="min-h-screen bg-muted p-6">
      {accessToken ? <ChatLayout /> : <div className="flex justify-center"><LoginForm /></div>}
    </div>
  );
}