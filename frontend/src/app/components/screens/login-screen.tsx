import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Factory, Lock, User } from "lucide-react";
import { useAuth } from "@/app/contexts/auth-context";
import { ApiError } from "@/app/api/http";
import { toast } from "sonner";

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Nhập username và mật khẩu.");
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
      toast.success("Đăng nhập thành công");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không đăng nhập được. Kiểm tra API và migration mes_users.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] p-4 relative">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-[#1e3a8a] rounded-full flex items-center justify-center mb-2">
            <Factory className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">CADIVI Production System</CardTitle>
          <p className="text-sm text-muted-foreground">Đăng nhập MES — bcrypt + JWT (PostgreSQL)</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="admin"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1e3a8a] hover:bg-[#1e40af]"
              disabled={submitting}
            >
              {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Lần đầu: chạy <code className="text-[11px]">npm run db:migrate-006</code> và{" "}
            <code className="text-[11px]">npm run seed:mes-admin</code> trong backend.
          </p>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 text-center text-white text-xs w-full px-4">
        © 2026 CADIVI · MES login (mes-login-account-auth)
      </div>
    </div>
  );
}
