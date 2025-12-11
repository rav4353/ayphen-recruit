import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Input } from '../ui';
import { Plus, Tag } from 'lucide-react';
import { skillsApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface Skill {
    id: string;
    name: string;
    synonyms: string[];
    category: string;
}

export function SkillsSettings() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newSkill, setNewSkill] = useState({ name: '', synonyms: '', category: '' });

    const fetchSkills = async () => {
        try {
            const response = await skillsApi.getAll();
            setSkills(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch skills', error);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkill.name) return;

        setIsLoading(true);
        try {
            await skillsApi.create({
                name: newSkill.name,
                synonyms: newSkill.synonyms.split(',').map(s => s.trim()).filter(Boolean),
                category: newSkill.category,
            });
            toast.success('Skill added successfully');
            setNewSkill({ name: '', synonyms: '', category: '' });
            fetchSkills();
        } catch (error) {
            console.error('Failed to create skill', error);
            toast.error('Failed to create skill');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader
                    title="Skill Taxonomy"
                    description="Manage canonical skills and synonyms for normalization."
                />
                <div className="p-6 space-y-6">
                    <form onSubmit={handleCreate} className="flex gap-4 items-end p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-medium text-neutral-500">Skill Name</label>
                            <Input
                                placeholder="e.g. React"
                                value={newSkill.name}
                                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex-[2] space-y-1">
                            <label className="text-xs font-medium text-neutral-500">Synonyms (comma separated)</label>
                            <Input
                                placeholder="e.g. ReactJS, React.js"
                                value={newSkill.synonyms}
                                onChange={(e) => setNewSkill({ ...newSkill, synonyms: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-medium text-neutral-500">Category</label>
                            <Input
                                placeholder="e.g. Frontend"
                                value={newSkill.category}
                                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                            />
                        </div>
                        <Button type="submit" isLoading={isLoading} className="mb-[2px]">
                            <Plus size={18} className="mr-2" />
                            Add
                        </Button>
                    </form>

                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Synonyms</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {skills.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                                            No skills defined yet.
                                        </td>
                                    </tr>
                                ) : (
                                    skills.map((skill) => (
                                        <tr key={skill.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                                                {skill.name}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                <div className="flex flex-wrap gap-1">
                                                    {skill.synonyms.map((syn, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">
                                                            {syn}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {skill.category && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                                                        <Tag size={12} />
                                                        {skill.category}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
}
