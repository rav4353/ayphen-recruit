'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit,
  Users,
  Briefcase,
  Loader2,
  ChevronRight,
  ChevronDown,
  FolderTree,
} from 'lucide-react';
import { departmentsApi } from '@/lib/api';

interface Department {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  parent?: Department;
  children?: Department[];
  _count?: { users: number; jobs: number };
}

export function DepartmentsList() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', viewMode === 'tree'],
    queryFn: () => departmentsApi.getAll(viewMode === 'tree'),
  });

  const { data: stats } = useQuery({
    queryKey: ['departments-stats'],
    queryFn: () => departmentsApi.getStats(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });

  const deptList: Department[] = departments?.data || [];
  const deptStats = stats?.data;

  const filteredDepts = deptList.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Departments</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage organizational structure</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      {deptStats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Total Departments</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{deptStats.totalDepartments}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Root Departments</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{deptStats.rootDepartments}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Total Users</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{deptStats.totalUsers}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Active Jobs</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{deptStats.totalJobs}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          <button
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'tree' ? 'bg-white dark:bg-neutral-700 shadow' : ''}`}
            onClick={() => setViewMode('tree')}
          >
            <FolderTree className="h-4 w-4 inline mr-1" />
            Tree
          </button>
        </div>
      </div>

      {/* Departments */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : filteredDepts.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Departments Found
          </h3>
          <p className="text-neutral-500 mb-4">
            Create your first department to organize your team.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </Card>
      ) : viewMode === 'tree' ? (
        <Card className="p-4">
          <DepartmentTree
            departments={filteredDepts}
            onEdit={setEditingDept}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.map((dept) => (
            <Card key={dept.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{dept.name}</h3>
                    {dept.code && <p className="text-xs text-neutral-500">{dept.code}</p>}
                  </div>
                </div>
              </div>

              {dept.parent && (
                <p className="text-xs text-neutral-500 mb-2">
                  Parent: <span className="font-medium">{dept.parent.name}</span>
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {dept._count?.users || 0} users
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {dept._count?.jobs || 0} jobs
                </span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <Button variant="ghost" size="sm" onClick={() => setEditingDept(dept)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(dept.id)}
                  disabled={(dept._count?.users || 0) > 0 || (dept._count?.jobs || 0) > 0}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <DepartmentModal
        isOpen={showCreateModal || !!editingDept}
        onClose={() => {
          setShowCreateModal(false);
          setEditingDept(null);
        }}
        department={editingDept}
        departments={deptList}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingDept(null);
          queryClient.invalidateQueries({ queryKey: ['departments'] });
        }}
      />
    </div>
  );
}

function DepartmentTree({
  departments,
  onEdit,
  onDelete,
  level = 0,
}: {
  departments: Department[];
  onEdit: (d: Department) => void;
  onDelete: (id: string) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  return (
    <div className="space-y-1">
      {departments.map((dept) => (
        <div key={dept.id}>
          <div
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            style={{ paddingLeft: `${level * 24 + 8}px` }}
          >
            {dept.children && dept.children.length > 0 ? (
              <button onClick={() => toggleExpand(dept.id)} className="p-0.5">
                {expanded.has(dept.id) ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <Building2 className="h-4 w-4 text-indigo-500" />
            <span className="font-medium text-neutral-900 dark:text-white flex-1">{dept.name}</span>
            {dept.code && <Badge variant="outline" className="text-xs">{dept.code}</Badge>}
            <span className="text-xs text-neutral-500">{dept._count?.users || 0} users</span>
            <Button variant="ghost" size="sm" onClick={() => onEdit(dept)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(dept.id)}>
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
          {dept.children && dept.children.length > 0 && expanded.has(dept.id) && (
            <DepartmentTree
              departments={dept.children}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function DepartmentModal({
  isOpen,
  onClose,
  department,
  departments,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  departments: Department[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    parentId: department?.parentId || '',
  });

  const createMutation = useMutation({
    mutationFn: () => departmentsApi.create({
      name: formData.name,
      code: formData.code || undefined,
      parentId: formData.parentId || undefined,
    }),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: () => departmentsApi.update(department!.id, {
      name: formData.name,
      code: formData.code || undefined,
      parentId: formData.parentId || undefined,
    }),
    onSuccess,
  });

  const handleSubmit = () => {
    if (department) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  // Filter out current department and its children from parent options
  const parentOptions = departments.filter(d => d.id !== department?.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={department ? 'Edit Department' : 'Add Department'}>
      <div className="space-y-4">
        <Input
          label="Department Name"
          placeholder="e.g., Engineering"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Department Code (optional)"
          placeholder="e.g., ENG"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Parent Department (optional)
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          >
            <option value="">None (Root Department)</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            disabled={!formData.name}
          >
            {department ? 'Update' : 'Create'} Department
          </Button>
        </div>
      </div>
    </Modal>
  );
}
