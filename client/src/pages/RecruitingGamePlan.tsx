import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  RECRUITING_STATUSES,
  type RecruitingTarget,
  type RecruitingContact,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Copy,
  AlertTriangle,
  Loader2,
  School,
  Users,
  MessageSquare,
  Trophy,
  ClipboardList,
} from "lucide-react";

interface RecruitingGamePlanProps {
  playerId: number;
}

const DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"] as const;
const CONTACT_TYPES = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "in_person", label: "In Person" },
  { value: "camp", label: "Camp" },
  { value: "visit", label: "Visit" },
] as const;
const RESPONSE_TYPES = [
  { value: "none", label: "None" },
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
] as const;

type StatusKey = keyof typeof RECRUITING_STATUSES;

function isOverdue(followUpDate: string | Date | null | undefined): boolean {
  if (!followUpDate) return false;
  return new Date(followUpDate) < new Date();
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecruitingGamePlan({ playerId }: RecruitingGamePlanProps) {
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecruitingTarget | null>(null);
  const [emailDialogTarget, setEmailDialogTarget] = useState<RecruitingTarget | null>(null);
  const [contactDialogTarget, setContactDialogTarget] = useState<RecruitingTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecruitingTarget | null>(null);

  const [formData, setFormData] = useState({
    collegeName: "",
    division: "D2" as string,
    state: "",
    contactName: "",
    contactEmail: "",
    contactTitle: "",
    notes: "",
    followUpDate: "",
  });

  const [contactForm, setContactForm] = useState({
    type: "email",
    notes: "",
    response: "none",
  });

  const { data: targets = [], isLoading } = useQuery<RecruitingTarget[]>({
    queryKey: ["/api/players", playerId, "recruiting-targets"],
    queryFn: () =>
      fetch(`/api/players/${playerId}/recruiting-targets`).then((r) => r.json()),
    enabled: !!playerId,
  });

  const createTarget = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", `/api/players/${playerId}/recruiting-targets`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "recruiting-targets"],
      });
      toast({ title: "School added to your game plan!" });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add school", description: error.message, variant: "destructive" });
    },
  });

  const updateTarget = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/recruiting-targets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "recruiting-targets"],
      });
      toast({ title: "School updated!" });
      setEditTarget(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const removeTarget = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/recruiting-targets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "recruiting-targets"],
      });
      toast({ title: "School removed from your game plan." });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    },
  });

  const generateEmail = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/recruiting-targets/${id}/generate-email`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "recruiting-targets"],
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate email", description: error.message, variant: "destructive" });
    },
  });

  const logContact = useMutation({
    mutationFn: ({ targetId, data }: { targetId: number; data: Record<string, unknown> }) =>
      apiRequest("POST", `/api/recruiting-targets/${targetId}/contacts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "recruiting-targets"],
      });
      toast({ title: "Contact logged!" });
      setContactDialogTarget(null);
      setContactForm({ type: "email", notes: "", response: "none" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to log contact", description: error.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setFormData({
      collegeName: "",
      division: "D2",
      state: "",
      contactName: "",
      contactEmail: "",
      contactTitle: "",
      notes: "",
      followUpDate: "",
    });
  }

  function openEditDialog(target: RecruitingTarget) {
    setFormData({
      collegeName: target.collegeName,
      division: target.division,
      state: target.state || "",
      contactName: target.contactName || "",
      contactEmail: target.contactEmail || "",
      contactTitle: target.contactTitle || "",
      notes: target.notes || "",
      followUpDate: target.followUpDate
        ? new Date(target.followUpDate).toISOString().split("T")[0]
        : "",
    });
    setEditTarget(target);
  }

  function handleSubmitAdd() {
    if (!formData.collegeName.trim()) {
      toast({ title: "School name is required", variant: "destructive" });
      return;
    }
    const payload: Record<string, unknown> = {
      collegeName: formData.collegeName.trim(),
      division: formData.division,
      status: "researching",
      playerId,
    };
    if (formData.state) payload.state = formData.state;
    if (formData.contactName) payload.contactName = formData.contactName;
    if (formData.contactEmail) payload.contactEmail = formData.contactEmail;
    if (formData.contactTitle) payload.contactTitle = formData.contactTitle;
    if (formData.notes) payload.notes = formData.notes;
    if (formData.followUpDate) payload.followUpDate = new Date(formData.followUpDate).toISOString();
    createTarget.mutate(payload);
  }

  function handleSubmitEdit() {
    if (!editTarget) return;
    const payload: Record<string, unknown> = {
      collegeName: formData.collegeName.trim(),
      division: formData.division,
    };
    payload.state = formData.state || null;
    payload.contactName = formData.contactName || null;
    payload.contactEmail = formData.contactEmail || null;
    payload.contactTitle = formData.contactTitle || null;
    payload.notes = formData.notes || null;
    payload.followUpDate = formData.followUpDate
      ? new Date(formData.followUpDate).toISOString()
      : null;
    updateTarget.mutate({ id: editTarget.id, data: payload });
  }

  function handleStatusChange(target: RecruitingTarget, newStatus: string) {
    updateTarget.mutate({ id: target.id, data: { status: newStatus } });
  }

  function handleGenerateEmail(target: RecruitingTarget) {
    setEmailDialogTarget(target);
    if (!target.generatedEmail) {
      generateEmail.mutate(target.id);
    }
  }

  function handleCopyEmail() {
    const email =
      emailDialogTarget?.generatedEmail ||
      (generateEmail.data as { generatedEmail?: string })?.generatedEmail;
    if (email) {
      navigator.clipboard.writeText(email);
      toast({ title: "Email copied to clipboard!" });
    }
  }

  function handleLogContact() {
    if (!contactDialogTarget) return;
    logContact.mutate({
      targetId: contactDialogTarget.id,
      data: {
        targetId: contactDialogTarget.id,
        playerId,
        type: contactForm.type,
        notes: contactForm.notes || undefined,
        response: contactForm.response,
      },
    });
  }

  const contacted = targets.filter(
    (t) => t.status !== "researching" && t.status !== "passed"
  ).length;
  const responded = targets.filter(
    (t) => t.status === "responded" || t.status === "interested" || t.status === "offer" || t.status === "committed"
  ).length;
  const interestedOffers = targets.filter(
    (t) => t.status === "interested" || t.status === "offer"
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loading-recruiting-gameplan">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const currentEmailContent =
    emailDialogTarget?.generatedEmail ||
    (generateEmail.data as { generatedEmail?: string })?.generatedEmail;

  return (
    <div className="space-y-6" data-testid="page-recruiting-gameplan">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="stats-strip">
        <Card data-testid="stat-total">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <School className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{targets.length}</p>
              <p className="text-xs text-muted-foreground">Target Schools</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-contacted">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{contacted}</p>
              <p className="text-xs text-muted-foreground">Contacted</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-responded">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{responded}</p>
              <p className="text-xs text-muted-foreground">Responded</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-interested">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{interestedOffers}</p>
              <p className="text-xs text-muted-foreground">Interested / Offers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-display font-bold" data-testid="text-target-list-heading">
          Target Schools ({targets.length}/15)
        </h2>
        <Button
          onClick={() => {
            resetForm();
            setAddDialogOpen(true);
          }}
          disabled={targets.length >= 15}
          data-testid="button-add-school"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add School
        </Button>
      </div>

      {targets.length === 0 ? (
        <Card data-testid="empty-targets">
          <CardContent className="p-8 text-center">
            <School className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No target schools yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add up to 15 schools to start building your recruiting game plan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {targets.map((target) => {
            const statusInfo =
              RECRUITING_STATUSES[target.status as StatusKey] || RECRUITING_STATUSES.researching;
            const overdue = isOverdue(target.followUpDate);
            return (
              <Card
                key={target.id}
                data-testid={`card-target-${target.id}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="font-display font-bold text-lg"
                        data-testid={`text-school-name-${target.id}`}
                      >
                        {target.collegeName}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        data-testid={`badge-division-${target.id}`}
                      >
                        {target.division}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs gap-1"
                        data-testid={`badge-status-${target.id}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: statusInfo.color }}
                        />
                        {statusInfo.label}
                      </Badge>
                      {overdue && (
                        <span
                          className="flex items-center gap-1 text-xs text-amber-500 font-medium"
                          data-testid={`warning-overdue-${target.id}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Follow-up overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        value={target.status}
                        onValueChange={(val) => handleStatusChange(target, val)}
                      >
                        <SelectTrigger
                          className="w-[130px]"
                          data-testid={`select-status-${target.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(RECRUITING_STATUSES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>
                              {val.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                    {target.contactName && (
                      <span data-testid={`text-contact-${target.id}`}>
                        {target.contactName}
                        {target.contactTitle ? ` (${target.contactTitle})` : ""}
                      </span>
                    )}
                    {target.contactEmail && (
                      <span
                        className="flex items-center gap-1"
                        data-testid={`text-email-${target.id}`}
                      >
                        <Mail className="w-3 h-3" />
                        {target.contactEmail}
                      </span>
                    )}
                    {target.state && (
                      <span data-testid={`text-state-${target.id}`}>{target.state}</span>
                    )}
                    {target.lastContactDate && (
                      <span data-testid={`text-last-contact-${target.id}`}>
                        Last contact: {formatDate(target.lastContactDate)}
                      </span>
                    )}
                    {target.followUpDate && (
                      <span
                        className={overdue ? "text-amber-500 font-medium" : ""}
                        data-testid={`text-followup-${target.id}`}
                      >
                        Follow-up: {formatDate(target.followUpDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(target)}
                      data-testid={`button-edit-${target.id}`}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateEmail(target)}
                      data-testid={`button-generate-email-${target.id}`}
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      {target.generatedEmail ? "View Email" : "Generate Email"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContactForm({ type: "email", notes: "", response: "none" });
                        setContactDialogTarget(target);
                      }}
                      data-testid={`button-log-contact-${target.id}`}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Log Contact
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(target)}
                      className="text-destructive"
                      data-testid={`button-delete-${target.id}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent data-testid="dialog-add-school">
          <DialogHeader>
            <DialogTitle className="font-display">Add Target School</DialogTitle>
            <DialogDescription>
              Add a college program to your recruiting game plan. You can track up to 15 schools.
            </DialogDescription>
          </DialogHeader>
          <SchoolForm
            formData={formData}
            setFormData={setFormData}
            testIdPrefix="add"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              data-testid="button-cancel-add"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={createTarget.isPending}
              data-testid="button-submit-add"
            >
              {createTarget.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Add School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent data-testid="dialog-edit-school">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Target School</DialogTitle>
            <DialogDescription>
              Update information for {editTarget?.collegeName}.
            </DialogDescription>
          </DialogHeader>
          <SchoolForm
            formData={formData}
            setFormData={setFormData}
            testIdPrefix="edit"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateTarget.isPending}
              data-testid="button-submit-edit"
            >
              {updateTarget.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!emailDialogTarget}
        onOpenChange={(open) => !open && setEmailDialogTarget(null)}
      >
        <DialogContent className="max-w-lg" data-testid="dialog-email">
          <DialogHeader>
            <DialogTitle className="font-display">
              Intro Email - {emailDialogTarget?.collegeName}
            </DialogTitle>
            <DialogDescription>
              {emailDialogTarget?.generatedEmail
                ? "Here is your generated intro email. You can copy it and personalize before sending."
                : "Generating an AI-powered intro email for this program."}
            </DialogDescription>
          </DialogHeader>
          {generateEmail.isPending ? (
            <div
              className="flex flex-col items-center justify-center py-8 gap-3"
              data-testid="loading-email"
            >
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Generating your intro email...</p>
            </div>
          ) : currentEmailContent ? (
            <div className="space-y-3">
              <div
                className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-80 overflow-y-auto"
                data-testid="text-generated-email"
              >
                {currentEmailContent}
              </div>
              <Button
                variant="outline"
                onClick={handleCopyEmail}
                className="w-full"
                data-testid="button-copy-email"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy to Clipboard
              </Button>
            </div>
          ) : generateEmail.isError ? (
            <div className="text-center py-6" data-testid="error-email">
              <p className="text-sm text-destructive">
                Failed to generate email. Please try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => emailDialogTarget && generateEmail.mutate(emailDialogTarget.id)}
                data-testid="button-retry-email"
              >
                Retry
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!contactDialogTarget}
        onOpenChange={(open) => !open && setContactDialogTarget(null)}
      >
        <DialogContent data-testid="dialog-log-contact">
          <DialogHeader>
            <DialogTitle className="font-display">
              Log Contact - {contactDialogTarget?.collegeName}
            </DialogTitle>
            <DialogDescription>
              Record a contact attempt with this program.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contact Type</Label>
              <Select
                value={contactForm.type}
                onValueChange={(val) => setContactForm((prev) => ({ ...prev, type: val }))}
              >
                <SelectTrigger data-testid="select-contact-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={contactForm.notes}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="What was discussed?"
                data-testid="input-contact-notes"
              />
            </div>
            <div className="space-y-2">
              <Label>Response</Label>
              <Select
                value={contactForm.response}
                onValueChange={(val) =>
                  setContactForm((prev) => ({ ...prev, response: val }))
                }
              >
                <SelectTrigger data-testid="select-contact-response">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactDialogTarget(null)}
              data-testid="button-cancel-contact"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogContact}
              disabled={logContact.isPending}
              data-testid="button-submit-contact"
            >
              {logContact.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Log Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle className="font-display">Remove School</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deleteTarget?.collegeName} from your game plan? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && removeTarget.mutate(deleteTarget.id)}
              disabled={removeTarget.isPending}
              data-testid="button-confirm-delete"
            >
              {removeTarget.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SchoolForm({
  formData,
  setFormData,
  testIdPrefix,
}: {
  formData: {
    collegeName: string;
    division: string;
    state: string;
    contactName: string;
    contactEmail: string;
    contactTitle: string;
    notes: string;
    followUpDate: string;
  };
  setFormData: (fn: (prev: typeof formData) => typeof formData) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>School Name *</Label>
        <Input
          value={formData.collegeName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, collegeName: e.target.value }))
          }
          placeholder="e.g. University of Montana"
          data-testid={`input-${testIdPrefix}-college-name`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Division</Label>
          <Select
            value={formData.division}
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, division: val }))
            }
          >
            <SelectTrigger data-testid={`select-${testIdPrefix}-division`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIVISIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input
            value={formData.state}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, state: e.target.value }))
            }
            placeholder="e.g. MT"
            data-testid={`input-${testIdPrefix}-state`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Contact Name</Label>
          <Input
            value={formData.contactName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, contactName: e.target.value }))
            }
            placeholder="Coach Name"
            data-testid={`input-${testIdPrefix}-contact-name`}
          />
        </div>
        <div className="space-y-2">
          <Label>Contact Title</Label>
          <Input
            value={formData.contactTitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, contactTitle: e.target.value }))
            }
            placeholder="Head Coach"
            data-testid={`input-${testIdPrefix}-contact-title`}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Contact Email</Label>
        <Input
          type="email"
          value={formData.contactEmail}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
          }
          placeholder="coach@university.edu"
          data-testid={`input-${testIdPrefix}-contact-email`}
        />
      </div>
      <div className="space-y-2">
        <Label>Follow-up Date</Label>
        <Input
          type="date"
          value={formData.followUpDate}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, followUpDate: e.target.value }))
          }
          data-testid={`input-${testIdPrefix}-followup-date`}
        />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Any notes about this school..."
          data-testid={`input-${testIdPrefix}-notes`}
        />
      </div>
    </div>
  );
}
