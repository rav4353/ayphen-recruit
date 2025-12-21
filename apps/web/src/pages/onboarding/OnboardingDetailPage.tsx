import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { onboardingApi } from '../../lib/api';
import { ArrowLeft, CheckCircle2, Clock, User, Briefcase, FileText, UploadCloud, XCircle, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

export function OnboardingDetailPage() {
    const { id, tenantId } = useParams<{ id: string; tenantId: string }>();
    const navigate = useNavigate();
    const [workflow, setWorkflow] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewTask, setReviewTask] = useState<any>(null);
    const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (id) fetchWorkflow();
    }, [id]);

    const fetchWorkflow = async () => {
        try {
            const response = await onboardingApi.getOne(id!);
            const workflowData = response.data?.data || response.data;
            console.log('Workflow data:', workflowData); // Debug log
            setWorkflow(workflowData);
        } catch (error) {
            console.error('Failed to fetch workflow:', error);
            toast.error('Failed to fetch onboarding details');
            navigate(`/${tenantId}/onboarding`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTaskUpdate = async (taskId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
            await onboardingApi.updateTask(taskId, { status: newStatus });
            fetchWorkflow(); // Refresh to update progress
            toast.success('Task updated');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleUploadClick = (taskId: string) => {
        setUploadTaskId(taskId);
        setUploadFile(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
        }
    };

    const handleConfirmUpload = async () => {
        if (!uploadTaskId || !uploadFile) return;
        setIsUploading(true);
        try {
            await onboardingApi.uploadDocumentFile(uploadTaskId, uploadFile);
            toast.success('Document uploaded successfully');
            setUploadTaskId(null);
            setUploadFile(null);
            fetchWorkflow();
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
        if (!reviewTask) return;
        try {
            await onboardingApi.reviewDocument(reviewTask.id, status);
            toast.success(`Document ${status.toLowerCase()}`);
            setReviewTask(null);
            fetchWorkflow();
        } catch (error) {
            toast.error('Failed to review document');
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (!workflow) return <div className="p-10 text-center">Workflow not found</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate(`/${tenantId}/onboarding`)}>
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 border-none ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Onboarding Checklist</h1>
                                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                    Manage tasks for {workflow.application?.candidate?.firstName || 'New Hire'}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {Math.round(workflow.progress)}%
                                </div>
                                <span className="text-sm text-neutral-500">Completed</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {workflow.tasks.map((task: any) => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        "flex items-center p-4 rounded-lg border transition-all",
                                        task.status === 'COMPLETED'
                                            ? "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 opacity-75"
                                            : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700"
                                    )}
                                >
                                    <button
                                        onClick={() => handleTaskUpdate(task.id, task.status)}
                                        className={cn(
                                            "mr-4 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                            task.status === 'COMPLETED'
                                                ? "bg-green-500 border-green-500 text-white"
                                                : "border-neutral-300 dark:border-neutral-600 hover:border-blue-500"
                                        )}
                                    >
                                        {task.status === 'COMPLETED' && <CheckCircle2 size={16} />}
                                    </button>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={cn(
                                                "font-medium",
                                                task.status === 'COMPLETED' ? "text-neutral-500 line-through" : "text-neutral-900 dark:text-white"
                                            )}>
                                                {task.title}
                                            </h4>
                                            {task.isRequiredDoc && (
                                                <Badge variant="secondary" className="text-xs font-normal border border-neutral-200 dark:border-neutral-700 ml-2">
                                                    Doc Required
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            {task.description}
                                        </p>

                                        {/* Document Status Actions */}
                                        {task.isRequiredDoc && (
                                            <div className="mt-2 flex items-center gap-3">
                                                {task.documentStatus === 'NOT_UPLOADED' && (
                                                    <Button size="sm" variant="secondary" onClick={() => handleUploadClick(task.id)} className="h-7 text-xs">
                                                        <UploadCloud size={12} className="mr-1.5" />
                                                        Upload Document
                                                    </Button>
                                                )}
                                                {task.documentStatus === 'PENDING_REVIEW' && (
                                                    <Button size="sm" variant="primary" onClick={() => setReviewTask(task)} className="h-7 text-xs bg-orange-500 hover:bg-orange-600 border-none text-white">
                                                        <Eye size={12} className="mr-1.5" />
                                                        Review Document
                                                    </Button>
                                                )}
                                                {task.documentStatus === 'APPROVED' && (
                                                    <span className="text-xs flex items-center text-green-600 font-medium">
                                                        <CheckCircle2 size={12} className="mr-1" /> Document Approved
                                                    </span>
                                                )}
                                                {task.documentStatus === 'REJECTED' && (
                                                    <span className="text-xs flex items-center text-red-600 font-medium">
                                                        <XCircle size={12} className="mr-1" /> Document Rejected
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Badge variant="secondary" className="ml-4">
                                        {task.assigneeRole}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Review Modal */}
                {reviewTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-lg p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Review Document</h3>
                                <button onClick={() => setReviewTask(null)} className="text-neutral-500 hover:text-neutral-700">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <p className="text-sm text-neutral-500 mb-2">Document for: <strong>{reviewTask.title}</strong></p>
                                <div className="flex items-center gap-2 text-blue-600 underline text-sm">
                                    <FileText size={16} />
                                    <a href={reviewTask.documentUrl} target="_blank" rel="noreferrer">
                                        View Uploaded File
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="secondary" onClick={() => handleReview('REJECTED')} className="text-red-600 hover:bg-red-50 border-red-200">
                                    Reject
                                </Button>
                                <Button onClick={() => handleReview('APPROVED')} className="bg-green-600 hover:bg-green-700 text-white">
                                    Approve & Complete Task
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">New Hire Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {workflow.application?.candidate?.firstName || 'New'} {workflow.application?.candidate?.lastName || 'Hire'}
                                    </p>
                                    <p className="text-xs text-neutral-500">Candidate</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {workflow.application?.job?.title || 'Position'}
                                    </p>
                                    <p className="text-xs text-neutral-500">Role</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {new Date(workflow.startDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-neutral-500">Start Date</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none">
                        <h3 className="font-semibold mb-2">Employee Portal</h3>
                        <p className="text-blue-100 text-sm mb-4">
                            Copy this link to send to the new hire so they can complete their tasks.
                        </p>
                        <div className="bg-white/10 rounded p-2 text-xs font-mono break-all mb-3 border border-white/20">
                            {window.location.origin}/portal/onboarding/{workflow.id}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/portal/onboarding/${workflow.id}`);
                                toast.success('Link copied');
                            }}
                        >
                            Copy Link
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Upload Document Modal */}
            <Modal
                isOpen={!!uploadTaskId}
                onClose={() => { setUploadTaskId(null); setUploadFile(null); }}
                title="Upload Document"
            >
                <div className="space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Select a document file to upload (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
                    </p>
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            id="document-upload"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                        <label
                            htmlFor="document-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <UploadCloud size={32} className="text-neutral-400" />
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {uploadFile ? uploadFile.name : 'Click to select a file'}
                            </span>
                            {uploadFile && (
                                <span className="text-xs text-neutral-500">
                                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            )}
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => { setUploadTaskId(null); setUploadFile(null); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmUpload} disabled={!uploadFile || isUploading}>
                            {isUploading ? (
                                <><Loader2 size={14} className="mr-2 animate-spin" /> Uploading...</>
                            ) : (
                                'Upload'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
