import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Check, AlertCircle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/bookings/history")({
  head: () => ({ meta: [{ title: "My Bookings — Fitder X" }] }),
  component: BookingHistoryPage,
});

interface Booking {
  id: string;
  trainer_id: string;
  session_date: string;
  session_time: string;
  modality: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
  price_thb: number;
  created_at: string;
  trainers?: {
    display_name: string;
    avatar_url: string | null;
  };
}

function BookingHistoryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Booking[]>;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      toast.success("Booking cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel booking");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 border-green-500/30 text-green-400";
      case "pending":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      case "completed":
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
      case "cancelled":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      default:
        return "bg-gray-500/20 border-gray-500/30 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Check className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero grid place-items-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view bookings</p>
          <Link to="/login">
            <Button className="mt-4 bg-gradient-primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">My Bookings</h1>
            <p className="mt-2 text-muted-foreground">View and manage your training sessions</p>
          </div>
          <Link to="/bookings/schedule">
            <Button className="bg-gradient-primary shadow-glow">+ New Booking</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="glass rounded-2xl border border-white/10 p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-6">No bookings yet</p>
            <Link to="/bookings/schedule">
              <Button className="bg-gradient-primary shadow-glow">Schedule Your First Session</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="glass rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                  <div className="flex gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary/20 flex-shrink-0 flex items-center justify-center">
                      {booking.trainers?.avatar_url ? (
                        <img
                          src={booking.trainers.avatar_url}
                          alt={booking.trainers.display_name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-primary opacity-30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{booking.trainers?.display_name || "Unknown Trainer"}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.session_date).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.session_time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="capitalize">{booking.modality}</span>
                        </div>
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">"{booking.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center w-full lg:w-auto">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="text-sm font-medium capitalize">{booking.status}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold">฿{booking.price_thb}</div>
                      <div className="text-xs text-muted-foreground">per hour</div>
                    </div>

                    {booking.status === "pending" || booking.status === "confirmed" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
