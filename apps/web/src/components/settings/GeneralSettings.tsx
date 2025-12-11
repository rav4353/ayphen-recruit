import { useState } from 'react';
import { Card, CardHeader, Button, Input, Badge } from '../ui';
import { Plus, Trash2, Tag, Globe } from 'lucide-react';

export function GeneralSettings() {
    const [orgProfile, setOrgProfile] = useState({
        name: 'Ayphen',
        website: 'https://ayphen.com',
        industry: 'Technology',
        logo: null,
    });

    const [localization, setLocalization] = useState({
        timezone: 'UTC',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        language: 'en',
    });

    const [locations] = useState([
        { id: 1, country: 'USA', city: 'San Francisco', address: '123 Market St' },
        { id: 2, country: 'India', city: 'Bangalore', address: '456 Tech Park' },
    ]);

    const [departments] = useState([
        { id: 1, name: 'Engineering', head: 'John Doe' },
        { id: 2, name: 'Sales', head: 'Jane Smith' },
    ]);

    const [tags] = useState(['Engineer', 'Senior', 'Remote', 'Urgent']);
    const [sources] = useState(['LinkedIn', 'Agency', 'Referral', 'Career Page']);

    return (
        <div className="space-y-6">
            {/* Organization Profile */}
            <Card>
                <CardHeader title="Organization Profile" description="Manage your company details." />
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Organization Name</label>
                            <Input value={orgProfile.name} onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Website</label>
                            <Input value={orgProfile.website} onChange={(e) => setOrgProfile({ ...orgProfile, website: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Industry</label>
                            <Input value={orgProfile.industry} onChange={(e) => setOrgProfile({ ...orgProfile, industry: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400">
                                    Logo
                                </div>
                                <Button variant="secondary" size="sm">Upload</Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button>Save Changes</Button>
                    </div>
                </div>
            </Card>

            {/* Localization */}
            <Card>
                <CardHeader title="Localization" description="Set your timezone, currency, and date format." />
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Timezone</label>
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={localization.timezone}
                                onChange={(e) => setLocalization({ ...localization, timezone: e.target.value })}
                            >
                                <option value="UTC">UTC</option>
                                <option value="EST">EST</option>
                                <option value="PST">PST</option>
                                <option value="IST">IST</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Currency</label>
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={localization.currency}
                                onChange={(e) => setLocalization({ ...localization, currency: e.target.value })}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="INR">INR (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date Format</label>
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={localization.dateFormat}
                                onChange={(e) => setLocalization({ ...localization, dateFormat: e.target.value })}
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Language</label>
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={localization.language}
                                onChange={(e) => setLocalization({ ...localization, language: e.target.value })}
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button>Save Changes</Button>
                    </div>
                </div>
            </Card>

            {/* Locations */}
            <Card>
                <CardHeader title="Locations" description="Manage your office locations." />
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        {locations.map((loc) => (
                            <div key={loc.id} className="flex items-center gap-4 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <span className="font-medium text-neutral-900 dark:text-white">{loc.city}</span>
                                    <span className="text-neutral-500">{loc.country}</span>
                                    <span className="text-neutral-500 truncate">{loc.address}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" className="w-full gap-2">
                        <Plus size={16} /> Add Location
                    </Button>
                </div>
            </Card>

            {/* Departments */}
            <Card>
                <CardHeader title="Departments" description="Manage your organization's departments." />
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        {departments.map((dept) => (
                            <div key={dept.id} className="flex items-center gap-4 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <span className="font-medium text-neutral-900 dark:text-white">{dept.name}</span>
                                    <span className="text-neutral-500">Head: {dept.head}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" className="w-full gap-2">
                        <Plus size={16} /> Add Department
                    </Button>
                </div>
            </Card>

            {/* Attributes */}
            <Card>
                <CardHeader title="Attributes" description="Manage candidate tags and application sources." />
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Candidate Tags</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-2">
                                    <Tag size={12} className="text-neutral-500" />
                                    {tag}
                                    <button className="hover:text-red-500 ml-1"><Trash2 size={12} /></button>
                                </Badge>
                            ))}
                            <Button variant="secondary" size="sm" className="h-7"><Plus size={12} /> Add</Button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Sources</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {sources.map(source => (
                                <div key={source} className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Globe size={16} className="text-neutral-400" />
                                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{source}</span>
                                    </div>
                                    <button className="text-neutral-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <Button variant="secondary" className="h-full min-h-[46px] border-dashed"><Plus size={16} /> Add Source</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
