import { useState, useEffect } from 'react';
import {
    Search,
    MessageSquare,
    Clock,
    Building2,
    Tag,
    RefreshCw,
    ChevronDown,
    Send,
    Paperclip,
    MoreVertical,
    CheckCircle,
    AlertCircle,
    XCircle,
    Hash,
    MessageCircle,
    HelpCircle,
    Inbox,
    Lock
} from 'lucide-react';
import { Button } from '../../components/ui';
import toast from 'react-hot-toast';
import { superAdminApi, extractData } from '../../lib/api';
import { cn } from '../../lib/utils';

interface SupportTicket {
    id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
    tenantId: string;
    tenantName: string;
    userId: string;
    userName: string;
    userEmail: string;
    assignedTo?: string;
    assignedToName?: string;
    messages: TicketMessage[];
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}

interface TicketMessage {
    id: string;
    content: string;
    isStaff: boolean;
    isInternal: boolean;
    authorName: string;
    authorEmail: string;
    attachments?: string[];
    createdAt: string;
}

export function SupportTicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [replyMessage, setReplyMessage] = useState('');
    const [isInternalReply, setIsInternalReply] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, priorityFilter]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const response = await superAdminApi.getSupportTickets({
                search: searchQuery,
                status: statusFilter === 'all' ? undefined : statusFilter,
                priority: priorityFilter === 'all' ? undefined : priorityFilter,
            });
            const data: any = extractData(response);

            const mappedTickets = data.data.map((t: any) => ({
                id: t.id,
                ticketNumber: t.id.substring(0, 8).toUpperCase(),
                subject: t.subject,
                description: t.description,
                category: 'general' as const,
                priority: t.priority,
                status: t.status,
                tenantId: t.tenantId,
                tenantName: t.tenant?.name || 'Unknown',
                userId: t.userId,
                userName: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Unknown',
                userEmail: t.user?.email || '',
                messages: [],
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            }));

            setTickets(mappedTickets);
        } catch (error) {
            toast.error('Failed to fetch tickets');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTicketDetails = async (id: string) => {
        try {
            const data: any = await superAdminApi.getSupportTicket(id).then(extractData);
            const mappedTicket = {
                id: data.id,
                ticketNumber: data.id.substring(0, 8).toUpperCase(),
                subject: data.subject,
                description: data.description,
                category: 'general' as const,
                priority: data.priority,
                status: data.status,
                tenantId: data.tenantId,
                tenantName: data.tenant?.name || 'Unknown',
                userId: data.userId,
                userName: data.user ? `${data.user.firstName} ${data.user.lastName}` : 'Unknown',
                userEmail: data.user?.email || '',
                messages: data.messages.map((m: any) => ({
                    id: m.id,
                    content: m.message,
                    isStaff: !!m.adminId,
                    isInternal: m.isInternal || false,
                    authorName: m.admin ? m.admin.name : (m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : 'Unknown'),
                    authorEmail: m.admin ? m.admin.email : (m.sender?.email || ''),
                    createdAt: m.createdAt,
                })),
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            };
            setSelectedTicket(mappedTicket);
        } catch (error) {
            toast.error('Failed to load ticket details');
        }
    };

    const handleSelectTicket = (ticket: SupportTicket) => {
        fetchTicketDetails(ticket.id);
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;

        setIsSending(true);
        try {
            await superAdminApi.addTicketMessage(selectedTicket.id, replyMessage, isInternalReply);
            toast.success(isInternalReply ? 'Internal note added' : 'Reply sent');
            setReplyMessage('');
            setIsInternalReply(false);
            fetchTicketDetails(selectedTicket.id);
        } catch (error) {
            toast.error('Failed to send reply');
        } finally {
            setIsSending(false);
        }
    };

    const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
        try {
            await superAdminApi.updateTicketStatus(ticketId, newStatus);
            toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
            fetchTickets();
            if (selectedTicket?.id === ticketId) {
                fetchTicketDetails(ticketId);
            }
        } catch (error) {
            toast.error('Failed to update ticket status');
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            case 'high':
                return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
            case 'medium':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default:
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'in_progress':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'waiting_response':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            case 'resolved':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'closed':
                return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
            default:
                return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
        }
    };

    const filteredTickets = tickets.filter((ticket) => {
        if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                ticket.subject.toLowerCase().includes(query) ||
                ticket.ticketNumber.toLowerCase().includes(query) ||
                ticket.tenantName.toLowerCase().includes(query) ||
                ticket.userName.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">Omni-Channel Support</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium italic">
                        Real-time resolution desk & tenant advocacy hub
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Desk Status: Active</span>
                    </div>
                    <Button
                        variant="outline"
                        className="h-11 w-11 p-0 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all active:scale-90 shadow-sm"
                        onClick={fetchTickets}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin text-red-500' : 'text-neutral-500'} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Left Panel: Ticket List */}
                <div className="w-full lg:w-[400px] flex flex-col gap-4 min-h-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors" size={20} />
                            <input
                                placeholder="Search by #ID, User, or Org..."
                                className="w-full h-12 pl-12 pr-6 bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl text-sm font-bold placeholder-neutral-400 focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <div className="relative flex-1">
                            <select
                                className="w-full h-11 pl-4 pr-10 bg-neutral-50 dark:bg-neutral-800 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-500 appearance-none cursor-pointer focus:border-neutral-200"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Status: ALL</option>
                                <option value="open">OPEN</option>
                                <option value="in_progress">IN PROGRESS</option>
                                <option value="waiting_response">WAITING</option>
                                <option value="resolved">RESOLVED</option>
                                <option value="closed">CLOSED</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                        <div className="relative flex-1">
                            <select
                                className="w-full h-11 pl-4 pr-10 bg-neutral-50 dark:bg-neutral-800 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-500 appearance-none cursor-pointer focus:border-neutral-200"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="all">SLA: ALL</option>
                                <option value="urgent">URGENT</option>
                                <option value="high">HIGH</option>
                                <option value="medium">MEDIUM</option>
                                <option value="low">LOW</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                                <Inbox size={48} className="mb-4 text-neutral-200 dark:text-neutral-800" />
                                <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Queue Purged</p>
                                <p className="text-[10px] font-medium mt-1">No tickets matching your filters</p>
                            </div>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => handleSelectTicket(ticket)}
                                    className={cn(
                                        "w-full text-left p-5 rounded-3xl transition-all relative group overflow-hidden border",
                                        selectedTicket?.id === ticket.id
                                            ? "bg-red-500 shadow-xl shadow-red-500/10 border-red-500"
                                            : "bg-neutral-50 dark:bg-neutral-800/20 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4 relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={cn(
                                                    "text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg border",
                                                    selectedTicket?.id === ticket.id ? "bg-white/20 text-white border-white/20" : getPriorityBadge(ticket.priority)
                                                )}>
                                                    #{ticket.ticketNumber}
                                                </span>
                                            </div>
                                            <h3 className={cn("text-sm font-bold truncate tracking-tight transition-colors", selectedTicket?.id === ticket.id ? "text-white" : "text-neutral-900 dark:text-white")}>
                                                {ticket.subject}
                                            </h3>
                                            <div className={cn("flex items-center gap-3 mt-3 text-[10px] font-black uppercase tracking-widest opacity-60", selectedTicket?.id === ticket.id ? "text-white" : "text-neutral-500")}>
                                                <span className="flex items-center gap-1.5"><Building2 size={10} />{ticket.tenantName}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={10} />{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.5)]",
                                            ticket.status === 'open' ? "bg-red-500" : ticket.status === 'resolved' ? "bg-emerald-500" : "bg-neutral-300"
                                        )} />
                                    </div>
                                    {selectedTicket?.id === ticket.id && (
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 blur-3xl rounded-full" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Conversation View */}
                <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] shadow-sm overflow-hidden">
                    {selectedTicket ? (
                        <>
                            {/* Conversational Header */}
                            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50/50 dark:bg-transparent">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                            <MessageCircle size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">CASE #{selectedTicket.ticketNumber}</h2>
                                                <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border", getStatusBadge(selectedTicket.status))}>
                                                    {selectedTicket.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-neutral-500 mt-1">{selectedTicket.subject}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="hidden sm:flex flex-col items-end mr-4">
                                            <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight">{selectedTicket.userName}</p>
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{selectedTicket.userEmail}</p>
                                        </div>
                                        <div className="relative group/more">
                                            <button className="h-11 w-11 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm">
                                                <MoreVertical size={18} />
                                            </button>
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl shadow-2xl opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all z-20 overflow-hidden py-1">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                                                    className="w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                                >
                                                    <AlertCircle size={14} className="text-amber-500" />
                                                    Set In Progress
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                                                    className="w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-50 dark:hover:bg-neutral-700 transition-colors"
                                                >
                                                    <CheckCircle size={14} />
                                                    Mark Resolved
                                                </button>
                                                <div className="h-px bg-neutral-100 dark:bg-neutral-700 mx-4" />
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                                                    className="w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-neutral-700 transition-colors"
                                                >
                                                    <XCircle size={14} />
                                                    Deactivate Case
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                        <Tag size={12} className="text-blue-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{selectedTicket.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                        <Hash size={12} className="text-orange-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">{selectedTicket.tenantName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Thread */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-neutral-50/20 dark:bg-transparent">
                                {/* The Original Issue Description */}
                                <div className="flex justify-center">
                                    <div className="max-w-2xl w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center font-black text-neutral-500">
                                                {selectedTicket.userName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{selectedTicket.userName}</p>
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Initial Report • {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                                            {selectedTicket.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4">
                                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Correspondence Log</span>
                                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
                                </div>

                                {selectedTicket.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={cn("flex flex-col animate-scale-in", message.isStaff ? 'items-end ml-12' : 'items-start mr-12')}
                                    >
                                        <div className={cn(
                                            "max-w-xl group relative p-6 rounded-[2rem] shadow-sm transition-all",
                                            message.isInternal
                                                ? 'bg-amber-500/5 border-2 border-amber-500/20 rounded-tr-none'
                                                : message.isStaff
                                                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-tr-none'
                                                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-tl-none'
                                        )}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    message.isStaff ? "text-white/60 dark:text-neutral-500" : "text-neutral-400"
                                                )}>
                                                    {message.authorName}
                                                </span>
                                                {message.isInternal && (
                                                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">INTERNAL NODE</span>
                                                )}
                                                {message.isStaff && !message.isInternal && (
                                                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">Staff Agent</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium leading-relaxed font-sans">{message.content}</p>
                                            <div className={cn(
                                                "mt-3 text-[9px] font-black uppercase tracking-widest opacity-40",
                                                message.isStaff ? "text-white" : "text-neutral-500"
                                            )}>
                                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Crisp Input Base */}
                            <div className="px-8 pb-8 pt-4 shrink-0">
                                <div className={cn(
                                    "p-2 rounded-[2.5rem] border shadow-2xl transition-all relative overflow-hidden",
                                    isInternalReply
                                        ? "bg-amber-50 dark:bg-amber-500/5 border-amber-500/30"
                                        : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                )}>
                                    <div className="flex items-end gap-3 px-4 py-2">
                                        <div className="flex flex-col gap-2 mb-2">
                                            <button
                                                onClick={() => setIsInternalReply(!isInternalReply)}
                                                className={cn(
                                                    "h-10 w-10 flex items-center justify-center rounded-2xl transition-all active:scale-90",
                                                    isInternalReply ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-neutral-50 dark:bg-neutral-700 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                                )}
                                                title="Internal Protocol"
                                            >
                                                <Lock size={18} />
                                            </button>
                                            <button className="h-10 w-10 flex items-center justify-center rounded-2xl bg-neutral-50 dark:bg-neutral-700 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all">
                                                <Paperclip size={18} />
                                            </button>
                                        </div>
                                        <textarea
                                            placeholder={isInternalReply ? "Drop an internal system note..." : "Compose your public response..."}
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            className="flex-1 min-h-[100px] max-h-[300px] py-3 bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 resize-none outline-none custom-scrollbar"
                                        />
                                        <div className="mb-2">
                                            <Button
                                                onClick={handleSendReply}
                                                disabled={!replyMessage.trim() || isSending}
                                                className={cn(
                                                    "h-14 w-14 rounded-2xl flex items-center justify-center p-0 shadow-xl transition-all active:scale-95",
                                                    isInternalReply
                                                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                                                        : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                                )}
                                            >
                                                <Send size={20} />
                                            </Button>
                                        </div>
                                    </div>
                                    {isInternalReply && (
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded-full">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">INCIDENT PROTOCOLS</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none overflow-hidden flex flex-wrap gap-12 p-12 justify-center">
                                {[...Array(20)].map((_, i) => <HelpCircle key={i} size={120} />)}
                            </div>
                            <div className="relative z-10 max-w-sm">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mb-8 mx-auto shadow-inner">
                                    <MessageSquare size={40} className="text-neutral-300" />
                                </div>
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Zero-State Comms</h3>
                                <p className="text-sm font-medium text-neutral-500 mt-2 leading-relaxed">Choose a transmission from the operational queue to establish a secure resolution channel.</p>
                                <div className="mt-8 flex justify-center">
                                    <div className="px-6 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-xl">
                                        <Inbox size={18} className="text-red-500" />
                                        <span className="text-xs font-black uppercase tracking-widest text-neutral-500">Queue Depth: {tickets.length} Units</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
