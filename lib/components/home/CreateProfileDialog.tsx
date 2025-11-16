"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";

export default function CreateProfileDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createProfile, switchProfile } = useProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setIsSubmitting(true);
    try {
      const newProfile = await createProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileDescription: description.trim() || undefined,
      });

      await switchProfile(newProfile.id);

      setFirstName("");
      setLastName("");
      setDescription("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="hover:cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Create New Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">First Name</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Last Name</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this profile's purpose"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="hover:cursor-pointer">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
