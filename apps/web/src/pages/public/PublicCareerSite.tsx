import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { publicCareerSiteApi } from '../../lib/api';
import { 
  Search, MapPin, Briefcase, Clock, DollarSign, ArrowRight, 
  Filter, X, Linkedin, Twitter, Facebook, Instagram,
  ChevronDown, Loader2
} from 'lucide-react';
import { Button, EmptyState } from '../../components/ui';

interface CareerSiteConfig {
  enabled: boolean;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  layout: {
    template: string;
    showHero: boolean;
    heroTitle?: string;
    heroSubtitle?: string;
    showSearch: boolean;
    showFilters: boolean;
    showDepartmentFilter: boolean;
    showLocationFilter: boolean;
    showEmploymentTypeFilter: boolean;
    jobsPerPage: number;
    showCompanyInfo: boolean;
    showBenefits: boolean;
    showTestimonials: boolean;
  };
  companyInfo: {
    name: string;
    tagline?: string;
    description?: string;
    mission?: string;
    benefits?: { icon: string; title: string; description: string }[];
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  };
  seo: {
    title?: string;
    description?: string;
  };
}

export function PublicCareerSite() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [config, setConfig] = useState<CareerSiteConfig | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get('department') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState(searchParams.get('employmentType') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    document.title = config?.seo?.title || `Careers at ${config?.companyInfo?.name || 'Company'}`;
  }, [config]);

  useEffect(() => {
    const fetchCareerSite = async () => {
      try {
        const response = await publicCareerSiteApi.getCareerSite(tenantId!);
        setConfig(response.data.config);
        setStats(response.data.stats);
      } catch (err) {
        console.error('Failed to fetch career site', err);
        setError('Career site not found or not enabled');
      } finally {
        setIsLoading(false);
      }
    };

    if (tenantId) {
      fetchCareerSite();
    }
  }, [tenantId]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!tenantId || !config) return;
      
      setIsLoadingJobs(true);
      try {
        const response = await publicCareerSiteApi.getJobs(tenantId, {
          search: searchQuery || undefined,
          department: selectedDepartment || undefined,
          location: selectedLocation || undefined,
          employmentType: selectedEmploymentType || undefined,
          page,
          limit: config.layout.jobsPerPage || 10,
        });
        setJobs(response.data.jobs);
        setPagination(response.data.pagination);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [tenantId, config, searchQuery, selectedDepartment, selectedLocation, selectedEmploymentType, page]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    updateUrlParams({ search: query });
  };

  const handleFilterChange = (type: string, value: string) => {
    setPage(1);
    if (type === 'department') {
      setSelectedDepartment(value);
      updateUrlParams({ department: value });
    } else if (type === 'location') {
      setSelectedLocation(value);
      updateUrlParams({ location: value });
    } else if (type === 'employmentType') {
      setSelectedEmploymentType(value);
      updateUrlParams({ employmentType: value });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedLocation('');
    setSelectedEmploymentType('');
    setPage(1);
    setSearchParams({});
  };

  const updateUrlParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Career Site Not Available</h2>
          <p className="text-neutral-600">{error || 'This career site is not currently accessible.'}</p>
        </div>
      </div>
    );
  }

  const activeFiltersCount = [searchQuery, selectedDepartment, selectedLocation, selectedEmploymentType].filter(Boolean).length;

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: config.branding.backgroundColor,
        color: config.branding.textColor,
        fontFamily: config.branding.fontFamily,
      }}
    >
      {/* Hero Section */}
      {config.layout.showHero && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${config.branding.primaryColor}15 0%, ${config.branding.secondaryColor}15 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" 
              style={{ backgroundColor: config.branding.primaryColor }} />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" 
              style={{ backgroundColor: config.branding.secondaryColor }} />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center">
              {config.branding.logo && (
                <motion.img 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                  src={config.branding.logo} 
                  alt={config.companyInfo.name} 
                  className="h-16 mx-auto mb-8"
                />
              )}
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
                style={{ color: config.branding.textColor }}
              >
                {config.layout.heroTitle || `Join ${config.companyInfo.name}`}
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl max-w-3xl mx-auto opacity-80"
              >
                {config.layout.heroSubtitle || config.companyInfo.tagline || 'Discover exciting career opportunities'}
              </motion.p>
              
              {stats && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 flex flex-wrap justify-center gap-8"
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold" style={{ color: config.branding.primaryColor }}>
                      {stats.totalJobs}
                    </div>
                    <div className="text-sm opacity-70 mt-1">Open Positions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold" style={{ color: config.branding.primaryColor }}>
                      {stats.departments?.length || 0}
                    </div>
                    <div className="text-sm opacity-70 mt-1">Departments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold" style={{ color: config.branding.primaryColor }}>
                      {stats.locations?.length || 0}
                    </div>
                    <div className="text-sm opacity-70 mt-1">Locations</div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        {(config.layout.showSearch || config.layout.showFilters) && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
              <div className="flex flex-col lg:flex-row gap-4">
                {config.layout.showSearch && (
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search jobs by title, skills, or keywords..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{
                        outlineColor: config.branding.primaryColor,
                      }}
                    />
                  </div>
                )}
                
                {config.layout.showFilters && (
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Filter size={18} />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: config.branding.primaryColor }}>
                        {activeFiltersCount}
                      </span>
                    )}
                    <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showFilters && config.layout.showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-6 pt-6 border-t border-neutral-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {config.layout.showDepartmentFilter && stats?.departments?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Department</label>
                          <select
                            value={selectedDepartment}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2"
                            style={{ outlineColor: config.branding.primaryColor }}
                          >
                            <option value="">All Departments</option>
                            {stats.departments.map((dept: any) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name} ({dept._count.jobs})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {config.layout.showLocationFilter && stats?.locations?.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Location</label>
                          <select
                            value={selectedLocation}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2"
                          >
                            <option value="">All Locations</option>
                            {stats.locations.map((loc: any) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.city}, {loc.country} ({loc._count.jobs})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {config.layout.showEmploymentTypeFilter && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Employment Type</label>
                          <select
                            value={selectedEmploymentType}
                            onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2"
                          >
                            <option value="">All Types</option>
                            <option value="FULL_TIME">Full Time</option>
                            <option value="PART_TIME">Part Time</option>
                            <option value="CONTRACT">Contract</option>
                            <option value="INTERNSHIP">Internship</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={clearFilters}
                          className="text-sm font-medium flex items-center gap-1 hover:underline"
                          style={{ color: config.branding.primaryColor }}
                        >
                          <X size={16} />
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Job Listings */}
        <div className="space-y-4">
          {isLoadingJobs ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: config.branding.primaryColor }} />
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description={activeFiltersCount > 0 ? "Try adjusting your filters" : "Check back later for new opportunities"}
              action={activeFiltersCount > 0 ? (
                <Button onClick={clearFilters} style={{ backgroundColor: config.branding.primaryColor }}>
                  Clear Filters
                </Button>
              ) : undefined}
            />
          ) : (
            jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/careers/${tenantId}/jobs/${job.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-lg transition-all duration-300 p-6 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3 group-hover:underline"
                        style={{ color: config.branding.textColor }}>
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                        {job.department && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase size={16} />
                            {job.department.name}
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={16} />
                            {job.location.city}, {job.location.country}
                          </div>
                        )}
                        {job.employmentType && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={16} />
                            {job.employmentType.replace('_', ' ')}
                          </div>
                        )}
                        {job.salary && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={16} />
                            {job.salary}
                          </div>
                        )}
                      </div>
                      {job.description && (
                        <p className="mt-3 text-neutral-600 line-clamp-2">
                          {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-neutral-400 group-hover:text-current transition-colors"
                      style={{ color: config.branding.primaryColor }}>
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pageNum === page
                    ? 'text-white shadow-lg'
                    : 'bg-white border border-neutral-300 hover:border-neutral-400'
                }`}
                style={pageNum === page ? { backgroundColor: config.branding.primaryColor } : {}}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Company Info Section */}
      {config.layout.showCompanyInfo && config.companyInfo.description && (
        <div className="bg-white border-t border-neutral-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6" style={{ color: config.branding.textColor }}>
                About {config.companyInfo.name}
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed">
                {config.companyInfo.description}
              </p>
              {config.companyInfo.mission && (
                <div className="mt-8 p-6 rounded-xl" 
                  style={{ backgroundColor: `${config.branding.primaryColor}10` }}>
                  <p className="text-lg font-medium" style={{ color: config.branding.primaryColor }}>
                    "{config.companyInfo.mission}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      {config.layout.showBenefits && config.companyInfo.benefits && config.companyInfo.benefits.length > 0 && (
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: config.branding.textColor }}>
              Why Join Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.companyInfo.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
                >
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: config.branding.textColor }}>
                    {benefit.title}
                  </h3>
                  <p className="text-neutral-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold">{config.companyInfo.name}</p>
              {config.companyInfo.tagline && (
                <p className="text-sm text-neutral-400 mt-1">{config.companyInfo.tagline}</p>
              )}
            </div>
            
            {config.companyInfo.socialLinks && (
              <div className="flex gap-4">
                {config.companyInfo.socialLinks.linkedin && (
                  <a href={config.companyInfo.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
                    <Linkedin size={20} />
                  </a>
                )}
                {config.companyInfo.socialLinks.twitter && (
                  <a href={config.companyInfo.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
                    <Twitter size={20} />
                  </a>
                )}
                {config.companyInfo.socialLinks.facebook && (
                  <a href={config.companyInfo.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
                    <Facebook size={20} />
                  </a>
                )}
                {config.companyInfo.socialLinks.instagram && (
                  <a href={config.companyInfo.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
                    <Instagram size={20} />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-400">
            <p>© {new Date().getFullYear()} {config.companyInfo.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
