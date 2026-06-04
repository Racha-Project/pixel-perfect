import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Star, User } from "lucide-react";

export const Route = createFileRoute("/_app/bookings/schedule")({
  head: () => ({ meta: [{ title: "Schedule Session — Fitder X" }] }),
  component: ScheduleSessionPage,
});

interface Trainer {
  id: string;
  display_name: string;
  bio: string;
  specialties: string[];
  hourly_rate_thb: number;
  rating: number;
  review_count: number;
  location: string;
  avatar_url: string | null;
}

interface BookingFormData {
  trainer_id: string;
  session_date: string;
  session_time: string;
  modality: "online" | "gym" | "home";
  notes: string;
}

function ScheduleSessionPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    trainer_id: "",
    session_date: "",
    session_time: "",
    modality: "online",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const { data: trainers = [], isLoading: trainersLoading } = useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const res = await fetch("/api/trainers", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Trainer[]>;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    if (!bookingData.trainer_id || !bookingData.session_date || !bookingData.session_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const trainer = trainers.find((t) => t.id === bookingData.trainer_id);
      const price = trainer?.hourly_rate_thb || 0;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          trainer_id: bookingData.trainer_id,
          session_date: bookingData.session_date,
          session_time: bookingData.session_time,
          modality: bookingData.modality,
          notes: bookingData.notes,
          price_thb: price,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Booking submitted! Awaiting trainer confirmation");
      nav({ to: "/bookings/history" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero grid place-items-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to book a session</p>
          <Button onClick={() => nav({ to: "/login" })} className="mt-4 bg-gradient-primary">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Schedule a Session</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Choose a trainer and book your personalized training session
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-6">Available Trainers</h2>

            {trainersLoading ? (
              <div className="text-center text-muted-foreground">Loading trainers...</div>
            ) : trainers.length === 0 ? (
              <div className="text-center text-muted-foreground">No trainers available</div>
            ) : (
              trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  onClick={() => {
                    setSelectedTrainer(trainer.id);
                    setBookingData((prev) => ({ ...prev, trainer_id: trainer.id }));
                  }}
                  className={`glass rounded-2xl p-6 border-2 cursor-pointer transition-all duration-200 ${
                    selectedTrainer === trainer.id
                      ? "border-[#00ff85] bg-[#00ff85]/10 shadow-glow"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-primary/20 flex items-center justify-center flex-shrink-0">
                      {trainer.avatar_url ? (
                        <img
                          src={trainer.avatar_url}
                          alt={trainer.display_name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{trainer.display_name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{trainer.bio}</p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {trainer.specialties.slice(0, 2).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-foreground"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold">{trainer.rating}</span>
                            <span className="text-muted-foreground">({trainer.review_count})</span>
                          </div>
                          <div className="flex items-center gap-1 text-foreground">
                            <MapPin className="w-4 h-4" />
                            {trainer.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">฿{trainer.hourly_rate_thb}</div>
                          <div className="text-xs text-muted-foreground">per hour</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <div className="sticky top-8 glass rounded-2xl border border-white/10 p-6 shadow-card">
              <h3 className="text-xl font-bold mb-6">Book Session</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Trainer</Label>
                  <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                    {selectedTrainer
                      ? trainers.find((t) => t.id === selectedTrainer)?.display_name ||
                        "Select a trainer"
                      : "Select a trainer from the list"}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Session Date</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      required
                      value={bookingData.session_date}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, session_date: e.target.value }))
                      }
                      className="pl-10"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Session Time</Label>
                  <div className="relative mt-2">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="time"
                      required
                      value={bookingData.session_time}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, session_time: e.target.value }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Session Type</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {["online", "gym", "home"].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() =>
                          setBookingData((prev) => ({
                            ...prev,
                            modality: mode as "online" | "gym" | "home",
                          }))
                        }
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          bookingData.modality === mode
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/5 border border-white/10 text-foreground hover:border-white/20"
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Notes (Optional)</Label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) =>
                      setBookingData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Any special requests or notes..."
                    className="mt-2 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-0 resize-none min-h-[80px]"
                  />
                </div>

                {selectedTrainer && (
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimated Cost:</span>
                      <span className="text-lg font-bold text-primary">
                        ฿{trainers.find((t) => t.id === selectedTrainer)?.hourly_rate_thb || 0}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !selectedTrainer}
                  className="w-full bg-gradient-primary shadow-glow h-11 font-semibold mt-6"
                >
                  {loading ? "Booking..." : "Book Session"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Trainer will confirm within 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
