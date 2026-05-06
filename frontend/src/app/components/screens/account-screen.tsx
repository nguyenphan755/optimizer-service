import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { ArrowLeft, LogOut, Shield, User } from "lucide-react";
import { useAuth } from "@/app/contexts/auth-context";
import { hasMesAdminLikeAccess, isHeadOfficeMesUser } from "@/app/lib/mes-plant-nav";
import { apiJson, ApiError } from "@/app/api/http";
import type { LockedMesUser, LockedMesUsersResponse } from "@/app/api/types";
import { toast } from "sonner";

interface AccountScreenProps {
  onBack: () => void;
}

export function AccountScreen({ onBack }: AccountScreenProps) {
  const { user, logout, refreshMe } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingLockedUsers, setLoadingLockedUsers] = useState(false);
  const [lockedUsers, setLockedUsers] = useState<LockedMesUser[]>([]);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<LockedMesUser | null>(null);
  const [adminUnlockPassword, setAdminUnlockPassword] = useState("");
  const [creatingOperator, setCreatingOperator] = useState(false);
  const [operatorUsername, setOperatorUsername] = useState("");
  const [operatorPassword, setOperatorPassword] = useState("");
  const [operatorDisplayName, setOperatorDisplayName] = useState("");
  const [operatorPlantCode, setOperatorPlantCode] = useState("");

  const canManageLocks = hasMesAdminLikeAccess(user ?? null);
  const lockedCount = useMemo(
    () => lockedUsers.filter((u) => !!u.locked_until).length,
    [lockedUsers]
  );

  const loadLockedUsers = async () => {
    if (!canManageLocks) return;
    setLoadingLockedUsers(true);
    try {
      const res = await apiJson<LockedMesUsersResponse>("/api/v1/users/locked");
      setLockedUsers(res.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không tải được danh sách tài khoản bị khóa";
      toast.error(msg);
    } finally {
      setLoadingLockedUsers(false);
    }
  };

  useEffect(() => {
    void loadLockedUsers();
  }, [canManageLocks]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới tối thiểu 8 ký tự.");
      return;
    }
    setSaving(true);
    try {
      await apiJson<{ ok: boolean }>("/api/v1/auth/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      toast.success("Đã đổi mật khẩu");
      setCurrentPassword("");
      setNewPassword("");
      await refreshMe();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openUnlockDialog = (target: LockedMesUser) => {
    setUnlockTarget(target);
    setAdminUnlockPassword("");
    setUnlockDialogOpen(true);
  };

  const handleUnlockUser = async () => {
    if (!unlockTarget) return;
    if (!adminUnlockPassword.trim()) {
      toast.error("Nhập mật khẩu xác thực admin.");
      return;
    }
    setUnlocking(true);
    try {
      await apiJson<{ ok: boolean }>(`/api/v1/users/${unlockTarget.id}/unlock`, {
        method: "POST",
        body: JSON.stringify({ admin_password: adminUnlockPassword }),
      });
      toast.success(`Đã mở khóa user ${unlockTarget.username}`);
      setUnlockDialogOpen(false);
      setUnlockTarget(null);
      setAdminUnlockPassword("");
      await loadLockedUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Mở khóa thất bại";
      toast.error(msg);
    } finally {
      setUnlocking(false);
    }
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageLocks) return;
    const username = operatorUsername.trim().toLowerCase();
    if (!username) {
      toast.error("Nhập username cho operator.");
      return;
    }
    if (operatorPassword.length < 8) {
      toast.error("Mật khẩu operator tối thiểu 8 ký tự.");
      return;
    }
    setCreatingOperator(true);
    try {
      await apiJson<{ user: { id: number; username: string } }>("/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username,
          password: operatorPassword,
          role: "user",
          display_name: operatorDisplayName.trim(),
          plant_code: operatorPlantCode.trim(),
        }),
      });
      toast.success(`Đã tạo tài khoản operator: ${username}`);
      setOperatorUsername("");
      setOperatorPassword("");
      setOperatorDisplayName("");
      setOperatorPlantCode("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Tạo tài khoản operator thất bại";
      toast.error(msg);
    } finally {
      setCreatingOperator(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900 sm:min-h-[52px] sm:px-6 sm:py-0">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-[15px] font-medium">Tài khoản</h1>
      </div>

      <div className="mx-auto max-w-lg flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6">
        <Card className="border-[0.5px]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Hiển thị</span>
              <p className="font-medium">{user.display_name || user.username}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Username</span>
              <p className="font-mono text-[13px]">{user.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Vai trò</span>
              <Badge variant={hasMesAdminLikeAccess(user) ? "default" : "secondary"} className="gap-1">
                <Shield className="h-3 w-3" />
                {user.role === "admin"
                  ? "Admin (toàn nhà máy)"
                  : isHeadOfficeMesUser(user)
                    ? "Head Office (toàn nhà máy)"
                    : "User"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Phạm vi nhà máy</span>
              <p>
                {user.role === "admin"
                  ? "Tất cả (admin)"
                  : isHeadOfficeMesUser(user)
                    ? "Head Office — toàn bộ nhà máy (HO)"
                    : user.plant_code
                      ? `Mã: ${user.plant_code}`
                      : "—"}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 mt-2"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[0.5px] mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cur-pw">Mật khẩu hiện tại</Label>
                <Input
                  id="cur-pw"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pw">Mật khẩu mới (≥ 8 ký tự)</Label>
                <Input
                  id="new-pw"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu…" : "Cập nhật mật khẩu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {canManageLocks && (
          <Card className="border-[0.5px] mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Tạo tài khoản Operator</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOperator} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="operator-username">Username</Label>
                  <Input
                    id="operator-username"
                    value={operatorUsername}
                    onChange={(e) => setOperatorUsername(e.target.value)}
                    placeholder="operator.dn01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator-password">Mật khẩu tạm (≥ 8 ký tự)</Label>
                  <Input
                    id="operator-password"
                    type="password"
                    value={operatorPassword}
                    onChange={(e) => setOperatorPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator-display-name">Tên hiển thị (tuỳ chọn)</Label>
                  <Input
                    id="operator-display-name"
                    value={operatorDisplayName}
                    onChange={(e) => setOperatorDisplayName(e.target.value)}
                    placeholder="Operator Đà Nẵng"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator-plant-code">Plant code (tuỳ chọn)</Label>
                  <Input
                    id="operator-plant-code"
                    value={operatorPlantCode}
                    onChange={(e) => setOperatorPlantCode(e.target.value)}
                    placeholder="DN / LT / TA / BN / HO"
                  />
                </div>
                <Button type="submit" disabled={creatingOperator}>
                  {creatingOperator ? "Đang tạo…" : "Tạo tài khoản operator"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {canManageLocks && (
          <Card className="border-[0.5px] mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Bảo mật đăng nhập - Mở khóa user</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadLockedUsers()}
                disabled={loadingLockedUsers}
              >
                {loadingLockedUsers ? "Đang tải…" : "Làm mới"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Chính sách hiện tại: nhập sai mật khẩu 3 lần liên tiếp sẽ khóa 30 phút.
              </p>
              <div className="text-sm">
                <span className="font-medium">{lockedCount}</span> tài khoản đang bị khóa;{" "}
                <span className="font-medium">{lockedUsers.length}</span> tài khoản đang có dấu vết đăng nhập sai.
              </div>
              <div className="space-y-2">
                {lockedUsers.length === 0 ? (
                  <div className="rounded border border-dashed p-3 text-sm text-muted-foreground">
                    Không có tài khoản nào cần can thiệp.
                  </div>
                ) : (
                  lockedUsers.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {item.display_name || item.username}{" "}
                          <span className="text-muted-foreground font-normal">({item.username})</span>
                        </p>
                        <p className="text-muted-foreground">
                          Sai liên tiếp: {item.failed_login_count}
                          {item.locked_until
                            ? ` · Khóa đến: ${new Date(item.locked_until).toLocaleString("vi-VN")}`
                            : " · Chưa bị khóa"}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openUnlockDialog(item)}
                      >
                        Unlock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác thực lớp 2 để mở khóa</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu admin hiện tại để xác nhận mở khóa{" "}
              <strong>{unlockTarget?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-unlock-password">Mật khẩu admin xác thực</Label>
            <Input
              id="admin-unlock-password"
              type="password"
              autoComplete="current-password"
              value={adminUnlockPassword}
              onChange={(e) => setAdminUnlockPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnlockDialogOpen(false)}
              disabled={unlocking}
            >
              Hủy
            </Button>
            <Button onClick={() => void handleUnlockUser()} disabled={unlocking}>
              {unlocking ? "Đang xác thực…" : "Xác nhận mở khóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
