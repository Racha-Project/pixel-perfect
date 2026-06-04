import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users2, Search, Trash2, Shield, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Fitder X Admin" }] }),
  component: AdminUsers,
});

type UserRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  displayName: string | null;
  userType: string | null;
  onboarded: boolean | null;
  avatarUrl: string | null;
};

const ROLE_STYLE: Record<string, string> = {
  client:  "bg-blue-500/20 border-blue-500/30 text-blue-400",
  trainer: "bg-violet-500/20 border-violet-500/30 text-violet-400",
  admin:   "bg-amber-500/20 border-amber-500/30 text-amber-400",
};

const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  trainer: "Trainer",
  admin: "Admin",
};

function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [roleMenu, setRoleMenu] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, userType }: { id: string; userType: string }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("อัปเดต role สำเร็จ");
      setRoleMenu(null);
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("ลบผู้ใช้สำเร็จ");
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message || "เกิดข้อผิดพลาด"),
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [u.email, u.displayName, u.firstName, u.lastName]
      .some(v => (v ?? "").toLowerCase().includes(q));
    const matchRole = !roleFilter || u.userType === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-1">Admin Portal</div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users2 className="h-7 w-7 text-blue-400" />
          จัดการผู้ใช้
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ผู้ใช้ทั้งหมด {users.length} คน · แสดง {filtered.length} คน
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, อีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["", "client", "trainer", "admin"].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={roleFilter === r ? "default" : "outline"}
              onClick={() => setRoleFilter(r)}
              className={roleFilter === r ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0" : ""}
            >
              {r === "" ? "ทั้งหมด" : ROLE_LABEL[r] ?? r}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center shadow-card">
          <Users2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">ไม่พบผู้ใช้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_120px_140px_100px] gap-3 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
            <div>ผู้ใช้</div>
            <div>อีเมล</div>
            <div>Role</div>
            <div>สมัครเมื่อ</div>
            <div className="text-right">จัดการ</div>
          </div>

          {filtered.map((u) => (
            <div
              key={u.id}
              className="glass rounded-xl p-4 shadow-card border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="md:grid md:grid-cols-[1fr_1fr_120px_140px_100px] md:gap-3 md:items-center flex flex-col gap-3">
                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 grid place-items-center shrink-0 overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.displayName || [u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden truncate">{u.email ?? "—"}</div>
                  </div>
                </div>

                {/* Email */}
                <div className="hidden md:block text-sm text-muted-foreground truncate">{u.email ?? "—"}</div>

                {/* Role badge + change */}
                <div className="relative">
                  <button
                    onClick={() => setRoleMenu(roleMenu === u.id ? null : u.id)}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${ROLE_STYLE[u.userType ?? "client"]} hover:opacity-80 transition-opacity`}
                  >
                    {ROLE_LABEL[u.userType ?? "client"] ?? u.userType}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {roleMenu === u.id && (
                    <div className="absolute z-50 top-full left-0 mt-1 glass-strong rounded-xl border border-white/10 p-1 shadow-lg min-w-[120px]">
                      {["client", "trainer", "admin"].map((role) => (
                        <button
                          key={role}
                          onClick={() => updateRole.mutate({ id: u.id, userType: role })}
                          className={`w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                            u.userType === role ? "text-amber-400 font-medium" : "text-foreground"
                          }`}
                        >
                          {ROLE_LABEL[role]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Created at */}
                <div className="text-xs text-muted-foreground">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString("th-TH") : "—"}
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  {confirmDelete === u.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-red-600 hover:bg-red-500"
                        onClick={() => deleteUser.mutate(u.id)}
                      >
                        ยืนยันลบ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setConfirmDelete(null)}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => setConfirmDelete(u.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      ลบ
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
