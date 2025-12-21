import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Mail, Key, CreditCard } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { superAdminTenantsApi } from '../../lib/superAdminApi';
import toast from 'react-hot-toast';

export function CreateTenantPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerEmail: '',
    ownerFirstName: '',
    ownerLastName: '',
    plan: 'STARTER',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.ownerEmail || !formData.ownerFirstName || !formData.ownerLastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.ownerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating organization...');

    try {
      await superAdminTenantsApi.create(formData);
      toast.success('Organization created successfully!', { id: loadingToast });
      navigate('/super-admin/tenants');
    } catch (error: any) {
      console.error('Failed to create tenant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create organization';
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/super-admin/tenants')}
          className="text-neutral-600 dark:text-neutral-400"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Create New Organization</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Add a new tenant organization to the platform
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
        <div className="p-6 space-y-6">
          {/* Organization Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold">
              <Building2 size={20} />
              <h2>Organization Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Organization Name"
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">The full name of the organization</p>
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Slug"
                  placeholder="acme-corp"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  required
                  leftIcon={<Key size={16} />}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Unique identifier (lowercase, no spaces). URL: <span className="font-mono text-blue-600">/{formData.slug || 'slug'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Owner Details */}
          <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold">
              <User size={20} />
              <h2>Owner Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                value={formData.ownerFirstName}
                onChange={(e) => handleChange('ownerFirstName', e.target.value)}
                required
              />

              <Input
                label="Last Name"
                placeholder="Doe"
                value={formData.ownerLastName}
                onChange={(e) => handleChange('ownerLastName', e.target.value)}
                required
              />

              <div className="md:col-span-2">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@acme.com"
                  value={formData.ownerEmail}
                  onChange={(e) => handleChange('ownerEmail', e.target.value)}
                  required
                  leftIcon={<Mail size={16} />}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  The owner will receive login credentials via email
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold">
              <CreditCard size={20} />
              <h2>Subscription Plan</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'STARTER', label: 'Starter', description: 'Basic features for small teams', color: 'blue' },
                { value: 'PROFESSIONAL', label: 'Professional', description: 'Advanced features for growing teams', color: 'purple' },
                { value: 'ENTERPRISE', label: 'Enterprise', description: 'Full features for large organizations', color: 'orange' },
              ].map((plan) => (
                <label
                  key={plan.value}
                  className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.plan === plan.value
                      ? `border-${plan.color}-500 bg-${plan.color}-50 dark:bg-${plan.color}-900/20`
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.value}
                    checked={formData.plan === plan.value}
                    onChange={(e) => handleChange('plan', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-neutral-900 dark:text-white">{plan.label}</span>
                    {formData.plan === plan.value && (
                      <div className={`w-5 h-5 rounded-full bg-${plan.color}-500 flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">{plan.description}</p>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800 rounded-b-2xl">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/super-admin/tenants')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          >
            Create Organization
          </Button>
        </div>
      </form>
    </div>
  );
}
