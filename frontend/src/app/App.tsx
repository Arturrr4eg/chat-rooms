import { LoginForm } from "@/features/auth/ui/LoginForm.tsx";
import { useAppStore } from "@/app/stores/app.store";
import { ChatLayout } from "@/widgets/chat/ui/ChatLayout.tsx";

export default function App() {
  const accessToken = useAppStore((state) => state.accessToken);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_42%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.2),transparent_40%),hsl(var(--muted))] p-4 sm:p-6">
      {accessToken ? (
        <div className="animate-fade-up">
          <ChatLayout />
        </div>
      ) : (
        <div className="flex justify-center pt-8 sm:pt-12 animate-soft-pop">
          <LoginForm />
        </div>
      )}
    </div>
  );
}
