import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { AppHeader } from "../../../components/app/app-header";
import { DeveloperAvatar } from "../../../components/app/developer-avatar";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import type { ApiResponse, AuthUser, User } from "../../../types/app";
import {
  AUTH_DELETE_ENDPOINT,
  AUTH_UPDATE_ENDPOINT,
  readStoredUser,
} from "../../../lib/auth-storage";

export function ProfileTab({
  onUserUpdate,
  onSignOut,
  onOpenMenu,
}: {
  onUserUpdate: (user: AuthUser) => void;
  onSignOut: () => void;
  onOpenMenu: () => void;
}) {
  const navigate = useNavigate();

  const [user, _] = useState<User | null>(readStoredUser()); //tuve que ponerlo adentro de un useState porque se rompe en el useEffect si no lo pongo asi
  const [form, setForm] = useState({
    currentEmail: user?.email ?? "",
    currentPassword: "",
    newUsername: user?.username ?? "",
    newEmail: user?.email ?? "",
    newPassword: "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    setForm({
      currentEmail: user.email,
      currentPassword: "",
      newUsername: user.username,
      newEmail: user.email,
      newPassword: "",
    });
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(AUTH_UPDATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as ApiResponse<AuthUser>;
      const data = result.data;

      if (!response.ok || result.status === "error" || !data) {
        throw new Error(result.message || "Unable to update account");
      }

      onUserUpdate(data);
      setForm((current) => ({
        ...current,
        currentEmail: data.user.email,
        currentPassword: "",
        newUsername: data.user.username,
        newEmail: data.user.email,
        newPassword: "",
      }));
      setFeedback({ type: "success", message: result.message });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!form.currentPassword) {
      setFeedback({
        type: "error",
        message: "Enter your current password before deleting the account.",
      });
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    try {
      const response = await fetch(AUTH_DELETE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.currentEmail,
          password: form.currentPassword,
        }),
      });

      const result = (await response.json()) as ApiResponse<null>;
      if (!response.ok || result.status === "error") {
        throw new Error(result.message || "Unable to delete account");
      }

      onSignOut();
      navigate("/");
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-6 p-6">
        <div>
          <Badge variant="secondary" className="mb-4 px-3 py-1.5 text-sm">
            My profile
          </Badge>
          <CardTitle className="text-3xl">Manage your account</CardTitle>
          <CardDescription className="mt-2 text-base">
            Update your username, email, or password from one place.
          </CardDescription>
        </div>

        <form className="space-y-4" onSubmit={handleUpdate}>
          <Input
            type="email"
            label="Current email"
            value={form.currentEmail}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currentEmail: event.target.value,
              }))
            }
          />

          <Input
            type="password"
            label="Current password"
            placeholder="Required to save changes"
            value={form.currentPassword}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currentPassword: event.target.value,
              }))
            }
          />

          <Input
            label="New username"
            value={form.newUsername}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                newUsername: event.target.value,
              }))
            }
          />

          <Input
            type="email"
            label="New email"
            value={form.newEmail}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                newEmail: event.target.value,
              }))
            }
          />

          <Input
            type="password"
            label="New password"
            placeholder="Leave empty to keep the current one"
            value={form.newPassword}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                newPassword: event.target.value,
              }))
            }
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="sm:min-w-45"
            >
              Save changes
              {isSaving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onSignOut}
            >
              Sign out
            </Button>
          </div>
        </form>

        {feedback ? (
          <Card
            className={`shadow-none ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <CardBody className="flex flex-row items-center gap-3 p-4">
              {feedback.type === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
              <p
                className={
                  feedback.type === "success"
                    ? "text-emerald-700"
                    : "text-red-700"
                }
              >
                {feedback.message}
              </p>
            </CardBody>
          </Card>
        ) : null}

        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <div className="space-y-2">
            <CardTitle className="text-xl text-red-700">
              Delete account
            </CardTitle>
            <CardDescription className="text-red-700/80">
              This removes your current account from the platform. Enter your
              current password first.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : null}
            Delete account
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
