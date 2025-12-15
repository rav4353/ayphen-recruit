import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, User, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface SchedulingDetails {
  candidateName: string;
  jobTitle: string;
  duration: number;
  interviewType: string;
  instructions?: string;
  interviewers: { id: string; name: string }[];
}

interface AvailableSlot {
  start: string;
  end: string;
  interviewerId: string;
  interviewerName: string;
}

export function InterviewSchedulePage() {
  const { token } = useParams<{ token: string }>();
  const [details, setDetails] = useState<SchedulingDetails | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  useEffect(() => {
    if (token) {
      fetchDetails();
    }
  }, [token]);

  useEffect(() => {
    if (token && details) {
      fetchSlots();
    }
  }, [token, details, currentWeekStart]);

  const fetchDetails = async () => {
    try {
      const response = await fetch(`/api/v1/schedule/${token}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to load scheduling details');
      }
      const data = await response.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'This scheduling link is invalid or has expired');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async () => {
    const startDate = currentWeekStart.toISOString();
    const endDate = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await fetch(
        `/api/v1/schedule/${token}/slots?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (err) {
      console.error('Failed to fetch slots', err);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !token) return;

    setIsBooking(true);
    try {
      const response = await fetch(`/api/v1/schedule/${token}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: selectedSlot.start,
          interviewerId: selectedSlot.interviewerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to book interview');
      }

      setIsBooked(true);
      toast.success('Interview scheduled successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to book interview');
    } finally {
      setIsBooking(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    
    // Don't allow navigating to past weeks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate >= today) {
      setCurrentWeekStart(newDate);
      setSelectedSlot(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getWeekDays = () => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSlotsForDay = (day: Date) => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.toDateString() === day.toDateString();
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading scheduling options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Link Unavailable
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  if (isBooked) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Interview Scheduled!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Your interview has been confirmed. You will receive a confirmation email shortly with all the details.
          </p>
          {selectedSlot && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <p className="font-medium text-green-800 dark:text-green-300">
                {formatDate(selectedSlot.start)} at {formatTime(selectedSlot.start)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                with {selectedSlot.interviewerName}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Schedule Your Interview
          </h1>
          {details && (
            <div className="space-y-2">
              <p className="text-neutral-600 dark:text-neutral-400">
                Hello <span className="font-medium">{details.candidateName}</span>, please select a time for your{' '}
                <span className="font-medium">{details.interviewType}</span> interview for the{' '}
                <span className="font-medium">{details.jobTitle}</span> position.
              </p>
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {details.duration} minutes
                </span>
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {details.interviewers.length} interviewer{details.interviewers.length !== 1 ? 's' : ''}
                </span>
              </div>
              {details.instructions && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">{details.instructions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateWeek('prev')}
              disabled={currentWeekStart <= new Date()}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span className="font-medium">
                {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Week View */}
          <div className="grid grid-cols-7 gap-2">
            {getWeekDays().map((day, index) => {
              const daySlots = getSlotsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <div key={index} className="text-center">
                  <div className={`text-xs font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-neutral-500'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm font-bold mb-2 ${isToday ? 'text-blue-600' : ''} ${isPast ? 'text-neutral-400' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {daySlots.length === 0 ? (
                      <div className="text-xs text-neutral-400 py-2">—</div>
                    ) : (
                      daySlots.map((slot, slotIndex) => (
                        <button
                          key={slotIndex}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full text-xs py-1.5 px-1 rounded transition-colors ${
                            selectedSlot === slot
                              ? 'bg-blue-600 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          {formatTime(slot.start)}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Slot Confirmation */}
          {selectedSlot && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    {formatDate(selectedSlot.start)} at {formatTime(selectedSlot.start)}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Interview with {selectedSlot.interviewerName} ({details?.duration} min)
                  </p>
                </div>
                <button
                  onClick={handleBookSlot}
                  disabled={isBooking}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Interview'
                  )}
                </button>
              </div>
            </div>
          )}

          {slots.length === 0 && (
            <div className="mt-6 text-center text-neutral-500 py-8">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No available slots for this week.</p>
              <p className="text-sm">Try navigating to the next week.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
