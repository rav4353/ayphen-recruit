import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { onboardingApi } from '../../lib/api';
import { CheckCircle2, Clock, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

export function EmployeeOnboardingPortal() {
    const { id } = useParams();
    const [workflow, setWorkflow] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchWorkflow();
    }, [id]);

    const fetchWorkflow = async () => {
        try {
            const response = await onboardingApi.getOne(id!);
            setWorkflow(response.data);
        } catch (error) {
            toast.error('Failed to load onboarding details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTaskComplete = async (taskId: string, currentStatus: string) => {
        if (currentStatus === 'COMPLETED') {
            toast.error('This task is already completed');
            return;
        }

        try {
            await onboardingApi.updateTask(taskId, { status: 'COMPLETED' });
            toast.success('Task marked as complete!');
            fetchWorkflow();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleFileUpload = async (taskId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingTaskId(taskId);

        try {
            // Mock upload - in production, upload to S3 first
            const mockUrl = `https://storage.example.com/${file.name}`;
            await onboardingApi.uploadDocument(taskId, mockUrl);
            toast.success('Document uploaded successfully!');
            fetchWorkflow();
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setUploadingTaskId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">Loading your onboarding...</p>
                </div>
            </div>
        );
    }

    if (!workflow) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
                <Card className="p-8 text-center max-w-md">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Onboarding Not Found</h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        The onboarding link you're trying to access is invalid or has expired.
                    </p>
                </Card>
            </div>
        );
    }

    const candidateTasks = workflow.tasks.filter((t: any) => t.assigneeRole === 'CANDIDATE');
    const completedCount = candidateTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const progress = candidateTasks.length > 0 ? (completedCount / candidateTasks.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {workflow.application.candidate.firstName?.[0]}
                            {workflow.application.candidate.lastName?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                Welcome, {workflow.application.candidate.firstName}! 🎉
                            </h1>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                                {workflow.application.job.title} • Starting {new Date(workflow.startDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Progress Card */}
                <Card className="p-6 mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Your Onboarding Progress</h2>
                            <p className="text-blue-100 text-sm">
                                {completedCount} of {candidateTasks.length} tasks completed
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold">{Math.round(progress)}%</div>
                        </div>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500 shadow-lg"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </Card>

                {/* Instructions */}
                <Card className="p-5 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                <AlertCircle size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Complete Your Onboarding Tasks
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Please complete all the tasks below before your start date. Upload any required documents and mark tasks as complete when done.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Tasks List */}
                <div className="space-y-4">
                    {candidateTasks.length === 0 ? (
                        <Card className="p-8 text-center">
                            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                No Tasks Assigned
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                You don't have any tasks to complete at this time.
                            </p>
                        </Card>
                    ) : (
                        candidateTasks.map((task: any, index: number) => (
                            <Card
                                key={task.id}
                                className={cn(
                                    "p-5 transition-all hover:shadow-lg",
                                    task.status === 'COMPLETED'
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Task Number */}
                                    <div className={cn(
                                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                                        task.status === 'COMPLETED'
                                            ? "bg-green-500 text-white"
                                            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                                    )}>
                                        {task.status === 'COMPLETED' ? (
                                            <CheckCircle2 size={20} />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>

                                    {/* Task Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <h3 className={cn(
                                                    "font-semibold text-lg",
                                                    task.status === 'COMPLETED'
                                                        ? "text-green-900 dark:text-green-100 line-through"
                                                        : "text-neutral-900 dark:text-white"
                                                )}>
                                                    {task.title}
                                                </h3>
                                                {task.isRequiredDoc && (
                                                    <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-700 border-amber-300">
                                                        Document Required
                                                    </Badge>
                                                )}
                                            </div>
                                            {task.status === 'COMPLETED' && (
                                                <Badge variant="success" className="flex-shrink-0">
                                                    <CheckCircle2 size={14} className="mr-1" />
                                                    Completed
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                                            {task.description}
                                        </p>

                                        {/* Document Upload Section */}
                                        {task.isRequiredDoc && (
                                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-4 border border-neutral-200 dark:border-neutral-700">
                                                {task.documentStatus === 'NOT_UPLOADED' && (
                                                    <div>
                                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                                                            Please upload the required document
                                                        </p>
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(task.id, e)}
                                                                disabled={uploadingTaskId === task.id}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="pointer-events-none"
                                                                disabled={uploadingTaskId === task.id}
                                                            >
                                                                {uploadingTaskId === task.id ? (
                                                                    <>
                                                                        <Clock size={16} className="mr-2 animate-spin" />
                                                                        Uploading...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Upload size={16} className="mr-2" />
                                                                        Choose File
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </label>
                                                    </div>
                                                )}
                                                {task.documentStatus === 'PENDING_REVIEW' && (
                                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                        <Clock size={18} />
                                                        <div>
                                                            <p className="font-medium text-sm">Document Under Review</p>
                                                            <p className="text-xs">Your document is being reviewed by HR</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {task.documentStatus === 'APPROVED' && (
                                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                        <CheckCircle2 size={18} />
                                                        <div>
                                                            <p className="font-medium text-sm">Document Approved</p>
                                                            <a href={task.documentUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                                                                View Document
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                                {task.documentStatus === 'REJECTED' && (
                                                    <div>
                                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-3">
                                                            <AlertCircle size={18} />
                                                            <p className="font-medium text-sm">Document Rejected - Please Re-upload</p>
                                                        </div>
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(task.id, e)}
                                                                disabled={uploadingTaskId === task.id}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="pointer-events-none"
                                                            >
                                                                <Upload size={16} className="mr-2" />
                                                                Upload New File
                                                            </Button>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        {task.status !== 'COMPLETED' && (
                                            <Button
                                                onClick={() => handleTaskComplete(task.id, task.status)}
                                                disabled={task.isRequiredDoc && task.documentStatus !== 'APPROVED'}
                                                className="w-full sm:w-auto"
                                            >
                                                <CheckCircle2 size={16} className="mr-2" />
                                                Mark as Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Completion Message */}
                {progress === 100 && (
                    <Card className="p-6 mt-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-xl text-center">
                        <CheckCircle2 size={64} className="mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
                        <p className="text-green-100">
                            You've completed all your onboarding tasks. We're excited to have you on the team!
                        </p>
                    </Card>
                )}
            </div>

            {/* Footer */}
            <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                <p>Need help? Contact HR at hr@company.com</p>
            </div>
        </div>
    );
}
