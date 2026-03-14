import { useEffect, useState, memo, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw, Loader2, Star, Check, X, Trash2, Search, Eye, Upload, FileUp, ArrowRight, ImagePlus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  photos?: string[] | null;
}

interface DbProduct {
  id: string;
  name: string;
}

type ReviewField = "customer_name" | "rating" | "title" | "comment" | "customer_email" | "photos" | "verified" | "date" | "skip";

const REVIEW_FIELDS: { value: ReviewField; label: string }[] = [
  { value: "skip", label: "— Skip —" },
  { value: "customer_name", label: "Customer Name" },
  { value: "rating", label: "Rating (1-5)" },
  { value: "title", label: "Review Title" },
  { value: "comment", label: "Review Comment" },
  { value: "customer_email", label: "Email" },
  { value: "photos", label: "Photos (URLs)" },
  { value: "verified", label: "Verified Purchase" },
  { value: "date", label: "Date" },
];

// Auto-guess column mapping from header name
const guessField = (header: string): ReviewField => {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["name", "customername", "reviewer", "author", "reviewername", "username", "displayname"].includes(h)) return "customer_name";
  if (["rating", "stars", "score", "starrating"].includes(h)) return "rating";
  if (["title", "subject", "headline", "reviewtitle", "summary"].includes(h)) return "title";
  if (["comment", "review", "body", "text", "content", "reviewtext", "reviewbody", "description", "reviewcontent", "feedback"].includes(h)) return "comment";
  if (["email", "customeremail", "revieweremail", "mail"].includes(h)) return "customer_email";
  if (["photos", "images", "photo", "image", "imageurl", "photourl", "imagelinks", "media"].includes(h)) return "photos";
  if (["verified", "verifiedpurchase", "isverified", "isverifiedpurchase", "purchase"].includes(h)) return "verified";
  if (["date", "createdat", "reviewdate", "posteddate", "time", "timestamp", "postedon", "dateposted"].includes(h)) return "date";
  return "skip";
};

const parseCSVLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim()); current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const detectDelimiter = (text: string): string => {
  const firstLine = text.split("\n")[0] || "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;
  const max = Math.max(tabs, commas, semicolons, pipes);
  if (max === 0) return ",";
  if (max === tabs) return "\t";
  if (max === semicolons) return ";";
  if (max === pipes) return "|";
  return ",";
};

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importStep, setImportStep] = useState<"paste" | "map" | "importing">("paste");
  const [importProductIds, setImportProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ReviewField[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    fetchDbProducts();
  }, []);

  const fetchDbProducts = async () => {
    const { data } = await supabase.from("products").select("id, name").eq("is_active", true).is("deleted_at", null).order("name");
    setDbProducts((data || []) as DbProduct[]);
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const sessionData = sessionStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");
      const { token } = JSON.parse(sessionData);
      const response = await supabase.functions.invoke("get-admin-reviews", { headers: { Authorization: `Bearer ${token}` } });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      setReviews(response.data?.reviews || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionToken = () => {
    const s = sessionStorage.getItem("rayn_admin_session");
    return s ? JSON.parse(s).token : null;
  };

  const updateReviewStatus = async (reviewId: string, isApproved: boolean) => {
    try {
      const token = getSessionToken();
      if (!token) throw new Error("No admin session found");
      const response = await supabase.functions.invoke("manage-reviews", { headers: { Authorization: `Bearer ${token}` }, body: { action: "update_status", reviewId, isApproved } });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, is_approved: isApproved } : r));
      toast({ title: "Updated", description: `Review ${isApproved ? "approved" : "hidden"}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const token = getSessionToken();
      if (!token) throw new Error("No admin session found");
      const response = await supabase.functions.invoke("manage-reviews", { headers: { Authorization: `Bearer ${token}` }, body: { action: "delete", reviewId } });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      setReviews(reviews.filter(r => r.id !== reviewId));
      toast({ title: "Deleted", description: "Review deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getProductName = (productId: string) => dbProducts.find(p => p.id === productId)?.name || productId;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  // ---- Import Logic ----
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawText((ev.target?.result as string) || "");
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleParseData = () => {
    if (!rawText.trim()) {
      toast({ title: "Error", description: "Please paste or upload some data first", variant: "destructive" });
      return;
    }

    const delimiter = detectDelimiter(rawText);
    const lines = rawText.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) {
      toast({ title: "Error", description: "Need at least a header row + 1 data row", variant: "destructive" });
      return;
    }

    const headers = parseCSVLine(lines[0], delimiter).map(h => h.replace(/^["']|["']$/g, "").trim());
    const rows = lines.slice(1).map(l => parseCSVLine(l, delimiter)).filter(r => r.some(c => c));

    setParsedHeaders(headers);
    setParsedRows(rows);
    setColumnMapping(headers.map(h => guessField(h)));
    setImportStep("map");
  };

  const handleDoImport = async () => {
    if (importProductIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one product", variant: "destructive" });
      return;
    }

    const mappedReviews = parsedRows.map(row => {
      const obj: Record<string, string> = {};
      columnMapping.forEach((field, i) => {
        if (field !== "skip" && row[i]) {
          // If field already has a value, append (for multiple comment columns etc.)
          if (obj[field] && field === "comment") {
            obj[field] += "\n" + row[i];
          } else {
            obj[field] = row[i];
          }
        }
      });

      return {
        customer_name: obj.customer_name || "Verified Buyer",
        customer_email: obj.customer_email || "",
        rating: obj.rating || "5",
        title: obj.title || "",
        comment: obj.comment || "",
        is_verified_purchase: ["true", "yes", "1"].includes((obj.verified || "").toLowerCase()),
        photos: (obj.photos || "").split(/[|,;\n]/).map(s => s.trim()).filter(s => s.startsWith("http")),
        created_at: obj.date || "",
      };
    });

    setIsImporting(true);
    setImportStep("importing");
    setImportResult(null);

    let totalInserted = 0;
    let totalFailed = 0;

    try {
      const token = getSessionToken();
      if (!token) throw new Error("No admin session found");

      for (const productId of importProductIds) {
        const response = await supabase.functions.invoke("manage-reviews", {
          headers: { Authorization: `Bearer ${token}` },
          body: { action: "bulk_import", product_id: productId, reviews: mappedReviews },
        });
        if (response.error) throw response.error;
        if (response.data?.error) throw new Error(response.data.error);
        totalInserted += response.data.inserted || 0;
        totalFailed += response.data.failed || 0;
      }

      setImportResult({ inserted: totalInserted, failed: totalFailed });
      toast({ title: "Import Complete", description: `${totalInserted} reviews imported across ${importProductIds.length} product(s)` });
      fetchReviews();
    } catch (error: any) {
      toast({ title: "Import Error", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setImportStep("paste");
    setRawText("");
    setParsedHeaders([]);
    setParsedRows([]);
    setColumnMapping([]);
    setImportResult(null);
    setImportProductIds([]);
    setProductSearch("");
  };

  const filteredReviews = reviews.filter(r => {
    if (statusFilter !== "all") {
      if (statusFilter === "approved" && !r.is_approved) return false;
      if (statusFilter === "pending" && r.is_approved) return false;
    }
    if (productFilter !== "all" && r.product_id !== productFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!r.customer_name.toLowerCase().includes(query) &&
          !r.customer_email.toLowerCase().includes(query) &&
          !(r.title?.toLowerCase().includes(query)) &&
          !(r.comment?.toLowerCase().includes(query))) return false;
    }
    return true;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.is_approved).length,
    pending: reviews.filter(r => !r.is_approved).length,
    avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0",
  };

  const reviewProductIds = [...new Set(reviews.map(r => r.product_id))];

  // Preview of mapped data
  const previewRows = useMemo(() => {
    if (parsedRows.length === 0) return [];
    return parsedRows.slice(0, 3).map(row => {
      const obj: Record<string, string> = {};
      columnMapping.forEach((field, i) => {
        if (field !== "skip" && row[i]) obj[field] = row[i];
      });
      return obj;
    });
  }, [parsedRows, columnMapping]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
          <p className="text-muted-foreground">Manage customer reviews and ratings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowImportDialog(true); resetImport(); }} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />Import Reviews
          </Button>
          <Button onClick={fetchReviews} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: stats.total, color: "" },
          { label: "Approved", value: stats.approved, color: "text-green-500" },
          { label: "Pending", value: stats.pending, color: "text-amber-500" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-lg border bg-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Avg Rating</p>
          <p className="text-2xl font-bold text-primary flex items-center gap-1">
            {stats.avgRating} <Star className="w-5 h-5 fill-primary" />
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {reviewProductIds.map(pid => (
              <SelectItem key={pid} value={pid}>{getProductName(pid)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Photos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No reviews found</TableCell></TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <p className="font-medium">{review.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{review.customer_email}</p>
                  </TableCell>
                  <TableCell className="text-sm">{getProductName(review.product_id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {review.photos && review.photos.length > 0 ? `${review.photos.length} photo${review.photos.length > 1 ? "s" : ""}` : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${review.is_approved ? "bg-green-500/20 text-green-500" : "bg-amber-500/20 text-amber-500"}`}>
                      {review.is_approved ? <Check className="w-3 h-3" /> : null}
                      {review.is_approved ? "Approved" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(review.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedReview(review)}><Eye className="w-4 h-4" /></Button>
                      {review.is_approved ? (
                        <Button variant="ghost" size="sm" onClick={() => updateReviewStatus(review.id, false)} className="text-amber-500 hover:text-amber-600"><X className="w-4 h-4" /></Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => updateReviewStatus(review.id, true)} className="text-green-500 hover:text-green-600"><Check className="w-4 h-4" /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteReview(review.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Review Details</DialogTitle></DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedReview.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReview.customer_email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= selectedReview.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">Product: {getProductName(selectedReview.product_id)}</p>
                <p className="text-sm text-muted-foreground">Date: {formatDate(selectedReview.created_at)}</p>
                {selectedReview.is_verified_purchase && (
                  <span className="inline-flex items-center px-2 py-1 bg-primary/20 text-primary text-xs rounded">Verified Purchase</span>
                )}
              </div>
              {selectedReview.title && <div><p className="text-sm text-muted-foreground mb-1">Title</p><p className="font-medium">{selectedReview.title}</p></div>}
              {selectedReview.comment && <div><p className="text-sm text-muted-foreground mb-1">Review</p><p className="text-sm">{selectedReview.comment}</p></div>}
              {selectedReview.photos && selectedReview.photos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReview.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Review photo ${i + 1}`} className="w-16 h-16 object-cover rounded border" />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                {selectedReview.is_approved ? (
                  <Button variant="outline" onClick={() => { updateReviewStatus(selectedReview.id, false); setSelectedReview({ ...selectedReview, is_approved: false }); }} className="flex-1">
                    <X className="w-4 h-4 mr-2" />Hide
                  </Button>
                ) : (
                  <Button onClick={() => { updateReviewStatus(selectedReview.id, true); setSelectedReview({ ...selectedReview, is_approved: true }); }} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />Approve
                  </Button>
                )}
                <Button variant="destructive" onClick={() => { deleteReview(selectedReview.id); setSelectedReview(null); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) setShowImportDialog(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              Import Reviews
              {importStep === "map" && " — Map Columns"}
              {importStep === "importing" && " — Results"}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Paste / Upload */}
          {importStep === "paste" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Products * <span className="text-xs text-muted-foreground">(reviews will be added to all selected)</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {importProductIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {importProductIds.map(pid => {
                      const name = dbProducts.find(p => p.id === pid)?.name || pid;
                      return (
                        <span key={pid} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
                          {name.length > 30 ? name.slice(0, 30) + "…" : name}
                          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setImportProductIds(prev => prev.filter(id => id !== pid))} />
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {dbProducts
                    .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(p => {
                      const selected = importProductIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setImportProductIds(prev =>
                              selected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                            );
                          }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors ${selected ? "bg-primary/10" : ""}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary" : "border-border"}`}>
                            {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  {dbProducts.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">No products found</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload File (CSV, TSV, TXT — any format)</Label>
                <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                  <FileUp className="w-4 h-4 mr-2" />Choose File
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Or Paste Data (any delimiter: comma, tab, semicolon, pipe)</Label>
                <Textarea
                  placeholder={`Paste your scraped data here...\n\nExample:\nname\trating\treview\nJohn\t5\tGreat product!\nJane\t4\tLoved it`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Works with any format — CSV, TSV, pipe-separated, semicolons. First row = headers. You'll map columns next.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowImportDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleParseData} disabled={!rawText.trim() || importProductIds.length === 0} className="flex-1">
                  Next: Map Columns <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Map columns */}
          {importStep === "map" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We detected <strong>{parsedHeaders.length}</strong> columns and <strong>{parsedRows.length}</strong> rows. Map each column to a review field:
              </p>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Your Column</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead className="w-[180px]">Maps To</TableHead>
                      <TableHead>Sample Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedHeaders.map((header, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs font-medium">{header}</TableCell>
                        <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                        <TableCell>
                          <Select value={columnMapping[idx]} onValueChange={(val) => {
                            const next = [...columnMapping];
                            next[idx] = val as ReviewField;
                            setColumnMapping(next);
                          }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {REVIEW_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {parsedRows[0]?.[idx] || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Preview */}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Preview (first {previewRows.length} rows):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {previewRows.map((row, i) => (
                      <div key={i} className="p-2 bg-muted/50 rounded text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.customer_name || "Verified Buyer"}</span>
                          <span className="text-primary">{"★".repeat(Math.min(5, parseInt(row.rating || "5")))}</span>
                        </div>
                        {row.title && <p className="font-medium">{row.title}</p>}
                        {row.comment && <p className="text-muted-foreground line-clamp-2">{row.comment}</p>}
                        {row.photos && <p className="text-primary/70">📷 {row.photos.split(/[|,;]/).filter(Boolean).length} photo(s)</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportStep("paste")} className="flex-1">Back</Button>
                <Button onClick={handleDoImport} disabled={!columnMapping.some(m => m !== "skip")} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Import {parsedRows.length} Reviews
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {importStep === "importing" && (
            <div className="space-y-4 py-4">
              {isImporting ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Importing reviews...</p>
                </div>
              ) : importResult ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{importResult.inserted} reviews imported</p>
                    {importResult.failed > 0 && <p className="text-sm text-destructive">{importResult.failed} failed</p>}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => { resetImport(); }}>Import More</Button>
                    <Button onClick={() => setShowImportDialog(false)}>Done</Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default memo(AdminReviewsPage);
