import { useState, useEffect } from 'react';

import toast from 'react-hot-toast';
import { Card, Button, Input, Modal, ConfirmationModal } from '../../components/ui';
import { Search, Plus, ExternalLink, Users, Linkedin, Globe, Database, Upload, RefreshCw, Star, MapPin, Briefcase, Mail, Trash2, UserPlus, Send, CheckCircle, Clock, MessageSquare, Github } from 'lucide-react';
import { sourcingApi, jobsApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

interface SourcedCandidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    skills: string[];
    experience?: string;
    profileUrl?: string;
    linkedinUrl?: string;
    resumeUrl?: string;
    summary?: string;
    source: string;
    sourceDetails?: string;
    status: string;
    rating?: number;
    notes?: string;
    targetJobId?: string;
    outreachHistory: OutreachRecord[];
    createdAt: string;
    updatedAt: string;
}

interface OutreachRecord {
    id: string;
    type: string;
    subject?: string;
    message?: string;
    notes?: string;
    sentAt: string;
    sentBy: string;
}

interface Job {
    id: string;
    title: string;
    department?: { name: string };
    location?: { name: string };
}

interface Stats {
    total: number;
    statusCounts: Record<string, number>;
    sourceCounts: Record<string, number>;
    totalOutreach: number;
    responseRate: string;
    conversionRate: string;
}

const SOURCING_CHANNELS = [
    { id: 'LINKEDIN', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', connected: true },
    { id: 'INDEED', name: 'Indeed', icon: Globe, color: 'text-purple-600', connected: true },
    { id: 'GLASSDOOR', name: 'Glassdoor', icon: Globe, color: 'text-green-600', connected: true },
    { id: 'INTERNAL_DB', name: 'Internal Database', icon: Database, color: 'text-orange-600', connected: true },
    { id: 'GITHUB', name: 'GitHub', icon: Github, color: 'text-gray-800 dark:text-gray-200', connected: true },
    { id: 'PORTFOLIO', name: 'Portfolio', icon: Globe, color: 'text-pink-600', connected: true },
];

export function SourcingPage() {
    const user = useAuthStore((state) => state.user);
    const tenantId = user?.tenantId || '';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<SourcedCandidate[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPipelineModal, setShowPipelineModal] = useState(false);
    const [showOutreachModal, setShowOutreachModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<SourcedCandidate | null>(null);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [outreachSubject, setOutreachSubject] = useState('');
    const [outreachMessage, setOutreachMessage] = useState('');
    const [deleteCandidate, setDeleteCandidate] = useState<SourcedCandidate | null>(null);

    // New candidate form
    const [newCandidate, setNewCandidate] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        currentTitle: '',
        currentCompany: '',
        location: '',
        skills: '',
        experience: '',
        linkedinUrl: '',
        source: 'OTHER',
        notes: '',
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [candidatesRes, statsRes, jobsRes] = await Promise.all([
                sourcingApi.getAll({
                    search: searchQuery || undefined,
                    source: selectedSource || undefined,
                    status: selectedStatus || undefined,
                    take: 100,
                }),
                sourcingApi.getStats(),
                jobsApi.getAll(tenantId, { status: 'OPEN' }),
            ]);

            const candidatesPayload = candidatesRes?.data;
            const candidateList = Array.isArray(candidatesPayload)
                ? candidatesPayload
                : Array.isArray(candidatesPayload?.data)
                    ? candidatesPayload.data
                    : Array.isArray(candidatesPayload?.data?.data)
                        ? candidatesPayload.data.data
                        : [];

            setCandidates(candidateList);
            setStats(statsRes.data);

            const jobsPayload = jobsRes?.data;
            const jobList = Array.isArray(jobsPayload)
                ? jobsPayload
                : Array.isArray(jobsPayload?.data)
                    ? jobsPayload.data
                    : Array.isArray(jobsPayload?.data?.data)
                        ? jobsPayload.data.data
                        : [];

            setJobs(jobList);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load sourcing data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchQuery, selectedSource, selectedStatus]);

    const handleAddCandidate = async () => {
        try {
            await sourcingApi.create({
                ...newCandidate,
                skills: newCandidate.skills.split(',').map(s => s.trim()).filter(Boolean),
            });
            toast.success('Candidate added successfully');
            setShowAddModal(false);
            setNewCandidate({
                firstName: '', lastName: '', email: '', phone: '', currentTitle: '',
                currentCompany: '', location: '', skills: '', experience: '',
                linkedinUrl: '', source: 'OTHER', notes: '',
            });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add candidate');
        }
    };

    const handleAddToPipeline = async () => {
        if (!selectedCandidate || !selectedJobId) return;
        try {
            await sourcingApi.addToPipeline({
                sourcedCandidateId: selectedCandidate.id,
                jobId: selectedJobId,
            });
            toast.success(`${selectedCandidate.firstName} added to pipeline`);
            setShowPipelineModal(false);
            setSelectedCandidate(null);
            setSelectedJobId('');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add to pipeline');
        }
    };

    const handleSendOutreach = async () => {
        if (!selectedCandidate) return;
        try {
            await sourcingApi.recordOutreach({
                sourcedCandidateId: selectedCandidate.id,
                type: 'EMAIL',
                subject: outreachSubject,
                message: outreachMessage,
            });
            toast.success('Outreach recorded');
            setShowOutreachModal(false);
            setSelectedCandidate(null);
            setOutreachSubject('');
            setOutreachMessage('');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to record outreach');
        }
    };

    const handleDeleteClick = (candidate: SourcedCandidate) => {
        setDeleteCandidate(candidate);
    };

    const handleConfirmDelete = async () => {
        if (!deleteCandidate) return;
        try {
            await sourcingApi.delete(deleteCandidate.id);
            toast.success('Candidate deleted');
            setDeleteCandidate(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete candidate');
            setDeleteCandidate(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'CONTACTED': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'RESPONDED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'INTERESTED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'NOT_INTERESTED': return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
            case 'ADDED_TO_PIPELINE': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Candidate Sourcing</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Find and reach out to potential candidates</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Upload size={16} />
                        Import
                    </Button>
                    <Button className="gap-2" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} />
                        Add Candidate
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
                                <p className="text-xs text-neutral-500">Total Sourced</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalOutreach}</p>
                                <p className="text-xs text-neutral-500">Total Outreach</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.responseRate}</p>
                                <p className="text-xs text-neutral-500">Response Rate</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.conversionRate}</p>
                                <p className="text-xs text-neutral-500">Conversion Rate</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Sourcing Channels */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {SOURCING_CHANNELS.map((channel) => (
                    <Card
                        key={channel.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedSource === channel.id ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setSelectedSource(selectedSource === channel.id ? null : channel.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 ${channel.color}`}>
                                <channel.icon size={18} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-medium text-sm text-neutral-900 dark:text-white truncate">{channel.name}</h3>
                                <p className="text-xs text-neutral-500">
                                    {stats?.sourceCounts?.[channel.id] || 0} candidates
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, title, or skills..."
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={selectedStatus || ''}
                        onChange={(e) => setSelectedStatus(e.target.value || null)}
                        className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                    >
                        <option value="">All Statuses</option>
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="RESPONDED">Responded</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                        <option value="ADDED_TO_PIPELINE">Added to Pipeline</option>
                    </select>
                    <Button variant="outline" className="gap-2" onClick={fetchData}>
                        <RefreshCw size={16} />
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        Sourced Candidates ({candidates.length})
                    </h2>
                </div>

                {isLoading ? (
                    <Card className="p-12">
                        <div className="flex justify-center">
                            <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
                        </div>
                    </Card>
                ) : candidates.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <Users className="mx-auto h-12 w-12 text-neutral-400" />
                            <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">No candidates found</h3>
                            <p className="mt-1 text-sm text-neutral-500">Add sourced candidates or adjust your filters.</p>
                            <Button className="mt-4 gap-2" onClick={() => setShowAddModal(true)}>
                                <Plus size={16} />
                                Add Candidate
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {candidates.map((candidate) => (
                            <Card key={candidate.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shrink-0">
                                            {candidate.firstName[0]}{candidate.lastName[0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-neutral-900 dark:text-white">
                                                    {candidate.firstName} {candidate.lastName}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                                                    {candidate.status.replace(/_/g, ' ')}
                                                </span>
                                                {candidate.outreachHistory.length > 0 && (
                                                    <span className="text-xs text-neutral-400">
                                                        {candidate.outreachHistory.length} outreach
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500 flex-wrap">
                                                {candidate.currentTitle && (
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase size={14} />
                                                        {candidate.currentTitle}
                                                        {candidate.currentCompany && ` at ${candidate.currentCompany}`}
                                                    </span>
                                                )}
                                                {candidate.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={14} />
                                                        {candidate.location}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                {candidate.skills?.slice(0, 4).map((skill) => (
                                                    <span key={skill} className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {candidate.skills?.length > 4 && (
                                                    <span className="text-xs text-neutral-400">+{candidate.skills.length - 4} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={14}
                                                    className={star <= (candidate.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            {candidate.linkedinUrl && (
                                                <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                            <button
                                                className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                                                onClick={() => { setSelectedCandidate(candidate); setShowOutreachModal(true); }}
                                            >
                                                <Mail size={16} />
                                            </button>
                                            <button
                                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                onClick={() => handleDeleteClick(candidate)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {candidate.status !== 'ADDED_TO_PIPELINE' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { setSelectedCandidate(candidate); setShowPipelineModal(true); }}
                                                >
                                                    <UserPlus size={14} className="mr-1" />
                                                    Add to Pipeline
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Candidate Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Sourced Candidate">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name *</label>
                            <Input
                                value={newCandidate.firstName}
                                onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name *</label>
                            <Input
                                value={newCandidate.lastName}
                                onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                                placeholder="Doe"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <Input
                            type="email"
                            value={newCandidate.email}
                            onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Current Title</label>
                            <Input
                                value={newCandidate.currentTitle}
                                onChange={(e) => setNewCandidate({ ...newCandidate, currentTitle: e.target.value })}
                                placeholder="Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Company</label>
                            <Input
                                value={newCandidate.currentCompany}
                                onChange={(e) => setNewCandidate({ ...newCandidate, currentCompany: e.target.value })}
                                placeholder="Acme Inc"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <Input
                                value={newCandidate.location}
                                onChange={(e) => setNewCandidate({ ...newCandidate, location: e.target.value })}
                                placeholder="San Francisco, CA"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Source</label>
                            <select
                                value={newCandidate.source}
                                onChange={(e) => setNewCandidate({ ...newCandidate, source: e.target.value })}
                                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                            >
                                {SOURCING_CHANNELS.map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                                ))}
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
                        <Input
                            value={newCandidate.skills}
                            onChange={(e) => setNewCandidate({ ...newCandidate, skills: e.target.value })}
                            placeholder="React, Node.js, TypeScript"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                        <Input
                            value={newCandidate.linkedinUrl}
                            onChange={(e) => setNewCandidate({ ...newCandidate, linkedinUrl: e.target.value })}
                            placeholder="https://linkedin.com/in/johndoe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                            value={newCandidate.notes}
                            onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 resize-none"
                            rows={3}
                            placeholder="Additional notes..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button
                            onClick={handleAddCandidate}
                            disabled={!newCandidate.firstName || !newCandidate.lastName || !newCandidate.email}
                        >
                            Add Candidate
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add to Pipeline Modal */}
            <Modal isOpen={showPipelineModal} onClose={() => setShowPipelineModal(false)} title="Add to Pipeline">
                <div className="space-y-4">
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Select a job to add <strong>{selectedCandidate?.firstName} {selectedCandidate?.lastName}</strong> to:
                    </p>
                    <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                    >
                        <option value="">Select a job...</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowPipelineModal(false)}>Cancel</Button>
                        <Button onClick={handleAddToPipeline} disabled={!selectedJobId}>
                            Add to Pipeline
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Outreach Modal */}
            <Modal isOpen={showOutreachModal} onClose={() => setShowOutreachModal(false)} title="Record Outreach">
                <div className="space-y-4">
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Record outreach to <strong>{selectedCandidate?.firstName} {selectedCandidate?.lastName}</strong>
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <Input
                            value={outreachSubject}
                            onChange={(e) => setOutreachSubject(e.target.value)}
                            placeholder="Exciting opportunity at..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Message</label>
                        <textarea
                            value={outreachMessage}
                            onChange={(e) => setOutreachMessage(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 resize-none"
                            rows={5}
                            placeholder="Hi {{firstName}}, I came across your profile..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowOutreachModal(false)}>Cancel</Button>
                        <Button onClick={handleSendOutreach} disabled={!outreachSubject || !outreachMessage}>
                            <Send size={14} className="mr-1" />
                            Record Outreach
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteCandidate}
                onCancel={() => setDeleteCandidate(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Candidate"
                message={`Are you sure you want to delete ${deleteCandidate?.firstName} ${deleteCandidate?.lastName}? This action cannot be undone.`}
                variant="danger"
                confirmLabel="Delete"
            />
        </div>
    );
}
