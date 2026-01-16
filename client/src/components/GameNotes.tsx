import { useState } from "react";
import { format } from "date-fns";
import { useGameNotes, useCreateGameNote, useUpdateGameNote, useDeleteGameNote, type GameNote } from "@/hooks/use-basketball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X, Check, MessageSquare, Eye, EyeOff, User, Clock } from "lucide-react";

const NOTE_TYPES = ["observation", "improvement", "praise", "strategy"] as const;
type NoteType = typeof NOTE_TYPES[number];

const NOTE_TYPE_COLORS: Record<NoteType, { bg: string; text: string; border: string }> = {
  observation: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  improvement: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  praise: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  strategy: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
};

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  observation: "Observation",
  improvement: "Improvement",
  praise: "Praise",
  strategy: "Strategy",
};

interface GameNotesProps {
  gameId: number;
  playerId: number;
}

export function GameNotes({ gameId, playerId }: GameNotesProps) {
  const { toast } = useToast();
  const { data: notes = [], isLoading } = useGameNotes(gameId);
  const createNote = useCreateGameNote();
  const updateNote = useUpdateGameNote();
  const deleteNote = useDeleteGameNote();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    content: "",
    noteType: "observation" as NoteType,
    isPrivate: true,
    authorName: "",
  });
  const [editFormData, setEditFormData] = useState({
    content: "",
    noteType: "observation" as NoteType,
    isPrivate: true,
  });

  const resetForm = () => {
    setFormData({ content: "", noteType: "observation", isPrivate: true, authorName: "" });
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.content.trim() || !formData.authorName.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await createNote.mutateAsync({
        gameId,
        note: {
          playerId,
          authorName: formData.authorName.trim(),
          content: formData.content.trim(),
          noteType: formData.noteType,
          isPrivate: formData.isPrivate,
        },
      });
      toast({ title: "Note added", description: "Your note has been saved" });
      resetForm();
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleUpdate = async (note: GameNote) => {
    try {
      await updateNote.mutateAsync({
        id: note.id,
        gameId: note.gameId,
        playerId: note.playerId,
        updates: {
          content: editFormData.content.trim(),
          noteType: editFormData.noteType,
          isPrivate: editFormData.isPrivate,
        },
      });
      toast({ title: "Note updated", description: "Your changes have been saved" });
      setEditingId(null);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async (note: GameNote) => {
    try {
      await deleteNote.mutateAsync({ id: note.id, gameId: note.gameId, playerId: note.playerId });
      toast({ title: "Note deleted", description: "The note has been removed" });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const startEditing = (note: GameNote) => {
    setEditingId(note.id);
    setEditFormData({
      content: note.content,
      noteType: note.noteType as NoteType,
      isPrivate: note.isPrivate,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Coach Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Coach Notes
          {notes.length > 0 && (
            <Badge variant="secondary" className="ml-2" data-testid="badge-notes-count">
              {notes.length}
            </Badge>
          )}
        </CardTitle>
        {!showAddForm && (
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            data-testid="button-add-note"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <Card className="border-dashed" data-testid="card-add-note-form">
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author-name">Coach Name</Label>
                <Input
                  id="author-name"
                  placeholder="Enter your name"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  data-testid="input-author-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-content">Note Content</Label>
                <Textarea
                  id="note-content"
                  placeholder="Write your observation, feedback, or strategy notes..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  data-testid="textarea-note-content"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="note-type">Note Type</Label>
                  <Select
                    value={formData.noteType}
                    onValueChange={(value) => setFormData({ ...formData, noteType: value as NoteType })}
                  >
                    <SelectTrigger id="note-type" data-testid="select-note-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map((type) => (
                        <SelectItem key={type} value={type} data-testid={`select-item-${type}`}>
                          {NOTE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch
                      id="is-private"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                      data-testid="switch-is-private"
                    />
                    <Label htmlFor="is-private" className="font-normal flex items-center gap-1">
                      {formData.isPrivate ? (
                        <>
                          <EyeOff className="w-4 h-4" /> Private
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" /> Public
                        </>
                      )}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  data-testid="button-cancel-add"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createNote.isPending}
                  data-testid="button-save-note"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {createNote.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {notes.length === 0 && !showAddForm ? (
          <div className="text-center text-muted-foreground py-8" data-testid="text-no-notes">
            No notes yet. Add your first coach note to track observations and feedback.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const typeColor = NOTE_TYPE_COLORS[note.noteType as NoteType] || NOTE_TYPE_COLORS.observation;
              const isEditing = editingId === note.id;

              return (
                <Card
                  key={note.id}
                  className={`${typeColor.border} border-l-4`}
                  data-testid={`card-note-${note.id}`}
                >
                  <CardContent className="pt-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editFormData.content}
                          onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                          rows={3}
                          data-testid={`textarea-edit-${note.id}`}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            value={editFormData.noteType}
                            onValueChange={(value) => setEditFormData({ ...editFormData, noteType: value as NoteType })}
                          >
                            <SelectTrigger data-testid={`select-edit-type-${note.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {NOTE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {NOTE_TYPE_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editFormData.isPrivate}
                              onCheckedChange={(checked) => setEditFormData({ ...editFormData, isPrivate: checked })}
                              data-testid={`switch-edit-private-${note.id}`}
                            />
                            <Label className="font-normal">
                              {editFormData.isPrivate ? "Private" : "Public"}
                            </Label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            data-testid={`button-cancel-edit-${note.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(note)}
                            disabled={updateNote.isPending}
                            data-testid={`button-save-edit-${note.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${typeColor.bg} ${typeColor.text} border-0`} data-testid={`badge-type-${note.id}`}>
                              {NOTE_TYPE_LABELS[note.noteType as NoteType]}
                            </Badge>
                            {note.isPrivate ? (
                              <Badge variant="outline" className="text-muted-foreground" data-testid={`badge-private-${note.id}`}>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Private
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground" data-testid={`badge-public-${note.id}`}>
                                <Eye className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(note)}
                              data-testid={`button-edit-${note.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(note)}
                              disabled={deleteNote.isPending}
                              data-testid={`button-delete-${note.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm whitespace-pre-wrap mb-3" data-testid={`text-content-${note.id}`}>
                          {note.content}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1" data-testid={`text-author-${note.id}`}>
                            <User className="w-3 h-3" />
                            {note.authorName}
                          </span>
                          <span className="flex items-center gap-1" data-testid={`text-timestamp-${note.id}`}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
