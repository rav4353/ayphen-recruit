import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Calendar, Clock, MapPin, Video } from 'lucide-react';
import { interviewsApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';

export const InterviewConfirmationPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [interviewData, setInterviewData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const confirmInterview = async () => {
            if (!token) return;
            try {
                const response = await interviewsApi.confirm(token);
                const data = response.data?.data || response.data;
                setInterviewData(data.interview);
                setStatus('success');
            } catch (error: any) {
                console.error('Failed to confirm interview:', error);
                setStatus('error');
                setErrorMessage(error.response?.data?.message || 'Invalid or expired confirmation link.');
            }
        };

        confirmInterview();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-sans text-[#1e293b]">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl opacity-50" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative z-10"
            >
                {status === 'loading' && (
                    <div className="p-12 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Confirming your interview...</h1>
                        <p className="text-slate-500">Please wait while we process your confirmation.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        {/* Success Header with Gradient */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                                </svg>
                            </div>
                            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-1">Interview Confirmed!</h1>
                            <p className="text-blue-100 font-medium">We've added this to our calendar.</p>
                        </div>

                        <div className="p-8">
                            <p className="text-slate-600 mb-6 text-center leading-relaxed">
                                Thank you for confirming. We're looking forward to meeting you! A calendar invitation has been sent to your email.
                            </p>

                            {interviewData && (
                                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Date</div>
                                                <div className="text-slate-900 font-semibold">{new Date(interviewData.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                                <Clock className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Time</div>
                                                <div className="text-slate-900 font-semibold">{new Date(interviewData.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({interviewData.duration} mins)</div>
                                            </div>
                                        </div>

                                        {interviewData.location && (
                                            <div className="flex items-start gap-4">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    {interviewData.type === 'VIDEO' ? <Video className="w-5 h-5 text-blue-600" /> : <MapPin className="w-5 h-5 text-blue-600" />}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{interviewData.type === 'VIDEO' ? 'Meeting Link' : 'Location'}</div>
                                                    <div className="text-slate-900 font-semibold break-all">{interviewData.location}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="text-center">
                                <p className="text-sm text-slate-400 mb-4">You can safely close this window now.</p>
                                <div className="h-1 w-20 bg-slate-100 mx-auto rounded-full" />
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Confirmation Failed</h1>
                        <p className="text-slate-500 mb-8">{errorMessage}</p>
                        <Link to="/">
                            <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all">
                                Return to Homepage
                            </Button>
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Footer info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 text-center"
            >
                <p className="text-slate-400 text-sm font-medium">
                    Powered by <span className="text-slate-600 font-bold">TalentX</span>
                </p>
            </motion.div>
        </div>
    );
};
