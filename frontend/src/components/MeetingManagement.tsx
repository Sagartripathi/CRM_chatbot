import React, { useState, useEffect } from "react";
import { useAuth, apiClient } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import Layout from "./Layout";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Grid3x3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Calendar } from "./ui/calendar";
import {
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  subDays,
  startOfDay,
  addHours,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
} from "date-fns";

function MeetingManagement() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [calendarView, setCalendarView] = useState<"day" | "week">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [meetingDetailDialogOpen, setMeetingDetailDialogOpen] = useState(false);
  const [selectedMeetingForDetail, setSelectedMeetingForDetail] =
    useState(null);
  const [cardsDateFilter, setCardsDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [newMeeting, setNewMeeting] = useState({
    lead_id: "",
    title: "",
    start_time: "",
    duration_minutes: 60,
    notes: "",
  });

  // Normalize Google Calendar format to standard meeting format
  const normalizeMeeting = (meeting: any) => {
    // Check if it's a Google Calendar format
    if (meeting.start?.dateTime || meeting.start?.date) {
      const startTime = meeting.start?.dateTime || meeting.start?.date;
      const endTime = meeting.end?.dateTime || meeting.end?.date;
      const body = meeting.body || {};

      return {
        id: meeting.id,
        lead_id: meeting.lead_id || "unknown",
        title:
          body.meeting_notes ||
          meeting.description?.split("\n")[0] ||
          `Meeting with ${
            body.lead_frist_name || body.lead_first_name || "Lead"
          }`,
        start_time: startTime,
        end_time: endTime,
        notes: body.meeting_notes || meeting.description || "",
        status: meeting.status || "confirmed",
        organizer_id: meeting.organizer_id || "system",
        created_at: meeting.created || new Date().toISOString(),
        updated_at: meeting.updated || new Date().toISOString(),
        // Store lead info from body for display
        lead_name:
          `${body.lead_frist_name || body.lead_first_name || ""} ${
            body.lead_last_name || ""
          }`.trim() || "Unknown Lead",
        lead_email: body.lead_email || "",
        // Store Google Meet link if available
        meet_link: meeting.conferenceData?.entryPoints?.[0]?.uri || null,
      };
    }
    // Already normalized format - ensure it has required fields
    if (!meeting.start_time && !meeting.end_time) {
      // Try to extract from nested structure
      const startTime = meeting.start?.dateTime || meeting.start?.date;
      const endTime = meeting.end?.dateTime || meeting.end?.date;
      if (startTime || endTime) {
        return {
          ...meeting,
          start_time: startTime || meeting.start_time,
          end_time: endTime || meeting.end_time,
        };
      }
    }
    return meeting;
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!user) {
        return;
      }

      const [meetingsResponse, leadsResponse] = await Promise.all([
        apiClient.get("/meetings"),
        apiClient.get("/leads"),
      ]);

      // Ensure we have valid data
      const meetingsData = Array.isArray(meetingsResponse.data)
        ? meetingsResponse.data
        : [];
      const leadsData = Array.isArray(leadsResponse.data)
        ? leadsResponse.data
        : [];

      // Normalize Google Calendar format meetings
      const normalizedMeetings = meetingsData
        .map((meeting) => {
          try {
            return normalizeMeeting(meeting);
          } catch (error) {
            return null;
          }
        })
        .filter((m) => m !== null);

      setMeetings(normalizedMeetings);
      setLeads(leadsData);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to access meetings data");
      } else {
        toast.error("Failed to load meetings data");
      }
      // Set empty arrays on error to prevent undefined issues
      setMeetings([]);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();

    if (!newMeeting.title || !newMeeting.start_time) {
      toast.error("Please provide a meeting title and time");
      return;
    }

    try {
      await apiClient.post("/meetings", {
        title: newMeeting.title,
        start_time: new Date(newMeeting.start_time).toISOString(),
        duration_minutes: newMeeting.duration_minutes,
        notes: newMeeting.notes || "",
      });

      toast.success("Meeting created successfully!");
      setCreateDialogOpen(false);
      setNewMeeting({
        lead_id: "",
        title: "",
        start_time: "",
        duration_minutes: 60,
        notes: "",
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create meeting");
    }
  };

  const handleEditMeeting = async (e) => {
    e.preventDefault();

    if (!selectedMeeting || !newMeeting.title || !newMeeting.start_time) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await apiClient.put(`/meetings/${selectedMeeting.id}`, {
        title: newMeeting.title,
        start_time: new Date(newMeeting.start_time).toISOString(),
        duration_minutes: newMeeting.duration_minutes,
        notes: newMeeting.notes || "",
      });

      toast.success("Meeting updated successfully!");
      setEditDialogOpen(false);
      setSelectedMeeting(null);
      setNewMeeting({
        lead_id: "",
        title: "",
        start_time: "",
        duration_minutes: 60,
        notes: "",
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update meeting");
    }
  };

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;

    try {
      await apiClient.delete(`/meetings/${selectedMeeting.id}`);
      toast.success("Meeting deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedMeeting(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete meeting");
    }
  };

  const handleUpdateStatus = async (meetingId, newStatus) => {
    try {
      await apiClient.patch(
        `/meetings/${meetingId}/status?status=${newStatus}`
      );
      toast.success(`Meeting ${newStatus}!`);
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to update meeting status"
      );
    }
  };

  const openEditDialog = (meeting) => {
    setSelectedMeeting(meeting);
    const startTime = new Date(meeting.start_time);
    const formattedTime = startTime.toISOString().slice(0, 16);
    const duration = Math.round(
      (new Date(meeting.end_time).getTime() - startTime.getTime()) / (1000 * 60)
    );

    setNewMeeting({
      lead_id: "",
      title: meeting.title || "",
      start_time: formattedTime,
      duration_minutes: duration,
      notes: meeting.notes || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (meeting) => {
    setSelectedMeeting(meeting);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      proposed: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      rescheduled: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || colors.proposed;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "proposed":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rescheduled":
        return <CalendarIcon className="h-4 w-4 text-blue-500" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLeadName = (meeting: any) => {
    // Try to get lead name from meeting object first (for Google Calendar format)
    if (meeting.lead_name) {
      return meeting.lead_name;
    }
    // Fall back to looking up in leads array
    const lead = leads.find((l) => l.id === meeting.lead_id);
    return lead ? `${lead.first_name} ${lead.last_name}` : "Unknown Lead";
  };

  // Calendar helper functions
  const getMeetingsForDate = (date: Date) => {
    if (!date) return [];
    return meetings.filter((meeting) => {
      if (!meeting.start_time) return false;
      try {
        const meetingDate = new Date(meeting.start_time);
        return isSameDay(meetingDate, date);
      } catch (error) {
        return false;
      }
    });
  };

  const getMeetingsForSelectedDate = () => {
    if (!selectedDate) return [];
    return getMeetingsForDate(selectedDate);
  };

  // Get dates that have meetings (for calendar highlighting)
  const getMeetingDates = () => {
    const dates = new Set<string>();
    meetings.forEach((meeting) => {
      if (meeting.start_time) {
        try {
          const meetingDate = new Date(meeting.start_time);
          dates.add(format(meetingDate, "yyyy-MM-dd"));
        } catch (error) {
          // Skip invalid dates
        }
      }
    });
    return dates;
  };

  // Google Calendar-style helper functions
  const getMeetingsForDay = (date: Date) => {
    if (!date || !meetings || meetings.length === 0) {
      return [];
    }

    const targetDateStr = format(date, "yyyy-MM-dd");

    const filtered = meetings
      .filter((meeting) => {
        const startTime =
          meeting.start_time || meeting.start?.dateTime || meeting.start?.date;
        if (!startTime) {
          return false;
        }
        try {
          const meetingDate = new Date(startTime);
          if (isNaN(meetingDate.getTime())) {
            return false;
          }
          // Use string comparison for date matching to handle timezone issues
          const meetingDateStr = format(meetingDate, "yyyy-MM-dd");
          return meetingDateStr === targetDateStr;
        } catch (error) {
          return false;
        }
      })
      .map((meeting) => {
        const startTimeStr =
          meeting.start_time || meeting.start?.dateTime || meeting.start?.date;
        const endTimeStr =
          meeting.end_time || meeting.end?.dateTime || meeting.end?.date;

        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return null;
        }

        const startMinutes = getHours(startTime) * 60 + getMinutes(startTime);
        const endMinutes = getHours(endTime) * 60 + getMinutes(endTime);
        const duration = Math.max(endMinutes - startMinutes, 30); // Minimum 30 minutes

        return {
          ...meeting,
          startTime,
          endTime,
          startMinutes,
          endMinutes,
          duration,
        };
      })
      .filter((m) => m !== null)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // Group overlapping meetings to position them side by side
    const grouped = [];
    const processed = new Set();

    filtered.forEach((meeting, idx) => {
      if (processed.has(idx)) return;

      // Find overlapping meetings
      const overlapping = [meeting];
      processed.add(idx);

      filtered.forEach((otherMeeting, otherIdx) => {
        if (processed.has(otherIdx) || idx === otherIdx) return;

        // Check if meetings overlap
        const overlaps =
          meeting.startMinutes < otherMeeting.endMinutes &&
          meeting.endMinutes > otherMeeting.startMinutes;

        if (overlaps) {
          overlapping.push(otherMeeting);
          processed.add(otherIdx);
        }
      });

      // Assign positions to overlapping meetings
      overlapping.forEach((m, pos) => {
        m.leftOffset = pos;
        m.totalOverlapping = overlapping.length;
      });

      grouped.push(...overlapping);
    });

    return grouped.sort((a, b) => a.startMinutes - b.startMinutes);
  };

  const openMeetingDetail = (meeting: any) => {
    setSelectedMeetingForDetail(meeting);
    setMeetingDetailDialogOpen(true);
  };

  const getWeekDays = () => {
    if (calendarView === "day") {
      return [selectedDate || new Date()];
    }
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  };

  const getStatusColorClass = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-indigo-600",
      proposed: "bg-yellow-500",
      rescheduled: "bg-blue-500",
      cancelled: "bg-gray-400",
    };
    return colors[status] || "bg-purple-600";
  };

  const navigateWeek = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentWeekStart(subDays(currentWeekStart, 7));
    } else {
      setCurrentWeekStart(addDays(currentWeekStart, 7));
    }
  };

  const navigateDay = (direction: "prev" | "next") => {
    if (selectedDate) {
      setSelectedDate(
        direction === "prev"
          ? subDays(selectedDate, 1)
          : addDays(selectedDate, 1)
      );
    }
  };

  // Time slots from 6 AM to 10 PM
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push(setHours(startOfDay(new Date()), hour));
  }

  const getTopPosition = (startMinutes: number) => {
    // 6 AM = 360 minutes, each hour = 60px
    const startHour = 6;
    const startHourMinutes = startHour * 60; // 360 minutes (6 AM)
    let minutesFromStart = startMinutes - startHourMinutes;

    // If meeting starts before 6 AM, position at top (0)
    if (minutesFromStart < 0) {
      minutesFromStart = 0;
    }

    // Convert minutes to pixels (60px per hour)
    const top = (minutesFromStart / 60) * 60;
    return Math.max(0, top); // Ensure non-negative
  };

  const getHeight = (duration: number) => {
    return (duration / 60) * 60; // 60px per hour
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const headerTitle = `Meetings (${meetings.length})`;

  const headerActions = (
    <div className="flex items-center gap-3">
      {/* View Toggle Buttons */}
      <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
        <Button
          type="button"
          variant={viewMode === "cards" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("cards")}
          className={
            viewMode === "cards"
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : ""
          }
        >
          <Grid3x3 className="h-4 w-4 mr-1" />
          Cards
        </Button>
        <Button
          type="button"
          variant={viewMode === "calendar" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("calendar")}
          className={
            viewMode === "calendar"
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : ""
          }
        >
          <CalendarDays className="h-4 w-4 mr-1" />
          Calendar
        </Button>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button
            data-testid="create-meeting-btn"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 btn-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2 pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Schedule New Meeting
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new meeting
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMeeting} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input
                id="meeting-title"
                data-testid="meeting-title-input"
                value={newMeeting.title}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, title: e.target.value })
                }
                placeholder="Enter meeting title"
                required
              />
            </div>

            <div>
              <Label htmlFor="meeting-time">Date & Time</Label>
              <Input
                id="meeting-time"
                data-testid="meeting-time-input"
                type="datetime-local"
                value={newMeeting.start_time}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, start_time: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="meeting-duration">Duration (minutes)</Label>
              <Select
                value={newMeeting.duration_minutes.toString()}
                onValueChange={(value) =>
                  setNewMeeting({
                    ...newMeeting,
                    duration_minutes: parseInt(value),
                  })
                }
              >
                <SelectTrigger data-testid="meeting-duration-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="meeting-notes">Notes (Optional)</Label>
              <Textarea
                id="meeting-notes"
                data-testid="meeting-notes-input"
                value={newMeeting.notes}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, notes: e.target.value })
                }
                placeholder="Meeting agenda or notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewMeeting({
                    lead_id: "",
                    title: "",
                    start_time: "",
                    duration_minutes: 60,
                    notes: "",
                  });
                  setCreateDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="create-meeting-submit-btn"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Schedule Meeting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Layout title={headerTitle} headerActions={headerActions}>
      {/* Edit Meeting Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Edit Meeting
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              Update meeting details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMeeting} className="space-y-4">
            <div>
              <Label htmlFor="edit-meeting-title">Meeting Title</Label>
              <Input
                id="edit-meeting-title"
                data-testid="edit-meeting-title-input"
                value={newMeeting.title}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, title: e.target.value })
                }
                placeholder="Enter meeting title"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-meeting-time">Date & Time</Label>
              <Input
                id="edit-meeting-time"
                data-testid="edit-meeting-time-input"
                type="datetime-local"
                value={newMeeting.start_time}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, start_time: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-meeting-duration">Duration (minutes)</Label>
              <Select
                value={newMeeting.duration_minutes.toString()}
                onValueChange={(value) =>
                  setNewMeeting({
                    ...newMeeting,
                    duration_minutes: parseInt(value),
                  })
                }
              >
                <SelectTrigger data-testid="edit-meeting-duration-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-meeting-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-meeting-notes"
                data-testid="edit-meeting-notes-input"
                value={newMeeting.notes}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, notes: e.target.value })
                }
                placeholder="Meeting agenda or notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedMeeting(null);
                  setNewMeeting({
                    lead_id: "",
                    title: "",
                    start_time: "",
                    duration_minutes: 60,
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="edit-meeting-submit-btn"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Update Meeting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Meeting Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this meeting? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">
                  {selectedMeeting.title ||
                    `Meeting with ${getLeadName(selectedMeeting)}`}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {new Date(selectedMeeting.start_time).toLocaleString()}
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedMeeting(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteMeeting}
                  data-testid="delete-meeting-confirm-btn"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Meeting
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Meeting Detail Dialog */}
      <Dialog
        open={meetingDetailDialogOpen}
        onOpenChange={setMeetingDetailDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMeetingForDetail && (
            <>
              <DialogHeader className="space-y-2 pb-4 border-b border-gray-200">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {selectedMeetingForDetail.title ||
                    `Meeting with ${getLeadName(selectedMeetingForDetail)}`}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Meeting Details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                {/* Lead Information */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Lead
                  </Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">
                      {getLeadName(selectedMeetingForDetail)}
                    </p>
                    {selectedMeetingForDetail.lead_email && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedMeetingForDetail.lead_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Date & Time
                  </Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">
                          {selectedMeetingForDetail.startTime
                            ? format(
                                selectedMeetingForDetail.startTime,
                                "EEEE, MMMM d, yyyy"
                              )
                            : format(
                                new Date(
                                  selectedMeetingForDetail.start_time ||
                                    selectedMeetingForDetail.start?.dateTime
                                ),
                                "EEEE, MMMM d, yyyy"
                              )}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {selectedMeetingForDetail.startTime
                            ? `${format(
                                selectedMeetingForDetail.startTime,
                                "h:mm a"
                              )} - ${format(
                                selectedMeetingForDetail.endTime,
                                "h:mm a"
                              )}`
                            : `${format(
                                new Date(
                                  selectedMeetingForDetail.start_time ||
                                    selectedMeetingForDetail.start?.dateTime
                                ),
                                "h:mm a"
                              )} - ${format(
                                new Date(
                                  selectedMeetingForDetail.end_time ||
                                    selectedMeetingForDetail.end?.dateTime
                                ),
                                "h:mm a"
                              )}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Status
                  </Label>
                  <div className="mt-1">
                    <Badge
                      className={`${getStatusColor(
                        selectedMeetingForDetail.status
                      )} text-sm px-3 py-1`}
                    >
                      {selectedMeetingForDetail.status || "proposed"}
                    </Badge>
                  </div>
                </div>

                {/* Notes */}
                {selectedMeetingForDetail.notes && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Notes
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedMeetingForDetail.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Google Meet Link */}
                {selectedMeetingForDetail.meet_link && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Video Conference
                    </Label>
                    <div className="mt-1">
                      <a
                        href={selectedMeetingForDetail.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 font-medium"
                      >
                        <span>📹</span>
                        <span>Join Google Meet</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      openEditDialog(selectedMeetingForDetail);
                      setMeetingDetailDialogOpen(false);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Meeting
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      openDeleteDialog(selectedMeetingForDetail);
                      setMeetingDetailDialogOpen(false);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Meeting
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Calendar View - Google Calendar Style */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          {/* Calendar Header */}
          <Card className="shadow-md border-gray-200 mb-4">
            <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {calendarView === "week"
                      ? format(currentWeekStart, "MMMM yyyy")
                      : selectedDate
                      ? format(selectedDate, "EEEE, MMMM d, yyyy")
                      : "Select Date"}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-1 font-medium">
                    {calendarView === "week"
                      ? `Week of ${format(currentWeekStart, "MMM d")}`
                      : selectedDate
                      ? format(selectedDate, "EEEE, MMMM d, yyyy")
                      : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      calendarView === "week"
                        ? navigateWeek("prev")
                        : navigateDay("prev")
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (calendarView === "week") {
                        setCurrentWeekStart(
                          startOfWeek(new Date(), { weekStartsOn: 0 })
                        );
                      } else {
                        setSelectedDate(new Date());
                      }
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      calendarView === "week"
                        ? navigateWeek("next")
                        : navigateDay("next")
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="flex border rounded-lg ml-2">
                    <Button
                      variant={calendarView === "day" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCalendarView("day")}
                      className={
                        calendarView === "day" ? "bg-indigo-600 text-white" : ""
                      }
                    >
                      Day
                    </Button>
                    <Button
                      variant={calendarView === "week" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCalendarView("week")}
                      className={
                        calendarView === "week"
                          ? "bg-indigo-600 text-white"
                          : ""
                      }
                    >
                      Week
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Google Calendar Style Time Grid */}
          <Card className="shadow-xl border border-gray-200 overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="flex border-t border-l border-gray-200 bg-white">
                {/* Time Column */}
                <div className="w-24 flex-shrink-0 border-r bg-gradient-to-b from-gray-50 to-white">
                  <div className="min-h-[72px] border-b bg-gradient-to-r from-gray-100 to-transparent"></div>
                  {timeSlots.map((time, idx) => (
                    <div
                      key={idx}
                      className="h-[60px] border-b text-xs text-gray-600 pr-3 text-right flex items-start justify-end pt-2 font-medium"
                    >
                      {format(time, "h a")}
                    </div>
                  ))}
                </div>

                {/* Days/Time Grid */}
                <div className="flex-1 overflow-x-auto">
                  <div className="flex min-w-full">
                    {getWeekDays().map((day, dayIdx) => {
                      const dayMeetings = getMeetingsForDay(day);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div
                          key={dayIdx}
                          className="flex-1 min-w-[200px] border-r"
                        >
                          {/* Day Header */}
                          <div
                            className={`min-h-[72px] border-b p-2.5 transition-colors relative ${
                              isToday
                                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                                : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                            }`}
                          >
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <div
                                  className={`text-xs font-semibold uppercase tracking-wide ${
                                    isToday
                                      ? "text-indigo-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {format(day, "EEE")}
                                </div>
                                <div
                                  className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                                    dayMeetings.length > 0
                                      ? isToday
                                        ? "bg-white/30 text-white border border-white/40"
                                        : "bg-indigo-500 text-white shadow-sm"
                                      : isToday
                                      ? "bg-white/10 text-white/70 border border-white/20"
                                      : "bg-gray-200 text-gray-500"
                                  }`}
                                >
                                  {dayMeetings.length}
                                </div>
                              </div>
                              <div
                                className={`text-xl font-bold ${
                                  isToday ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {format(day, "d")}
                              </div>
                            </div>
                          </div>

                          {/* Time Slots */}
                          <div
                            className="relative bg-white"
                            style={{ height: "1020px" }}
                          >
                            {/* Hour Lines */}
                            {timeSlots.map((time, idx) => (
                              <div
                                key={idx}
                                className={`absolute border-b ${
                                  idx === 0
                                    ? "border-gray-300"
                                    : idx % 2 === 0
                                    ? "border-gray-200"
                                    : "border-gray-100"
                                }`}
                                style={{
                                  top: idx * 60,
                                  left: 0,
                                  right: 0,
                                  height: "1px",
                                }}
                              />
                            ))}

                            {/* Meeting Blocks - Individual Cards */}
                            {dayMeetings.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm opacity-40">
                                No meetings
                              </div>
                            )}
                            {dayMeetings.map((meeting, meetingIdx) => {
                              const top = getTopPosition(meeting.startMinutes);
                              const height = Math.max(
                                getHeight(meeting.duration),
                                40
                              );
                              const status = meeting.status || "proposed";
                              const colorClass = getStatusColorClass(status);

                              // Calculate width and position for overlapping meetings
                              const totalOverlapping =
                                meeting.totalOverlapping || 1;
                              const leftOffset = meeting.leftOffset || 0;
                              const widthPercent = 100 / totalOverlapping;
                              const leftPercent = leftOffset * widthPercent;

                              return (
                                <HoverCard key={meeting.id || meetingIdx}>
                                  <HoverCardTrigger asChild>
                                    <div
                                      className={`absolute ${colorClass} text-white rounded-xl p-3 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 shadow-lg z-10 border-l-4 border-l-white/40 group backdrop-blur-sm`}
                                      style={{
                                        top: `${top}px`,
                                        height: `${height}px`,
                                        left: `${1 + leftPercent}%`,
                                        width: `${widthPercent - 2}%`,
                                        minWidth: "140px",
                                        background: `linear-gradient(135deg, ${
                                          colorClass.includes("indigo")
                                            ? "#4f46e5"
                                            : colorClass.includes("yellow")
                                            ? "#eab308"
                                            : colorClass.includes("blue")
                                            ? "#3b82f6"
                                            : "#6b7280"
                                        } 0%, ${
                                          colorClass.includes("indigo")
                                            ? "#7c3aed"
                                            : colorClass.includes("yellow")
                                            ? "#facc15"
                                            : colorClass.includes("blue")
                                            ? "#2563eb"
                                            : "#4b5563"
                                        } 100%)`,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openMeetingDetail(meeting);
                                      }}
                                      title={`${
                                        meeting.title ||
                                        `Meeting with ${getLeadName(meeting)}`
                                      } - ${format(
                                        meeting.startTime,
                                        "h:mm a"
                                      )} - ${format(
                                        meeting.endTime,
                                        "h:mm a"
                                      )}`}
                                    >
                                      <div className="flex flex-col h-full overflow-hidden">
                                        <div className="flex-shrink-0">
                                          <div className="text-[10px] font-semibold opacity-95 mb-1 uppercase tracking-wide flex items-center gap-1">
                                            <Clock className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">
                                              {format(
                                                meeting.startTime,
                                                "h:mm a"
                                              )}{" "}
                                              -{" "}
                                              {format(
                                                meeting.endTime,
                                                "h:mm a"
                                              )}
                                            </span>
                                          </div>
                                          <div className="text-sm font-bold truncate mb-1 leading-tight drop-shadow-sm">
                                            {meeting.title ||
                                              `Meeting with ${getLeadName(
                                                meeting
                                              )}`}
                                          </div>
                                          {getLeadName(meeting) &&
                                            height > 50 && (
                                              <div className="text-[11px] font-medium opacity-90 truncate flex items-center gap-1">
                                                <span className="text-white/80 flex-shrink-0">
                                                  👤
                                                </span>
                                                <span className="truncate">
                                                  {getLeadName(meeting)}
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                        {height > 70 && meeting.meet_link && (
                                          <div className="mt-auto pt-1.5 border-t border-white/20 flex-shrink-0">
                                            <div className="text-[10px] opacity-95 inline-flex items-center gap-1 font-medium bg-white/20 rounded px-1.5 py-0.5">
                                              <span>📹</span>
                                              <span className="truncate">
                                                Meet
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent
                                    className="w-80 z-50"
                                    side="right"
                                    align="start"
                                  >
                                    <div className="space-y-3">
                                      <div>
                                        <h4 className="font-semibold text-lg">
                                          {meeting.title ||
                                            `Meeting with ${getLeadName(
                                              meeting
                                            )}`}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                          {getLeadName(meeting)}
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-2 text-sm">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span>
                                          {format(
                                            meeting.startTime,
                                            "EEEE, MMMM d, yyyy 'at' h:mm a"
                                          )}{" "}
                                          - {format(meeting.endTime, "h:mm a")}
                                        </span>
                                      </div>
                                      {meeting.notes && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-500 mb-1">
                                            Notes:
                                          </p>
                                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {meeting.notes}
                                          </p>
                                        </div>
                                      )}
                                      {meeting.meet_link && (
                                        <div>
                                          <a
                                            href={meeting.meet_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <span>📹</span>
                                            <span>Join Google Meet</span>
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-2">
                                        <Badge
                                          className={getStatusColor(
                                            meeting.status
                                          )}
                                        >
                                          {meeting.status || "proposed"}
                                        </Badge>
                                      </div>
                                      <div className="pt-2 border-t flex space-x-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditDialog(meeting);
                                          }}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 text-xs text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteDialog(meeting);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Card View */}
      {viewMode === "cards" && (
        <>
          {/* Date Filter for Cards View */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-semibold">
                    Filter by Date:
                  </Label>
                  <Calendar
                    mode="single"
                    selected={cardsDateFilter}
                    onSelect={setCardsDateFilter}
                    className="rounded-md border"
                    classNames={{}}
                  />
                  {cardsDateFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCardsDateFilter(undefined)}
                      className="text-gray-500"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {cardsDateFilter
                    ? meetings.filter((m) => {
                        const meetingDate = new Date(
                          m.start_time || m.start?.dateTime || m.start?.date
                        );
                        return isSameDay(meetingDate, cardsDateFilter);
                      }).length
                    : meetings.length}{" "}
                  meeting
                  {cardsDateFilter
                    ? meetings.filter((m) => {
                        const meetingDate = new Date(
                          m.start_time || m.start?.dateTime || m.start?.date
                        );
                        return isSameDay(meetingDate, cardsDateFilter);
                      }).length !== 1
                    : meetings.length !== 1
                    ? "s"
                    : ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meetings List */}
          {(() => {
            const filteredMeetings = cardsDateFilter
              ? meetings.filter((m) => {
                  const meetingDate = new Date(
                    m.start_time || m.start?.dateTime || m.start?.date
                  );
                  return isSameDay(meetingDate, cardsDateFilter);
                })
              : meetings;

            return filteredMeetings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMeetings.map((meeting) => {
                  // Safely parse dates
                  const startTime = meeting.start_time
                    ? new Date(meeting.start_time)
                    : new Date();
                  const endTime = meeting.end_time
                    ? new Date(meeting.end_time)
                    : new Date();
                  const createdTime = meeting.created_at
                    ? new Date(meeting.created_at)
                    : new Date();

                  return (
                    <Card
                      key={meeting.id || `meeting-${Math.random()}`}
                      className="card-hover shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-indigo-300"
                      data-testid={`meeting-card-${meeting.id}`}
                    >
                      <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold truncate text-gray-900">
                              {meeting.title ||
                                `Meeting with ${getLeadName(meeting)}`}
                            </CardTitle>
                            <CardDescription className="mt-1.5 text-sm text-gray-600">
                              {getLeadName(meeting)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {getStatusIcon(meeting.status)}
                            <Badge
                              className={`${getStatusColor(
                                meeting.status
                              )} text-xs font-medium px-2 py-0.5`}
                            >
                              {meeting.status || "proposed"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Meeting Time */}
                          <div className="p-3 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-indigo-200 shadow-sm">
                            <div className="flex items-center space-x-2 text-blue-800 mb-2">
                              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-semibold">
                                {startTime.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-blue-700">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {startTime.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {endTime.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Notes */}
                          {meeting.notes && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {meeting.notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-gray-300 hover:bg-gray-50"
                              onClick={() => openEditDialog(meeting)}
                              data-testid={`edit-meeting-btn-${meeting.id}`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => openDeleteDialog(meeting)}
                              data-testid={`delete-meeting-btn-${meeting.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>

                          {/* Status Update Buttons */}
                          {meeting.status !== "cancelled" &&
                            meeting.status !== "confirmed" && (
                              <div className="pt-2 border-t border-gray-200">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                                  onClick={() =>
                                    handleUpdateStatus(meeting.id, "confirmed")
                                  }
                                  data-testid={`confirm-meeting-btn-${meeting.id}`}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirm Meeting
                                </Button>
                              </div>
                            )}

                          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                            Created{" "}
                            {createdTime.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              // Empty State
              <Card>
                <CardContent className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No meetings scheduled
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Schedule your first meeting with a lead to start building
                    relationships and closing deals.
                  </p>
                  <Dialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Your First Meeting
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      {/* Calendar View - Google Calendar Style */}
    </Layout>
  );
}

export default MeetingManagement;
