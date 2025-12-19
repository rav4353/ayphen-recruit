'use client';

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Globe,
  Palette,
  Layout,
  Building2,
  Search,
  FileText,
  ExternalLink,
  Save,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Link2,
  Image,
} from 'lucide-react';
import { careerSiteApi, customDomainApi, applicationFormApi } from '@/lib/api';

type TabType = 'branding' | 'layout' | 'company' | 'seo' | 'domain' | 'form' | 'pages';

export function CareerSiteBuilder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('view') as TabType) || 'branding';

  const setActiveTab = (tab: TabType) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('view', tab);
      return newParams;
    });
  };

  const { data: config, isLoading } = useQuery({
    queryKey: ['career-site-config'],
    queryFn: () => careerSiteApi.getConfig(),
  });

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'domain', label: 'Domain', icon: Globe },
    { id: 'form', label: 'Application Form', icon: FileText },
    { id: 'pages', label: 'Custom Pages', icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10 rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Career Site Builder
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Create a beautiful, branded career page to attract top talent
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-white dark:bg-neutral-800 shadow-sm"
              onClick={() => window.open('/careers/preview', '_blank')}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button 
              size="sm"
              className="gap-2 shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Save className="h-4 w-4" />
              Publish Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'branding' && <BrandingSection config={config?.data} />}
        {activeTab === 'layout' && <LayoutSection config={config?.data} />}
        {activeTab === 'company' && <CompanyInfoSection config={config?.data} />}
        {activeTab === 'seo' && <SeoSection config={config?.data} />}
        {activeTab === 'domain' && <DomainSection />}
        {activeTab === 'form' && <ApplicationFormSection />}
        {activeTab === 'pages' && <CustomPagesSection config={config?.data} />}
      </div>
    </div>
  );
}

// ==================== BRANDING ====================

function BrandingSection({ config }: { config: any }) {
  const queryClient = useQueryClient();
  const [branding, setBranding] = useState(config?.branding || {});

  const mutation = useMutation({
    mutationFn: (data: any) => careerSiteApi.updateBranding(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['career-site-config'] }),
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.primaryColor || '#6366F1'}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={branding.primaryColor || '#6366F1'}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.secondaryColor || '#8B5CF6'}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={branding.secondaryColor || '#8B5CF6'}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.backgroundColor || '#FFFFFF'}
                onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={branding.backgroundColor || '#FFFFFF'}
                onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.textColor || '#1F2937'}
                onChange={(e) => setBranding({ ...branding, textColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={branding.textColor || '#1F2937'}
                onChange={(e) => setBranding({ ...branding, textColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Logo & Assets</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Company Logo</label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="max-h-16 mx-auto" />
              ) : (
                <div className="text-neutral-400">
                  <Image className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Upload logo (PNG, SVG)</p>
                </div>
              )}
              <Button variant="secondary" size="sm" className="mt-3">
                Upload Logo
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Favicon</label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
              {branding.favicon ? (
                <img src={branding.favicon} alt="Favicon" className="h-8 w-8 mx-auto" />
              ) : (
                <div className="text-neutral-400">
                  <Image className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Upload favicon (32x32 PNG)</p>
                </div>
              )}
              <Button variant="secondary" size="sm" className="mt-3">
                Upload Favicon
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Typography</h3>
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-2">Font Family</label>
          <select
            value={branding.fontFamily || 'Inter, sans-serif'}
            onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="Inter, sans-serif">Inter</option>
            <option value="Roboto, sans-serif">Roboto</option>
            <option value="Open Sans, sans-serif">Open Sans</option>
            <option value="Lato, sans-serif">Lato</option>
            <option value="Poppins, sans-serif">Poppins</option>
            <option value="Montserrat, sans-serif">Montserrat</option>
          </select>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => mutation.mutate(branding)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Branding
        </Button>
      </div>
    </div>
  );
}

// ==================== LAYOUT ====================

function LayoutSection({ config }: { config: any }) {
  const queryClient = useQueryClient();
  const [layout, setLayout] = useState(config?.layout || {});

  const mutation = useMutation({
    mutationFn: (data: any) => careerSiteApi.updateLayout(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['career-site-config'] }),
  });

  const templates = [
    { id: 'modern', name: 'Modern', description: 'Clean, card-based layout' },
    { id: 'classic', name: 'Classic', description: 'Traditional list view' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and focused' },
    { id: 'corporate', name: 'Corporate', description: 'Professional enterprise look' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => setLayout({ ...layout, template: template.id })}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${layout.template === template.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
                }`}
            >
              <div className="h-20 bg-neutral-100 rounded mb-3" />
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-xs text-neutral-500">{template.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.showHero ?? true}
              onChange={(e) => setLayout({ ...layout, showHero: e.target.checked })}
              className="rounded"
            />
            <span>Show hero section</span>
          </label>
          {layout.showHero && (
            <>
              <Input
                label="Hero Title"
                value={layout.heroTitle || ''}
                onChange={(e) => setLayout({ ...layout, heroTitle: e.target.value })}
                placeholder="Join Our Team"
              />
              <Input
                label="Hero Subtitle"
                value={layout.heroSubtitle || ''}
                onChange={(e) => setLayout({ ...layout, heroSubtitle: e.target.value })}
                placeholder="Discover exciting career opportunities"
              />
            </>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Filters & Search</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.showSearch ?? true}
              onChange={(e) => setLayout({ ...layout, showSearch: e.target.checked })}
              className="rounded"
            />
            <span>Show search bar</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.showFilters ?? true}
              onChange={(e) => setLayout({ ...layout, showFilters: e.target.checked })}
              className="rounded"
            />
            <span>Show filters</span>
          </label>
          {layout.showFilters && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layout.showDepartmentFilter ?? true}
                  onChange={(e) => setLayout({ ...layout, showDepartmentFilter: e.target.checked })}
                  className="rounded"
                />
                <span>Department filter</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layout.showLocationFilter ?? true}
                  onChange={(e) => setLayout({ ...layout, showLocationFilter: e.target.checked })}
                  className="rounded"
                />
                <span>Location filter</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layout.showEmploymentTypeFilter ?? true}
                  onChange={(e) => setLayout({ ...layout, showEmploymentTypeFilter: e.target.checked })}
                  className="rounded"
                />
                <span>Employment type filter</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Sections</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.showCompanyInfo ?? true}
              onChange={(e) => setLayout({ ...layout, showCompanyInfo: e.target.checked })}
              className="rounded"
            />
            <span>Show company info section</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.showBenefits ?? true}
              onChange={(e) => setLayout({ ...layout, showBenefits: e.target.checked })}
              className="rounded"
            />
            <span>Show benefits section</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.showTestimonials ?? false}
              onChange={(e) => setLayout({ ...layout, showTestimonials: e.target.checked })}
              className="rounded"
            />
            <span>Show employee testimonials</span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => mutation.mutate(layout)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Layout
        </Button>
      </div>
    </div>
  );
}

// ==================== COMPANY INFO ====================

function CompanyInfoSection({ config }: { config: any }) {
  const queryClient = useQueryClient();
  const [info, setInfo] = useState(config?.companyInfo || {});

  const mutation = useMutation({
    mutationFn: (data: any) => careerSiteApi.updateCompanyInfo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['career-site-config'] }),
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={info.name || ''}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
          />
          <Input
            label="Tagline"
            value={info.tagline || ''}
            onChange={(e) => setInfo({ ...info, tagline: e.target.value })}
            placeholder="Building the future of work"
          />
          <div>
            <label className="block text-sm font-medium mb-2">Company Description</label>
            <textarea
              value={info.description || ''}
              onChange={(e) => setInfo({ ...info, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="Tell candidates about your company..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mission Statement</label>
            <textarea
              value={info.mission || ''}
              onChange={(e) => setInfo({ ...info, mission: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="Our mission is to..."
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Social Links</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="LinkedIn"
            value={info.socialLinks?.linkedin || ''}
            onChange={(e) => setInfo({ ...info, socialLinks: { ...info.socialLinks, linkedin: e.target.value } })}
            placeholder="https://linkedin.com/company/..."
          />
          <Input
            label="Twitter"
            value={info.socialLinks?.twitter || ''}
            onChange={(e) => setInfo({ ...info, socialLinks: { ...info.socialLinks, twitter: e.target.value } })}
            placeholder="https://twitter.com/..."
          />
          <Input
            label="Facebook"
            value={info.socialLinks?.facebook || ''}
            onChange={(e) => setInfo({ ...info, socialLinks: { ...info.socialLinks, facebook: e.target.value } })}
            placeholder="https://facebook.com/..."
          />
          <Input
            label="Instagram"
            value={info.socialLinks?.instagram || ''}
            onChange={(e) => setInfo({ ...info, socialLinks: { ...info.socialLinks, instagram: e.target.value } })}
            placeholder="https://instagram.com/..."
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => mutation.mutate(info)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Company Info
        </Button>
      </div>
    </div>
  );
}

// ==================== SEO ====================

function SeoSection({ config }: { config: any }) {
  const queryClient = useQueryClient();
  const [seo, setSeo] = useState(config?.seo || {});

  const mutation = useMutation({
    mutationFn: (data: any) => careerSiteApi.updateSeo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['career-site-config'] }),
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Search Engine Optimization</h3>
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={seo.title || ''}
            onChange={(e) => setSeo({ ...seo, title: e.target.value })}
            placeholder="Careers at Company Name"
          />
          <div>
            <label className="block text-sm font-medium mb-2">Meta Description</label>
            <textarea
              value={seo.description || ''}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder="Explore job opportunities at..."
            />
            <p className="text-xs text-neutral-500 mt-1">{(seo.description || '').length}/160 characters</p>
          </div>
          <Input
            label="Keywords (comma separated)"
            value={(seo.keywords || []).join(', ')}
            onChange={(e) => setSeo({ ...seo, keywords: e.target.value.split(',').map((k: string) => k.trim()) })}
            placeholder="careers, jobs, hiring"
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Social Sharing</h3>
        <div>
          <label className="block text-sm font-medium mb-2">Open Graph Image</label>
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
            {seo.ogImage ? (
              <img src={seo.ogImage} alt="OG Image" className="max-h-32 mx-auto" />
            ) : (
              <div className="text-neutral-400">
                <Image className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Upload image (1200x630 recommended)</p>
              </div>
            )}
            <Button variant="secondary" size="sm" className="mt-3">
              Upload Image
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => mutation.mutate(seo)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save SEO Settings
        </Button>
      </div>
    </div>
  );
}

// ==================== DOMAIN ====================

function DomainSection() {
  const queryClient = useQueryClient();
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  const { data: domainStatus, isLoading } = useQuery({
    queryKey: ['domain-status'],
    queryFn: () => customDomainApi.getStatus(),
  });

  const subdomainMutation = useMutation({
    mutationFn: (subdomain: string) => customDomainApi.setSubdomain(subdomain),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domain-status'] }),
  });

  const customDomainMutation = useMutation({
    mutationFn: (domain: string) => customDomainApi.addCustomDomain(domain),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domain-status'] }),
  });

  const verifyMutation = useMutation({
    mutationFn: () => customDomainApi.verifyDomain(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domain-status'] }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const status = domainStatus?.data;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Subdomain</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Get a free subdomain for your career site
        </p>

        {status?.subdomain ? (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-green-800">{status.subdomain.url}</p>
              <Badge variant="success" className="mt-1">Active</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.open(status.subdomain.url, '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center">
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-company"
                className="rounded-r-none"
              />
              <span className="px-3 py-2 bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-lg text-sm text-neutral-500">
                .careers.ayphen.com
              </span>
            </div>
            <Button
              variant="primary"
              onClick={() => subdomainMutation.mutate(subdomain)}
              disabled={!subdomain || subdomainMutation.isPending}
            >
              {subdomainMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Claim'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Domain</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Use your own domain for a fully branded experience
        </p>

        {status?.customDomain ? (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{status.customDomain.domain}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={status.customDomain.status === 'verified' ? 'success' : 'secondary'}>
                      {status.customDomain.status}
                    </Badge>
                    {status.customDomain.sslStatus && (
                      <Badge variant={status.customDomain.sslStatus === 'active' ? 'success' : 'secondary'}>
                        SSL: {status.customDomain.sslStatus}
                      </Badge>
                    )}
                  </div>
                </div>
                {status.customDomain.status !== 'verified' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => verifyMutation.mutate()}
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Verify
                  </Button>
                )}
              </div>
            </div>

            {status.customDomain.status !== 'verified' && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  DNS Configuration Required
                </h4>
                <div className="mt-3 text-sm text-amber-700">
                  <p className="mb-2">Add one of these DNS records:</p>
                  <code className="block p-2 bg-white rounded text-xs">
                    CNAME {status.customDomain.domain} → careers.ayphen.com
                  </code>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
              placeholder="careers.yourcompany.com"
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={() => customDomainMutation.mutate(customDomain)}
              disabled={!customDomain || customDomainMutation.isPending}
            >
              {customDomainMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
              Add Domain
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ==================== APPLICATION FORM ====================

function ApplicationFormSection() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['application-form-config'],
    queryFn: () => applicationFormApi.getConfig(),
  });

  const { data: _fieldTypes } = useQuery({
    queryKey: ['field-types'],
    queryFn: () => applicationFormApi.getFieldTypes(),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => applicationFormApi.updateConfig(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['application-form-config'] }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const formConfig = config?.data;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Standard Fields</h3>
        <p className="text-sm text-neutral-500 mb-4">Configure which fields to show on the application form</p>

        <div className="space-y-3">
          {Object.entries(formConfig?.standardFields || {}).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={value.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...formConfig,
                      standardFields: {
                        ...formConfig.standardFields,
                        [key]: { ...value, enabled: e.target.checked },
                      },
                    };
                    mutation.mutate(updated);
                  }}
                  className="rounded"
                />
                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.required}
                  disabled={!value.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...formConfig,
                      standardFields: {
                        ...formConfig.standardFields,
                        [key]: { ...value, required: e.target.checked },
                      },
                    };
                    mutation.mutate(updated);
                  }}
                  className="rounded"
                />
                Required
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Custom Fields</h3>
          <Button variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>

        {formConfig?.customFields?.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No custom fields added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {formConfig?.customFields?.map((field: any) => (
              <div key={field.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <span className="font-medium">{field.label}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">{field.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Form Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formConfig?.settings?.showProgressBar ?? true}
              onChange={(e) => mutation.mutate({
                ...formConfig,
                settings: { ...formConfig.settings, showProgressBar: e.target.checked },
              })}
              className="rounded"
            />
            <span>Show progress bar</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formConfig?.settings?.requireGdprConsent ?? true}
              onChange={(e) => mutation.mutate({
                ...formConfig,
                settings: { ...formConfig.settings, requireGdprConsent: e.target.checked },
              })}
              className="rounded"
            />
            <span>Require GDPR consent</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formConfig?.settings?.sendConfirmationEmail ?? true}
              onChange={(e) => mutation.mutate({
                ...formConfig,
                settings: { ...formConfig.settings, sendConfirmationEmail: e.target.checked },
              })}
              className="rounded"
            />
            <span>Send confirmation email to applicants</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-2">Confirmation Message</label>
            <textarea
              value={formConfig?.settings?.confirmationMessage || ''}
              onChange={(e) => mutation.mutate({
                ...formConfig,
                settings: { ...formConfig.settings, confirmationMessage: e.target.value },
              })}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== CUSTOM PAGES ====================

interface PageFormData {
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
}

function CustomPagesSection({ config }: { config: any }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    slug: '',
    content: '',
    isPublished: false,
  });

  const addMutation = useMutation({
    mutationFn: (data: PageFormData) => careerSiteApi.addPage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-site-config'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: Partial<PageFormData> }) =>
      careerSiteApi.updatePage(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-site-config'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (pageId: string) => careerSiteApi.deletePage(pageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['career-site-config'] }),
  });

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingPage(null);
    setFormData({ title: '', slug: '', content: '', isPublished: false });
  };

  const handleOpenAdd = () => {
    setEditingPage(null);
    setFormData({ title: '', slug: '', content: '', isPublished: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (page: any) => {
    setEditingPage(page);
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      isPublished: page.isPublished || false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.slug) return;

    if (editingPage) {
      updateMutation.mutate({ pageId: editingPage.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const pages = config?.pages || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Custom Pages</h3>
            <p className="text-sm text-neutral-500">Create additional pages for your career site</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Page
          </Button>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">No custom pages yet</p>
            <p className="text-sm">Create pages like "About Us", "Benefits", or "Culture"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page: any) => (
              <div key={page.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium">{page.title}</h4>
                  <p className="text-sm text-neutral-500">/{page.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={page.isPublished ? 'success' : 'secondary'}>
                    {page.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(page)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(page.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold">
                {editingPage ? 'Edit Page' : 'Add New Page'}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {editingPage ? 'Update your custom page' : 'Create a new page for your career site'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Page Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      ...formData,
                      title,
                      slug: editingPage ? formData.slug : generateSlug(title),
                    });
                  }}
                  placeholder="e.g., About Us, Benefits, Culture"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">URL Slug *</label>
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500 mr-1">/</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    placeholder="about-us"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Enter your page content here. You can use HTML for formatting."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublished" className="text-sm">
                  Publish immediately
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!formData.title || !formData.slug || addMutation.isPending || updateMutation.isPending}
              >
                {addMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingPage ? 'Update Page' : 'Create Page'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
