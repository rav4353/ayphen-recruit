import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../ui';
import { Plus, Trash2 } from 'lucide-react';
import { usersApi } from '../../lib/api';
import toast from 'react-hot-toast';

export function VendorSettings() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        vendorId: '',
        role: 'VENDOR'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchVendors = async () => {
        try {
            // Fetch users with role VENDOR
            // Note: API might need to support filtering by role
            const response = await usersApi.getAll({ role: 'VENDOR' });
            // If backend doesn't support role filter yet, filter client side
            const allUsers = response.data.data || [];
            const vendorUsers = allUsers.filter((u: any) => u.role === 'VENDOR');
            setVendors(vendorUsers);
        } catch (error) {
            console.error('Failed to fetch vendors', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await usersApi.create({
                ...formData,
                employeeId: formData.vendorId
            });
            toast.success('Vendor invited successfully');
            setIsModalOpen(false);
            setFormData({ firstName: '', lastName: '', email: '', vendorId: '', role: 'VENDOR' });
            fetchVendors();
        } catch (error: any) {
            console.error('Failed to invite vendor', error);
            const status = error.response?.status;
            const msg = error.response?.data?.message;

            if (status === 409 && typeof msg === 'string' && (msg.toLowerCase().includes('vendor id') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('employee id'))) {
                setErrors({ vendorId: msg });
            } else if (status === 400 && Array.isArray(msg)) {
                const newErrors: Record<string, string> = {};
                msg.forEach((err: string) => {
                    const lowercaseErr = err.toLowerCase();
                    if (lowercaseErr.includes('email')) newErrors.email = err;
                    else if (lowercaseErr.includes('first name') || lowercaseErr.includes('firstname')) newErrors.firstName = err;
                    else if (lowercaseErr.includes('last name') || lowercaseErr.includes('lastname')) newErrors.lastName = err;
                    else if (lowercaseErr.includes('vendor id') || lowercaseErr.includes('vendorid') || lowercaseErr.includes('employee id') || lowercaseErr.includes('employeeid')) newErrors.vendorId = err;
                });
                setErrors(newErrors);
            } else {
                toast.error(typeof msg === 'string' ? msg : 'Failed to invite vendor');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Vendor Management</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Manage external recruiting agencies and vendors.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={16} /> Invite Vendor
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                                <th className="px-6 py-3 font-medium text-neutral-500">Name</th>
                                <th className="px-6 py-3 font-medium text-neutral-500">Email</th>
                                <th className="px-6 py-3 font-medium text-neutral-500">Status</th>
                                <th className="px-6 py-3 font-medium text-neutral-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center">Loading...</td>
                                </tr>
                            ) : vendors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                        No vendors found. Invite one to get started.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                            {vendor.firstName} {vendor.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-500">
                                            {vendor.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                }`}>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invite Vendor">
                <form onSubmit={handleInvite} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">First Name</label>
                            <Input
                                required
                                value={formData.firstName}
                                onChange={(e) => {
                                    setFormData({ ...formData, firstName: e.target.value });
                                    if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                                }}
                                error={errors.firstName}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name</label>
                            <Input
                                required
                                value={formData.lastName}
                                onChange={(e) => {
                                    setFormData({ ...formData, lastName: e.target.value });
                                    if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                                }}
                                error={errors.lastName}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vendor ID / Employee ID</label>
                        <Input
                            required
                            value={formData.vendorId}
                            onChange={(e) => {
                                setFormData({ ...formData, vendorId: e.target.value });
                                if (errors.vendorId) setErrors(prev => ({ ...prev, vendorId: '' }));
                            }}
                            placeholder="e.g. VEND001"
                            error={errors.vendorId}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            placeholder="agent@agency.com"
                            error={errors.email}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmitting}>Send Invitation</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
