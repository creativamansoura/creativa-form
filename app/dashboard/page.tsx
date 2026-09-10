"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  ClipboardList,
  Loader2,
  LogOut,
  BookOpen,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

interface FormDoc {
  _id: string;
  title: string;
  slug: string;
  createdAt: string;
  submissionsCount: number;
}

const CreateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
});
type CreateForm = z.infer<typeof CreateSchema>;

export default function DashboardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState<FormDoc | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(CreateSchema),
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const fetchForms = useCallback(async () => {
    try {
      const res = await fetch("/api/forms");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForms(data.forms);
    } catch {
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  async function onCreate(data: CreateForm) {
    setCreating(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setNewForm(json.form);
      setForms((prev) => [json.form, ...prev]);
      reset();
      toast.success("Form created!");
    } catch {
      toast.error("Failed to create form");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!newForm) return;
    try {
      await navigator.clipboard.writeText(`${baseUrl}/f/${newForm.slug}`);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setNewForm(null);
      reset();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow shadow-primary/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">Creativa Forms</span>
          </div>
          <Button
            id="logout-btn"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Forms</h1>
            <p className="text-muted-foreground mt-1">
              Create forms and share public registration links
            </p>
          </div>
          <Button id="create-form-btn" onClick={() => setDialogOpen(true)} size="lg" className="shadow-lg shadow-primary/20">
            <Plus />
            Create Form
          </Button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-white/70">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{forms.length}</p>
                <p className="text-sm text-muted-foreground">Total Forms</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white/70">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {forms.reduce((s, f) => s + f.submissionsCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms list */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 mb-6">
              <ClipboardList className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No forms yet</h2>
            <p className="text-muted-foreground mb-6">Create your first training registration form</p>
            <Button id="empty-create-btn" onClick={() => setDialogOpen(true)}>
              <Plus /> Create your first form
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {forms.map((form) => (
              <Card
                key={form._id}
                className="border-0 shadow-sm bg-white/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug line-clamp-2">
                      {form.title}
                    </CardTitle>
                    <Badge className="shrink-0 text-xs px-2">
                      {form.submissionsCount}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(form.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground font-mono truncate bg-muted/50 rounded px-2 py-1">
                    /f/{form.slug}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 text-xs">
                      <Link href={`/dashboard/forms/${form._id}`}>
                        <Users className="h-3 w-3" />
                        Submissions
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="text-xs">
                      <a
                        href={`/f/${form.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open public form"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create form dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Training Form</DialogTitle>
            <DialogDescription>
              Enter the training or session name. A unique public registration link will be generated.
            </DialogDescription>
          </DialogHeader>

          {newForm ? (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-semibold text-green-800 mb-1">✅ Form created!</p>
                <p className="text-sm text-green-700">{newForm.title}</p>
              </div>
              <div className="space-y-2">
                <Label>Public registration link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    readOnly
                    value={`${baseUrl}/f/${newForm.slug}`}
                    className="font-mono text-xs"
                  />
                  <Button
                    id="copy-link-btn"
                    size="icon"
                    variant="outline"
                    onClick={copyLink}
                    aria-label="Copy link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Link href={`/dashboard/forms/${newForm._id}`}>
                    View Submissions
                  </Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDialogClose(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-title">Training / Session Name</Label>
                <Input
                  id="form-title"
                  placeholder="e.g. Frontend Bootcamp — Batch 3"
                  autoFocus
                  {...register("title")}
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>
              <Button
                id="submit-create-form"
                type="submit"
                className="w-full"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus />
                    Create Form
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
