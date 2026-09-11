"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  FileSpreadsheet,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Submission {
  _id: string;
  fullName: string;
  nationalId: string;
  university: string;
  college: string;
  email: string;
  phone: string;
  submittedAt: string;
}

interface FormInfo {
  title: string;
  submissionsCount: number;
  isActive: boolean;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function SubmissionsPage() {
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<FormInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [exporting, setExporting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) params.set("q", query);
      const res = await fetch(`/api/forms/${id}/submissions?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(data.form);
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [id, page, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/forms/${id}/export`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") ?? "submissions.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Excel file downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleToggleStatus() {
    if (!form) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/forms/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !form.isActive }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm((prev) => prev ? { ...prev, isActive: data.isActive } : null);
      toast.success(data.isActive ? "Registration opened!" : "Registration closed!");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" priority />
            <span className="font-bold">Creativa Forms</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            {form ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  {form.title}
                  {!form.isActive && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                      Closed
                    </Badge>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">
                    {pagination?.total ?? form.submissionsCount} submissions
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-7 w-64 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={form?.isActive ? "outline" : "default"}
              onClick={handleToggleStatus}
              disabled={toggling || !form}
              className={!form?.isActive ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {toggling ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : form?.isActive ? (
                <Lock className="h-4 w-4 mr-2" />
              ) : (
                <Unlock className="h-4 w-4 mr-2" />
              )}
              {form?.isActive ? "Close Registration" : "Open Registration"}
            </Button>
            <Button
              id="export-btn"
              onClick={handleExport}
              disabled={exporting || !form}
              className="shadow-md shadow-primary/20"
            >
              {exporting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <FileSpreadsheet />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Search by name or email…"
            className="pl-9 bg-white/80"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm bg-white/80 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-lg font-semibold mb-1">
                  {query ? "No results found" : "No submissions yet"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {query
                    ? "Try a different search term"
                    : "Share the form link to start collecting registrations"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Full Name</TableHead>
                    <TableHead>National ID</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead className="hidden md:table-cell">College</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell className="font-medium">{sub.fullName}</TableCell>
                      <TableCell className="font-mono text-sm">{sub.nationalId}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[180px] truncate">
                        {sub.university}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {sub.college}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.email}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {sub.phone}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
            </p>
            <div className="flex gap-2">
              <Button
                id="prev-page-btn"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                id="next-page-btn"
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
