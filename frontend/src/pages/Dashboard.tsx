import { motion } from 'framer-motion';
import {
  Plus,
  Check,
  Circle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Link as LinkIcon,
  Activity,
  User,
  Briefcase,
  Users,
  TrendingUp,
  Target,
  Mail,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../services/api';
import { Todo, TodoCreate, TodoUpdate, Email, Reminder, ReminderCreate, ReminderUpdate, ReminderPriority } from '../types';

interface CalendarEvent {
  id: string;
  summary: string;
  start_datetime: string;
  end_datetime: string;
  description?: string;
  location?: string;
}

interface DashboardStats {
  totalApplications: number;
  totalContacts: number;
  appliedThisWeek: number;
  interviewsScheduled: number;
  responseRate: number;
  averageResponseTime: number;
}

interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  date_applied: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
}

// Clean Loading Component
const CleanLoader = () => (
  <motion.div
    className='flex items-center justify-center h-64'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className='loading-accent' />
    <span className='ml-3 text-neutral-600'>Loading dashboard...</span>
  </motion.div>
);

// Calendar component
const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get preview events
  const { data: googleStatusData } = useQuery({
    queryKey: ['settings', 'google_status'],
    queryFn: () => api.get('/settings/google/status').then(res => res.data),
    retry: false,
  });
  const googleConnected = !!googleStatusData?.google_connected;

  const { data: previewEvents = [] } = useQuery({
    queryKey: ['dashboard', 'preview_events'],
    queryFn: () =>
      googleConnected
        ? api.get('/calendar-events/?limit=5&upcoming_only=true').then(res => res.data)
        : Promise.resolve([]),
    enabled: googleConnected,
    retry: false,
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const hasEvent = (day: number | null) => {
    if (!day || !googleConnected) return false;
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return previewEvents.some((event: CalendarEvent) => {
      const eventDate = new Date(event.start_datetime);
      return (
        eventDate.getDate() === checkDate.getDate() &&
        eventDate.getMonth() === checkDate.getMonth() &&
        eventDate.getFullYear() === checkDate.getFullYear()
      );
    });
  };

  const getTodayEvents = () => {
    if (!googleConnected) return [];
    const todayEvents = previewEvents.filter((event: CalendarEvent) => {
      const eventDate = new Date(event.start_datetime);
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    });
    return todayEvents.slice(0, 3); // Show max 3 events
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/settings/google/connect');
      if (!res.ok) throw new Error('Failed to get Google connect URL');
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        console.error('No auth URL returned from server.');
      }
    } catch (e: any) {
      console.error('Failed to connect Google:', e.message || 'Unknown error');
    }
  };

  return (
    <div className="card h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Calendar</h2>
          </div>
          <div className="text-sm text-neutral-500">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>

        {!googleConnected ? (
          <div className='flex flex-col items-center justify-center py-8'>
            <AlertCircle className='h-8 w-8 text-neutral-400 mb-3' />
            <div className='mb-3 text-neutral-600 text-sm text-center'>Connect Google Calendar</div>
            <button
              onClick={handleConnectGoogle}
              className='btn-accent text-sm'
            >
              <LinkIcon className='h-4 w-4 mr-2' /> Connect
            </button>
          </div>
        ) : (
          <>
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-600" />
              </button>
              <span className="text-sm font-medium text-neutral-700">Today</span>
              <button 
                onClick={handleNextMonth}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-neutral-600" />
              </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-xs text-neutral-500 text-center font-medium py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {getDaysInMonth(currentDate).map((day, index) => (
                <div
                  key={index}
                  className={`
                    h-8 flex items-center justify-center text-sm relative
                    ${day === null ? '' : 'hover:bg-neutral-50 rounded-lg cursor-pointer'}
                    ${isToday(day) ? 'bg-blue-100 text-blue-700 font-semibold rounded-lg' : ''}
                    ${day && !isToday(day) ? 'text-neutral-700' : ''}
                  `}
                >
                  {day}
                  {hasEvent(day) && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Today's events */}
            {getTodayEvents().length > 0 && (
              <div className="border-t border-neutral-100 pt-4">
                <div className="text-xs font-medium text-neutral-700 mb-2">Today's Events</div>
                <div className="space-y-2">
                  {getTodayEvents().map((event: CalendarEvent) => (
                    <div key={event.id} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="text-neutral-600 truncate">
                        {new Date(event.start_datetime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} {event.summary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Todos widget
const TodosWidget = () => {
  const [newTodo, setNewTodo] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const queryClient = useQueryClient();

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get('/todos/').then(res => res.data),
    staleTime: 30 * 1000,
  });

  const createTodoMutation = useMutation({
    mutationFn: (todo: TodoCreate) => api.post('/todos/', todo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setNewTodo('');
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: TodoUpdate }) =>
      api.put(`/todos/${id}`, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // const deleteTodoMutation = useMutation({
  //   mutationFn: (id: string) => api.delete(`/todos/${id}`),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['todos'] });
  //   },
  // });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      createTodoMutation.mutate({ text: newTodo.trim() });
    }
  };

  const handleToggleTodo = (todo: Todo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      update: { completed: !todo.completed }
    });
  };

  const activeTodos = todos.filter((todo: Todo) => !todo.completed);
  const completedTodos = todos.filter((todo: Todo) => todo.completed);

  const getStatusColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200';
      case 'medium': return 'bg-yellow-100 border-yellow-200';
      default: return 'bg-green-100 border-green-200';
    }
  };

  return (
    <div>
      {/* Add new todo */}
      <form onSubmit={handleAddTodo} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="form-input flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={!newTodo.trim() || createTodoMutation.isPending}
            className="btn-accent px-3"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Active todos */}
      <div className="space-y-2 mb-4">
        {activeTodos.slice(0, 4).map((todo: Todo) => (
          <div key={todo.id} className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg group transition-colors">
            <button
              onClick={() => handleToggleTodo(todo)}
              className="flex-shrink-0"
            >
              <Circle className="h-4 w-4 text-neutral-400 hover:text-green-600 transition-colors" />
            </button>
            <span className="flex-1 text-sm text-neutral-700">{todo.text}</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor('medium')}`}></div>
          </div>
        ))}
        
        {activeTodos.length === 0 && (
          <div className="text-sm text-neutral-500 py-4 text-center">
            No active tasks. Add one above!
          </div>
        )}
      </div>

      {/* Show completed todos toggle */}
      {completedTodos.length > 0 && (
        <div className="border-t border-neutral-100 pt-4 mt-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTodos.length})
          </button>
          
          {showCompleted && (
            <div className="space-y-2 mt-3">
              {completedTodos.map((todo: Todo) => (
                <div key={todo.id} className="flex items-center gap-3 p-2 opacity-60">
                  <button
                    onClick={() => handleToggleTodo(todo)}
                    className="flex-shrink-0"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </button>
                  <span className="flex-1 text-sm text-neutral-700 line-through">{todo.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Reminders widget
const RemindersWidget = () => {
  const [newReminder, setNewReminder] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const queryClient = useQueryClient();

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.get('/reminders/').then(res => res.data),
    staleTime: 30 * 1000,
  });

  const createReminderMutation = useMutation({
    mutationFn: (reminder: ReminderCreate) => api.post('/reminders/', reminder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setNewReminder('');
      setNewReminderTime('');
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: ReminderUpdate }) =>
      api.put(`/reminders/${id}`, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReminder.trim() && newReminderTime.trim()) {
      // Create reminder for today by default
      const today = new Date();
      createReminderMutation.mutate({
        title: newReminder.trim(),
        reminder_time: newReminderTime.trim(),
        reminder_date: today.toISOString(),
        priority: ReminderPriority.MEDIUM
      });
    }
  };

  const handleToggleReminder = (reminder: Reminder) => {
    updateReminderMutation.mutate({
      id: reminder.id,
      update: { completed: !reminder.completed }
    });
  };

  // Filter to show only incomplete reminders or limit completed ones
  const activeReminders = reminders.filter((reminder: Reminder) => !reminder.completed);
  const completedReminders = reminders.filter((reminder: Reminder) => reminder.completed);

  // Group active reminders by relative date
  const groupedReminders = activeReminders.reduce((acc: Record<string, Reminder[]>, reminder: Reminder) => {
    const reminderDate = new Date(reminder.reminder_date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    let group = 'later';
    if (reminderDate.toDateString() === today.toDateString()) {
      group = 'today';
    } else if (reminderDate.toDateString() === tomorrow.toDateString()) {
      group = 'tomorrow';
    } else if (reminderDate > tomorrow) {
      const dayOfWeek = reminderDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      group = dayOfWeek;
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(reminder);
    return acc;
  }, {});

  const getPriorityColor = (priority: ReminderPriority) => {
    switch (priority) {
      case ReminderPriority.HIGH: return 'bg-red-400';
      case ReminderPriority.MEDIUM: return 'bg-orange-400';
      case ReminderPriority.LOW: return 'bg-green-400';
      default: return 'bg-orange-400';
    }
  };

  return (
    <div>
      {/* Reminders header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <h3 className="text-base font-medium text-neutral-900">Reminders</h3>
        </div>
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-neutral-400" />
          <span className="text-sm text-neutral-500">Set</span>
        </div>
      </div>

      {/* Add new reminder */}
      <form onSubmit={handleAddReminder} className="mb-4">
        <div className="space-y-2">
          <input
            type="text"
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            placeholder="Add a new reminder..."
            className="form-input w-full text-sm"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newReminderTime}
              onChange={(e) => setNewReminderTime(e.target.value)}
              placeholder="Time (e.g. 2:30 pm)"
              className="form-input flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!newReminder.trim() || !newReminderTime.trim() || createReminderMutation.isPending}
              className="btn-accent px-3"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Active reminders */}
      <div className="space-y-3 mb-4">
        {Object.entries(groupedReminders).map(([type, items]) => (
          <div key={type}>
            <div className="text-xs font-medium text-neutral-500 mb-1 capitalize">
              {type === 'today' ? 'Today' : type === 'tomorrow' ? 'Tomorrow' : type}
            </div>
            {(items as Reminder[]).map((reminder: Reminder) => (
              <div key={reminder.id} className="flex items-center gap-3 ml-2 mb-1 p-2 hover:bg-neutral-50 rounded-lg group transition-colors">
                <button
                  onClick={() => handleToggleReminder(reminder)}
                  className="flex-shrink-0"
                >
                  <Circle className="h-4 w-4 text-neutral-400 hover:text-orange-600 transition-colors" />
                </button>
                <div className={`w-2 h-2 ${getPriorityColor(reminder.priority)} rounded-full flex-shrink-0`}></div>
                <span className="text-xs text-neutral-600 font-medium">{reminder.reminder_time}</span>
                <span className="text-xs flex-1 text-neutral-700">
                  {reminder.title}
                </span>
              </div>
            ))}
          </div>
        ))}
        
        {Object.keys(groupedReminders).length === 0 && activeReminders.length === 0 && (
          <div className="text-sm text-neutral-500 py-4 text-center">
            No active reminders. Add one above!
          </div>
        )}
      </div>

      {/* Show completed reminders toggle */}
      {completedReminders.length > 0 && (
        <div className="border-t border-neutral-100 pt-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedReminders.length})
          </button>
          
          {showCompleted && (
            <div className="space-y-1 mt-2">
              {completedReminders.slice(0, 3).map((reminder: Reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 ml-2 p-2 opacity-60">
                  <button
                    onClick={() => handleToggleReminder(reminder)}
                    className="flex-shrink-0"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </button>
                  <div className={`w-2 h-2 ${getPriorityColor(reminder.priority)} rounded-full flex-shrink-0`}></div>
                  <span className="text-xs text-neutral-600 font-medium">{reminder.reminder_time}</span>
                  <span className="text-xs flex-1 text-neutral-500 line-through">
                    {reminder.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    totalContacts: 0,
    appliedThisWeek: 0,
    interviewsScheduled: 0,
    responseRate: 0,
    averageResponseTime: 0,
  });
  const [loading, setLoading] = useState(true);
  // const [hasData, setHasData] = useState(false);

  // Google connection status
  const { data: googleStatusData } = useQuery({
    queryKey: ['settings', 'google_status'],
    queryFn: () => api.get('/settings/google/status').then(res => res.data),
    retry: false,
  });
  const googleConnected = !!googleStatusData?.google_connected;

  // Fetch preview emails (if connected) - today and yesterday
  const { data: previewEmails = [] } = useQuery({
    queryKey: ['dashboard', 'preview_emails'],
    queryFn: () => {
      if (!googleConnected) return Promise.resolve([]);
      
      // Calculate date for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateFrom = yesterday.toISOString().split('T')[0];
      
      return api.get(`/emails/?date_from=${dateFrom}&limit=10`).then(res => res.data);
    },
    enabled: googleConnected,
    retry: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [applicationsRes, contactsRes] = await Promise.all([
          api.get('/applications/'),
          api.get('/contacts/'),
        ]);

        const applications: Application[] = applicationsRes.data;
        const contacts: Contact[] = contactsRes.data;

        const totalApps = applications.length;
        const totalContacts = contacts.length;

        // if (totalApps > 0 || totalContacts > 0) {
        //   setHasData(true);
        // }

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const appliedThisWeek = applications.filter(
          (app: Application) => new Date(app.date_applied) >= oneWeekAgo,
        ).length;

        const interviewsScheduled = applications.filter(
          (app: Application) => app.status === 'interview',
        ).length;

        const responseCount = applications.filter(
          (app: Application) =>
            app.status === 'interview' || app.status === 'offer' || app.status === 'rejected',
        ).length;

        const responseRate = totalApps > 0 ? (responseCount / totalApps) * 100 : 0;
        const avgResponseTime = responseCount > 0 ? 5.2 : 0;

        setStats({
          totalApplications: totalApps,
          totalContacts,
          appliedThisWeek,
          interviewsScheduled,
          responseRate,
          averageResponseTime: avgResponseTime,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Google connect handler
  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/settings/google/connect');
      if (!res.ok) throw new Error('Failed to get Google connect URL');
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        console.error('No auth URL returned from server.');
      }
    } catch (e: any) {
      console.error('Failed to connect Google:', e.message || 'Unknown error');
    }
  };

  if (loading) {
    return <CleanLoader />;
  }

  // Stats cards data
  const statCards = [
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: Briefcase,
      href: '/applications',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Network Contacts',
      value: stats.totalContacts,
      icon: Users,
      href: '/contacts',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Applied This Week',
      value: stats.appliedThisWeek,
      icon: TrendingUp,
      href: '/applications',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Interviews Scheduled',
      value: stats.interviewsScheduled,
      icon: Target,
      href: '/applications',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
  ];

  return (
    <div className='min-h-screen bg-neutral-50'>
      <div className="content-max-width py-6 px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='mb-6'
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-neutral-900'>Dashboard</h1>
              <p className='text-neutral-600'>Your career progress at a glance</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              to={stat.href}
              className="card-interactive group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                      {stat.value}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors">
                  {stat.title}
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Main Grid Layout - Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
          
          {/* Inbox Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="card h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-neutral-900">Inbox</h2>
                  </div>
                  <Link to="/emails" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                    View all →
                  </Link>
                </div>
                
                {!googleConnected ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <AlertCircle className='h-8 w-8 text-neutral-400 mb-3' />
                    <div className='mb-4 text-neutral-600 text-sm text-center'>Gmail not connected</div>
                    <button
                      onClick={handleConnectGoogle}
                      className='btn-accent text-sm'
                    >
                      <LinkIcon className='h-4 w-4 mr-2' /> Connect
                    </button>
                  </div>
                ) : previewEmails.length === 0 ? (
                  <div className='text-neutral-500 text-sm py-12 text-center'>No recent emails found.</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {previewEmails.slice(0, 5).map((email: Email) => (
                      <Link 
                        key={email.id}
                        to="/emails"
                        className="block hover:bg-neutral-50 p-3 -m-3 rounded-lg transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {email.sender_name ? (
                              <span className="text-xs font-medium text-blue-700">
                                {email.sender_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            ) : (
                              <User className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm text-neutral-900 truncate">
                                {email.sender_name || email.sender_email}
                              </div>
                              <div className="text-xs text-neutral-400 ml-2 flex-shrink-0">
                                {email.date_received ? new Date(email.date_received).toLocaleDateString([], { 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : ''}
                              </div>
                            </div>
                            <div className="text-sm text-neutral-600 truncate">
                              {email.subject || 'No Subject'}
                            </div>
                            <div className="text-xs text-neutral-500 truncate mt-1">
                              {email.body_text?.slice(0, 80) || 'No preview available'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Combined To-dos and Reminders Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="card h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-neutral-900">To-dos</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-500">Active</span>
                  </div>
                </div>
                
                {/* Todos Section */}
                <div className="mb-6">
                  <TodosWidget />
                </div>

                {/* Reminders Section */}
                <div className="border-t border-neutral-100 pt-4">
                  <RemindersWidget />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Calendar Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <CalendarWidget />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
