import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Search,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  Link,
  Building,
  User,
  CheckCircle,
  AlertCircle,
  X,
  BarChart3,
  Video
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import ConnectGoogle from '../components/ConnectGoogle';

interface CalendarEvent {
  id: string;
  calendar_id: string;
  summary: string;
  description?: string;
  location?: string;
  start_datetime: string;
  end_datetime: string;
  timezone?: string;
  is_all_day: boolean;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  event_type?: 'INTERVIEW' | 'MEETING' | 'CALL' | 'DEADLINE' | 'NETWORKING' | 'CONFERENCE' | 'OTHER';
  is_hiring_related: boolean;
  confidence_score?: string;
  organizer_email?: string;
  organizer_name?: string;
  attendees?: string;
  meeting_link?: string;
  company_name?: string;
  job_title?: string;
  application_id?: string;
  interview_round?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const EventStatusColors = {
  CONFIRMED: 'bg-green-100 text-green-800',
  TENTATIVE: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const EventTypeColors = {
  INTERVIEW: 'bg-blue-100 text-blue-800',
  MEETING: 'bg-purple-100 text-purple-800',
  CALL: 'bg-green-100 text-green-800',
  DEADLINE: 'bg-red-100 text-red-800',
  NETWORKING: 'bg-orange-100 text-orange-800',
  CONFERENCE: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800'
};

const Calendar = () => {
  // All hooks must be called at the top level
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [hiringOnlyFilter, setHiringOnlyFilter] = useState(true);
  const [upcomingOnlyFilter, setUpcomingOnlyFilter] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Fetch calendar events
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar-events', { 
      search: searchTerm, 
      status: statusFilter, 
      type: typeFilter, 
      hiring: hiringOnlyFilter,
      upcoming: upcomingOnlyFilter 
    }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('event_type', typeFilter);
      if (hiringOnlyFilter) params.append('is_hiring_related', 'true');
      if (upcomingOnlyFilter) params.append('upcoming_only', 'true');
      
      return api.get(`/calendar-events/?${params.toString()}`).then(res => res.data);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: googleConnected === true, // Only run query when Google is connected
  });

  // Sync calendar events mutation
  const syncEventsMutation = useMutation({
    mutationFn: () => api.post('/calendar-events/sync'),
    onSuccess: () => {
      setShowSuccessMessage('Calendar sync started successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
      // Refetch after a delay to get updated data
      setTimeout(() => refetch(), 2000);
    },
    onError: (error: any) => {
      setShowSuccessMessage(`Sync failed: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setShowSuccessMessage(''), 5000);
    }
  });

  useEffect(() => {
    const checkGoogleStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/settings/google/status');
        if (!res.ok) throw new Error('Failed to check Google connection status');
        const data = await res.json();
        setGoogleConnected(!!data.google_connected);
      } catch (e: any) {
        setError(e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    checkGoogleStatus();
  }, []);

  // Early returns after all hooks
  if (loading) return <div>Loading calendar...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (googleConnected === false) {
    return <ConnectGoogle message="Connect your Google account to view and sync your calendar events." />;
  }

  const handleSyncEvents = () => {
    setSyncing(true);
    syncEventsMutation.mutate();
    setTimeout(() => setSyncing(false), 3000);
  };

  const formatDateTime = (dateString: string, isAllDay?: boolean) => {
    const date = new Date(dateString);
    
    if (isAllDay) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilEvent = (dateString: string) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffMs = eventDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Past event';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  };

  const getConfidenceColor = (score?: string) => {
    if (!score) return 'text-gray-500';
    const num = parseFloat(score);
    if (num >= 0.8) return 'text-green-600';
    if (num >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const parseAttendees = (attendeesString?: string) => {
    if (!attendeesString) return [];
    try {
      return JSON.parse(attendeesString);
    } catch {
      return [];
    }
  };

  const isEventSoon = (dateString: string) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0; // Within 24 hours
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            {showSuccessMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-neutral-900">Calendar</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200">
              <CalendarIcon className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Google Calendar</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            Upcoming events and interviews from your Google Calendar
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleSyncEvents}
            disabled={syncing || syncEventsMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: syncing ? 1 : 1.02 }}
            whileTap={{ scale: syncing ? 1 : 0.98 }}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Calendar'}
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="TENTATIVE">Tentative</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
          >
            <option value="">All Types</option>
            <option value="INTERVIEW">Interview</option>
            <option value="MEETING">Meeting</option>
            <option value="CALL">Call</option>
            <option value="DEADLINE">Deadline</option>
            <option value="NETWORKING">Networking</option>
            <option value="CONFERENCE">Conference</option>
            <option value="OTHER">Other</option>
          </select>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hiringOnlyFilter}
              onChange={(e) => setHiringOnlyFilter(e.target.checked)}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">Hiring-related only</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={upcomingOnlyFilter}
              onChange={(e) => setUpcomingOnlyFilter(e.target.checked)}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">Upcoming only</span>
          </label>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarIcon className="h-8 w-8 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">No events found</p>
            <p className="text-sm text-neutral-500">
              {hiringOnlyFilter ? 'No hiring-related events found. Try syncing your calendar or adjusting filters.' : 'No events match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {events.map((event: CalendarEvent) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 hover:bg-neutral-50 cursor-pointer ${isEventSoon(event.start_datetime) ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-neutral-900 truncate">{event.summary}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${EventStatusColors[event.status]}`}>
                          {event.status.toLowerCase()}
                        </span>
                        {event.event_type && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${EventTypeColors[event.event_type]}`}>
                            {event.event_type.toLowerCase()}
                          </span>
                        )}
                        {event.is_hiring_related && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Hiring
                          </span>
                        )}
                        {isEventSoon(event.start_datetime) && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(event.start_datetime, event.is_all_day)}
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        {getTimeUntilEvent(event.start_datetime)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location.substring(0, 30)}...
                        </div>
                      )}
                      {event.company_name && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {event.company_name}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      {event.organizer_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {event.organizer_name}
                        </div>
                      )}
                      {parseAttendees(event.attendees).length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {parseAttendees(event.attendees).length} attendees
                        </div>
                      )}
                      {event.meeting_link && (
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          Video meeting
                        </div>
                      )}
                      {event.confidence_score && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span className={getConfidenceColor(event.confidence_score)}>
                            {Math.round(parseFloat(event.confidence_score) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-neutral-500 mt-2 line-clamp-2">
                        {event.description.substring(0, 150)}...
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {event.meeting_link && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(event.meeting_link, '_blank');
                        }}
                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Link className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">{selectedEvent.summary}</h2>
                    <div className="flex items-center gap-4 text-sm text-neutral-600 mb-4">
                      <span>{formatDateTime(selectedEvent.start_datetime, selectedEvent.is_all_day)}</span>
                      {!selectedEvent.is_all_day && (
                        <>
                          <span>to</span>
                          <span>{formatDateTime(selectedEvent.end_datetime)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${EventStatusColors[selectedEvent.status]}`}>
                        {selectedEvent.status.toLowerCase()}
                      </span>
                      {selectedEvent.event_type && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${EventTypeColors[selectedEvent.event_type]}`}>
                          {selectedEvent.event_type.toLowerCase()}
                        </span>
                      )}
                      {selectedEvent.is_hiring_related && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Hiring
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-4">
                  {selectedEvent.description && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Description</h4>
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedEvent.description}</p>
                    </div>
                  )}
                  
                  {selectedEvent.location && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Location</h4>
                      <p className="text-sm text-neutral-700">{selectedEvent.location}</p>
                    </div>
                  )}
                  
                  {selectedEvent.organizer_name && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Organizer</h4>
                      <p className="text-sm text-neutral-700">
                        {selectedEvent.organizer_name} ({selectedEvent.organizer_email})
                      </p>
                    </div>
                  )}
                  
                  {parseAttendees(selectedEvent.attendees).length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Attendees</h4>
                      <div className="space-y-1">
                        {parseAttendees(selectedEvent.attendees).map((attendee: any, index: number) => (
                          <p key={index} className="text-sm text-neutral-700">
                            {attendee.name || attendee.email}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedEvent.meeting_link && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Meeting Link</h4>
                      <a
                        href={selectedEvent.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                      >
                        {selectedEvent.meeting_link}
                      </a>
                    </div>
                  )}
                  
                  {(selectedEvent.company_name || selectedEvent.job_title || selectedEvent.interview_round) && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Job Details</h4>
                      <div className="space-y-1">
                        {selectedEvent.company_name && (
                          <p className="text-sm text-neutral-700">Company: {selectedEvent.company_name}</p>
                        )}
                        {selectedEvent.job_title && (
                          <p className="text-sm text-neutral-700">Position: {selectedEvent.job_title}</p>
                        )}
                        {selectedEvent.interview_round && (
                          <p className="text-sm text-neutral-700">Round: {selectedEvent.interview_round}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Calendar; 