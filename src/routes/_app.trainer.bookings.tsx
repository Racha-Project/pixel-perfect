import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, User, Check, X } from "lucide-react";

export const Route = createFileRoute("/_app/trainer/bookings")({
  head: () => ({ meta: [{ title: "Booking Requests — Fitder X" }] }),
  component: TrainerBookingsPage,
});

interface BookingRequest {
  id: string;
  userId: string;
  sessionDate: string;
  sessionTime: string;
  modality: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
  priceThb: number;
  createdAt: string;
  clientName?: string;
  clientAvatar?: string | null;
}

function TrainerBookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["trainer-bookings", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/trainer/bookings", { credentials: "include" });
      return res.ok ? res.json() as Promise<BookingRequest[]> : [];
    },
    enabled: !!user,
  });

  const updateStatus = async (bookingId: string, status: string) => {
    const res = await fetch(`/api/trainer/bookings/${bookingId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update");
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => updateStatus(id, "confirmed"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trainer-bookings"] }); toast.success("Booking confirmed!"); },
    onError: () => toast.error("Failed to confirm booking"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateStatus(id, "cancelled"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trainer-bookings"] }); toast.success("Booking declined"); },
    onError: () => toast.error("Failed to decline booking"),
  });

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const completedBookings = bookings.filter((b) => b.status === "completed");

  const BookingCard = ({ booking }: { booking: BookingRequest }) => (
    <div className="glass rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        <div className="flex gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary/20 flex-shrink-0 flex items-center justify-center">
            {booking.clientAvatar ? <img src={booking.clientAvatar} alt={booking.clientName} className="w-full h-full rounded-xl object-cover" /> : <User className="w-6 h-6 text-primary" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{booking.clientName || "Client"}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(booking.sessionDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</div>
              <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{booking.sessionTime}</div>
              <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span className="capitalize">{booking.modality}</span></div>
            </div>
            {booking.notes && <p className="text-sm text-muted-foreground mt-2 italic">"{booking.notes}"</p>}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="text-right"><div className="text-2xl font-bold">฿{booking.priceThb}</div><div className="text-xs text-muted-foreground">per hour</div></div>
          {booking.status === "pending" && (
            <div className="flex gap-2 w-full lg:w-auto">
              <Button size="sm" onClick={() => confirmMutation.mutate(booking.id)} disabled={confirmMutation.isPending} className="flex-1 lg:flex-none bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
                <Check className="w-4 h-4 mr-1" />Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => rejectMutation.mutate(booking.id)} disabled={rejectMutation.isPending} className="flex-1 lg:flex-none text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20">
                <X className="w-4 h-4 mr-1" />Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero grid place-items-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in as a trainer</p>
          <Link to="/login"><Button className="mt-4 bg-gradient-primary">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Booking Requests</h1>
        <p className="mt-2 text-muted-foreground">Manage your client bookings and training sessions</p>
      </div>
      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading bookings...</div>
      ) : (
        <div className="space-y-12">
          {pendingBookings.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400" /><h2 className="text-2xl font-bold">Pending ({pendingBookings.length})</h2></div>
              <div className="space-y-4">{pendingBookings.map((b) => <BookingCard key={b.id} booking={b} />)}</div>
            </div>
          )}
          {confirmedBookings.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400" /><h2 className="text-2xl font-bold">Confirmed ({confirmedBookings.length})</h2></div>
              <div className="space-y-4">{confirmedBookings.map((b) => <BookingCard key={b.id} booking={b} />)}</div>
            </div>
          )}
          {completedBookings.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400" /><h2 className="text-2xl font-bold">Completed ({completedBookings.length})</h2></div>
              <div className="space-y-4">{completedBookings.map((b) => <BookingCard key={b.id} booking={b} />)}</div>
            </div>
          )}
          {bookings.length === 0 && (
            <div className="glass rounded-2xl border border-white/10 p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No booking requests yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
