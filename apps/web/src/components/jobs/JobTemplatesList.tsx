'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit,
  Copy,
  Loader2,
  Zap,
} from 'lucide-react';
import { jobTemplatesApi } from '@/lib/api';

interface JobTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  employmentType: string;
  skills: string[];
  isActive: boolean;
  createdAt: string;
}

export function JobTemplatesList() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JobTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['job-templates'],
    queryFn: () => jobTemplatesApi.getAll(true),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobTemplatesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-templates'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => jobTemplatesApi.duplicate(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-templates'] }),
  });

  const createJobMutation = useMutation({
    mutationFn: (id: string) => jobTemplatesApi.createJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const templateList: JobTemplate[] = templates?.data || [];
  const filteredTemplates = templateList.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDuplicate = (template: JobTemplate) => {
    duplicateMutation.mutate({ id: template.id, name: `${template.name} (Copy)` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Job Templates</h1>
          <p className="text-sm text-neutral-500 mt-1">Create reusable templates for faster job posting</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Templates Found
          </h3>
          <p className="text-neutral-500 mb-4">
            Create your first job template to speed up hiring.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{template.name}</h3>
                    <p className="text-xs text-neutral-500">{template.title}</p>
                  </div>
                </div>
                <Badge variant={template.isActive ? 'success' : 'secondary'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                {template.description?.substring(0, 100)}...
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {template.skills?.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                ))}
                {template.skills?.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{template.skills.length - 3}</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
                <Badge variant="secondary" className="text-xs">
                  {template.employmentType?.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => createJobMutation.mutate(template.id)}
                  isLoading={createJobMutation.isPending}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Use
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(template)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(template.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <JobTemplateModal
        isOpen={showCreateModal || !!editingTemplate}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
          queryClient.invalidateQueries({ queryKey: ['job-templates'] });
        }}
      />
    </div>
  );
}

function JobTemplateModal({
  isOpen,
  onClose,
  template,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: JobTemplate | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    title: template?.title || '',
    description: template?.description || '',
    requirements: template?.requirements || '',
    responsibilities: template?.responsibilities || '',
    benefits: template?.benefits || '',
    employmentType: template?.employmentType || 'FULL_TIME',
    skills: template?.skills?.join(', ') || '',
  });

  const createMutation = useMutation({
    mutationFn: () => jobTemplatesApi.create({
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
    }),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: () => jobTemplatesApi.update(template!.id, {
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
    }),
    onSuccess,
  });

  const handleSubmit = () => {
    if (template) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Edit Job Template' : 'Create Job Template'}
      className="max-w-2xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          label="Template Name"
          placeholder="e.g., Senior Engineer Template"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Job Title"
          placeholder="e.g., Senior Software Engineer"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
            rows={4}
            placeholder="Job description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Requirements
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
            rows={3}
            placeholder="Job requirements..."
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Responsibilities
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
            rows={3}
            placeholder="Job responsibilities..."
            value={formData.responsibilities}
            onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Employment Type
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
            value={formData.employmentType}
            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>

        <Input
          label="Skills (comma-separated)"
          placeholder="JavaScript, React, TypeScript"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            disabled={!formData.name || !formData.title || !formData.description}
          >
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </div>
    </Modal>
  );
}
