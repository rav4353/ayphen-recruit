import { useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { Search, Filter, Plus, ExternalLink, Users, Linkedin, Globe, Database, Upload, RefreshCw, Star, MapPin, Briefcase, Mail } from 'lucide-react';
interface SourcedCandidate {
    id: string;
    name: string;
    email: string;
    title: string;
    company: string;
    location: string;
    source: string;
    skills: string[];
    experience: string;
    profileUrl?: string;
    rating: number;
    status: 'new' | 'contacted' | 'responded' | 'not_interested';
}

const MOCK_CANDIDATES: SourcedCandidate[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        source: 'LinkedIn',
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        experience: '8 years',
        profileUrl: 'https://linkedin.com/in/sarahj',
        rating: 4,
        status: 'new',
    },
    {
        id: '2',
        name: 'Michael Chen',
        email: 'mchen@example.com',
        title: 'Product Manager',
        company: 'StartupXYZ',
        location: 'New York, NY',
        source: 'Indeed',
        skills: ['Product Strategy', 'Agile', 'Data Analysis'],
        experience: '5 years',
        rating: 5,
        status: 'contacted',
    },
    {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.r@example.com',
        title: 'UX Designer',
        company: 'DesignHub',
        location: 'Austin, TX',
        source: 'Portfolio',
        skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
        experience: '6 years',
        profileUrl: 'https://dribbble.com/emilyr',
        rating: 4,
        status: 'responded',
    },
];

const SOURCING_CHANNELS = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', connected: true },
    { id: 'indeed', name: 'Indeed', icon: Globe, color: 'text-purple-600', connected: true },
    { id: 'glassdoor', name: 'Glassdoor', icon: Globe, color: 'text-green-600', connected: false },
    { id: 'internal', name: 'Internal Database', icon: Database, color: 'text-orange-600', connected: true },
];

export function SourcingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [candidates] = useState<SourcedCandidate[]>(MOCK_CANDIDATES);

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = !searchQuery || 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSource = !selectedSource || c.source.toLowerCase() === selectedSource.toLowerCase();
        return matchesSearch && matchesSource;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'contacted': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'responded': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'not_interested': return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
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
                        Import Candidates
                    </Button>
                    <Button className="gap-2">
                        <Plus size={16} />
                        Add Candidate
                    </Button>
                </div>
            </div>

            {/* Sourcing Channels */}
            <div className="grid grid-cols-4 gap-4">
                {SOURCING_CHANNELS.map((channel) => (
                    <Card key={channel.id} className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedSource === channel.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedSource(selectedSource === channel.id ? null : channel.id)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 ${channel.color}`}>
                                    <channel.icon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">{channel.name}</h3>
                                    <p className="text-xs text-neutral-500">
                                        {channel.connected ? (
                                            <span className="text-green-600">Connected</span>
                                        ) : (
                                            <span className="text-neutral-400">Not connected</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            {channel.connected && (
                                <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                    <RefreshCw size={14} />
                                </button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, title, or skills..."
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter size={16} />
                        Filters
                    </Button>
                </div>
            </Card>

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        Sourced Candidates ({filteredCandidates.length})
                    </h2>
                </div>

                {filteredCandidates.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <Users className="mx-auto h-12 w-12 text-neutral-400" />
                            <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">No candidates found</h3>
                            <p className="mt-1 text-sm text-neutral-500">Try adjusting your search or connect more sourcing channels.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredCandidates.map((candidate) => (
                            <Card key={candidate.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                            {candidate.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-neutral-900 dark:text-white">{candidate.name}</h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                                                    {candidate.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase size={14} />
                                                    {candidate.title} at {candidate.company}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {candidate.location}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                {candidate.skills.slice(0, 4).map((skill) => (
                                                    <span key={skill} className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {candidate.skills.length > 4 && (
                                                    <span className="text-xs text-neutral-400">+{candidate.skills.length - 4} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={14}
                                                    className={star <= candidate.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            {candidate.profileUrl && (
                                                <a href={candidate.profileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                            <button className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
                                                <Mail size={16} />
                                            </button>
                                            <Button size="sm" variant="outline">
                                                Add to Pipeline
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
