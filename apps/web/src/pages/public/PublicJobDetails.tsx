import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { publicCareerSiteApi } from '../../lib/api';
import { 
  MapPin, Briefcase, Clock, DollarSign, ArrowLeft, Share2, 
  Bookmark, Calendar, Globe, Loader2
} from 'lucide-react';
import { Button } from '../../components/ui';
import toast from 'react-hot-toast';

export function PublicJobDetails() {
  const { tenantId, jobId } = useParams<{ tenantId: string; jobId: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<any>(null);
  const [relatedJobs, setRelatedJobs] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await publicCareerSiteApi.getJob(tenantId!, jobId!);
        setJob(response.data.job);
        setRelatedJobs(response.data.relatedJobs || []);
        setConfig(response.data.config);
        
        // Update page title
        document.title = `${response.data.job.title} - ${response.data.job.company.name}`;
      } catch (err) {
        console.error('Failed to fetch job details', err);
        setError('Job not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (tenantId && jobId) {
      fetchJobDetails();
    }
  }, [tenantId, jobId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title} at ${job.company.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleApply = () => {
    navigate(`/careers/${tenantId}/jobs/${jobId}/apply`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Job Not Found</h2>
          <p className="text-neutral-600 mb-6">{error || 'This job posting is no longer available.'}</p>
          <Button onClick={() => navigate(`/careers/${tenantId}`)}>
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const primaryColor = config?.branding?.primaryColor || '#3B82F6';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link 
            to={`/careers/${tenantId}`}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft size={20} />
            Back to all jobs
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              {job.company.logo && (
                <img src={job.company.logo} alt={job.company.name} className="h-12 mb-4" />
              )}
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4"
              >
                {job.title}
              </motion.h1>
              
              <div className="flex flex-wrap gap-4 text-neutral-600">
                {job.department && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} />
                    <span>{job.department.name}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>{job.location.city}, {job.location.country}</span>
                  </div>
                )}
                {job.employmentType && (
                  <div className="flex items-center gap-2">
                    <Clock size={18} />
                    <span>{job.employmentType.replace('_', ' ')}</span>
                  </div>
                )}
                {job.workLocation && (
                  <div className="flex items-center gap-2">
                    <Globe size={18} />
                    <span>{job.workLocation.replace('_', ' ')}</span>
                  </div>
                )}
                {job.salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} />
                    <span>{job.salary}</span>
                  </div>
                )}
              </div>

              {job.publishedAt && (
                <div className="flex items-center gap-2 mt-4 text-sm text-neutral-500">
                  <Calendar size={16} />
                  <span>Posted {new Date(job.publishedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleApply}
                className="shadow-lg whitespace-nowrap"
                style={{ backgroundColor: primaryColor }}
              >
                Apply Now
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 size={16} />
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-8">
            {job.description && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">About the Role</h2>
                <div 
                  className="prose prose-neutral max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </motion.section>
            )}

            {job.responsibilities && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Responsibilities</h2>
                <div 
                  className="prose prose-neutral max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.responsibilities }}
                />
              </motion.section>
            )}

            {job.requirements && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Requirements</h2>
                <div 
                  className="prose prose-neutral max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.requirements }}
                />
              </motion.section>
            )}

            {job.benefits && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Benefits</h2>
                <div 
                  className="prose prose-neutral max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.benefits }}
                />
              </motion.section>
            )}

            {job.skills && job.skills.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ 
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Apply */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 sticky top-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ready to Apply?</h3>
              <Button 
                onClick={handleApply}
                className="w-full mb-3"
                style={{ backgroundColor: primaryColor }}
              >
                Apply for this Position
              </Button>
              <p className="text-xs text-neutral-500 text-center">
                Application takes approximately 5-10 minutes
              </p>
            </motion.div>

            {/* Job Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Job Information</h3>
              <div className="space-y-4">
                {job.experience && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Experience Level</p>
                    <p className="font-medium text-neutral-900">{job.experience}</p>
                  </div>
                )}
                {job.education && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Education</p>
                    <p className="font-medium text-neutral-900">{job.education}</p>
                  </div>
                )}
                {job.department && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Department</p>
                    <p className="font-medium text-neutral-900">{job.department.name}</p>
                  </div>
                )}
                {job.employmentType && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Employment Type</p>
                    <p className="font-medium text-neutral-900">{job.employmentType.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Company Info */}
            {config?.companyInfo && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
              >
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">About {job.company.name}</h3>
                {config.companyInfo.description && (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-4">
                    {config.companyInfo.description}
                  </p>
                )}
                <Link 
                  to={`/careers/${tenantId}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: primaryColor }}
                >
                  View all jobs at {job.company.name}
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Jobs */}
        {relatedJobs.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Similar Positions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedJobs.map((relatedJob) => (
                <Link
                  key={relatedJob.id}
                  to={`/careers/${tenantId}/jobs/${relatedJob.id}`}
                  className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-neutral-900 mb-2">{relatedJob.title}</h3>
                  <div className="flex flex-col gap-2 text-sm text-neutral-600">
                    {relatedJob.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {relatedJob.location.city}, {relatedJob.location.country}
                      </div>
                    )}
                    {relatedJob.employmentType && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {relatedJob.employmentType.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
