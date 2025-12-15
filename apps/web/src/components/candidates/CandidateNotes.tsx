'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Edit,
  Lock,
  Loader2,
  Send,
} from 'lucide-react';
import { candidateNotesApi } from '@/lib/api';

interface CandidateNotesProps {
  candidateId: string;
}

export function CandidateNotes({ candidateId }: CandidateNotesProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: notes, isLoading } = useQuery({
    queryKey: ['candidate-notes', candidateId],
    queryFn: () => candidateNotesApi.getAll(candidateId),
  });

  const createMutation = useMutation({
    mutationFn: () => candidateNotesApi.create(candidateId, { content: newNote, isPrivate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] });
      setNewNote('');
      setIsPrivate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      candidateNotesApi.update(candidateId, noteId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] });
      setEditingNote(null);
      setEditContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => candidateNotesApi.delete(candidateId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: (noteId: string) => candidateNotesApi.pin(candidateId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: (noteId: string) => candidateNotesApi.unpin(candidateId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] });
    },
  });

  const noteList = notes?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      createMutation.mutate();
    }
  };

  const handleEdit = (noteId: string, content: string) => {
    setEditingNote(noteId);
    setEditContent(content);
  };

  const handleSaveEdit = (noteId: string) => {
    if (editContent.trim()) {
      updateMutation.mutate({ noteId, content: editContent });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary-500" />
        <h3 className="font-semibold text-neutral-900 dark:text-white">Notes</h3>
        <Badge variant="secondary">{noteList.length}</Badge>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="space-y-2">
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            placeholder="Add a note about this candidate..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-neutral-300"
              />
              <Lock className="h-3 w-3" />
              Private (only you can see)
            </label>
            <Button
              type="submit"
              size="sm"
              disabled={!newNote.trim() || createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              <Send className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>
        </div>
      </form>

      {/* Notes List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : noteList.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-500">No notes yet. Add the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {noteList.map((note: {
            id: string;
            content: string;
            isPrivate: boolean;
            isPinned: boolean;
            author: { id: string; firstName: string; lastName: string };
            createdAt: string;
            updatedAt: string;
          }) => (
            <div
              key={note.id}
              className={`p-3 rounded-lg border ${note.isPinned
                  ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                }`}
            >
              {editingNote === note.id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingNote(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(note.id)}
                      isLoading={updateMutation.isPending}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {note.author.firstName} {note.author.lastName}
                      </span>
                      {note.isPrivate && (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                      {note.isPinned && (
                        <Badge variant="warning">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => note.isPinned ? unpinMutation.mutate(note.id) : pinMutation.mutate(note.id)}
                      >
                        {note.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(note.id, note.content)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(note.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {new Date(note.createdAt).toLocaleDateString()} at{' '}
                    {new Date(note.createdAt).toLocaleTimeString()}
                    {note.updatedAt !== note.createdAt && ' (edited)'}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
