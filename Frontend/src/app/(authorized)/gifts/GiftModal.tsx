import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GiftCapsuleModalProps {
  open: boolean;
  onClose: () => void;
  capsuleId: string;
}

export default function GiftCapsuleModal({
  open,
  onClose,
  capsuleId,
}: GiftCapsuleModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ recipient: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: { recipient: string }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/gift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capsuleId: capsuleId,
          recipient: data.recipient,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Optionally, you can show a success message or update the UI
        console.log(result.message);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to transfer album ownership");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gift Time Capsule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              placeholder="Enter the recipient's email"
              {...register("recipient", {
                required: "Recipient email is required",
              })}
            />
            <div>{errors.recipient?.message}</div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Transferring..." : "Transfer Ownership"}
              </Button>
            </div>
            {error && <div className="text-red-500">{error}</div>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
