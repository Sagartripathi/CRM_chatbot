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
} from "lucide-react";

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
  const [newMeeting, setNewMeeting] = useState({
    lead_id: "",
    title: "",
    start_time: "",
    duration_minutes: 60,
    notes: "",
  });

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

      setMeetings(meetingsResponse.data);
      setLeads(leadsResponse.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to access meetings data");
      } else {
        toast.error("Failed to load data");
        console.error("Fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();

    if (!newMeeting.lead_id || !newMeeting.start_time) {
      toast.error("Please select a lead and meeting time");
      return;
    }

    try {
      await apiClient.post("/meetings", {
        ...newMeeting,
        start_time: new Date(newMeeting.start_time).toISOString(),
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

    if (!selectedMeeting || !newMeeting.lead_id || !newMeeting.start_time) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await apiClient.put(`/meetings/${selectedMeeting.id}`, {
        ...newMeeting,
        start_time: new Date(newMeeting.start_time).toISOString(),
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
      lead_id: meeting.lead_id,
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

  const getLeadName = (leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    return lead ? `${lead.first_name} ${lead.last_name}` : "Unknown Lead";
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
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting with a lead
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div>
            <Label htmlFor="meeting-lead">Lead</Label>
            <Select
              value={newMeeting.lead_id}
              onValueChange={(value) =>
                setNewMeeting({ ...newMeeting, lead_id: value })
              }
            >
              <SelectTrigger data-testid="meeting-lead-select">
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.first_name} {lead.last_name} - {lead.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="meeting-title">Title (Optional)</Label>
            <Input
              id="meeting-title"
              data-testid="meeting-title-input"
              value={newMeeting.title}
              onChange={(e) =>
                setNewMeeting({ ...newMeeting, title: e.target.value })
              }
              placeholder="Meeting title"
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
  );

  return (
    <Layout title={headerTitle} headerActions={headerActions}>
      {/* Edit Meeting Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update meeting details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMeeting} className="space-y-4">
            <div>
              <Label htmlFor="edit-meeting-lead">Lead</Label>
              <Select
                value={newMeeting.lead_id}
                onValueChange={(value) =>
                  setNewMeeting({ ...newMeeting, lead_id: value })
                }
              >
                <SelectTrigger data-testid="edit-meeting-lead-select">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name} - {lead.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-meeting-title">Title (Optional)</Label>
              <Input
                id="edit-meeting-title"
                data-testid="edit-meeting-title-input"
                value={newMeeting.title}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, title: e.target.value })
                }
                placeholder="Meeting title"
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
                    `Meeting with ${getLeadName(selectedMeeting.lead_id)}`}
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

      {/* Meetings List */}
      {meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <Card
              key={meeting.id}
              className="card-hover"
              data-testid={`meeting-card-${meeting.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {meeting.title ||
                        `Meeting with ${getLeadName(meeting.lead_id)}`}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getLeadName(meeting.lead_id)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(meeting.status)}
                    <Badge className={getStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Meeting Time */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {new Date(meeting.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-700 mt-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {new Date(meeting.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -
                        {new Date(meeting.end_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {meeting.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{meeting.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(meeting)}
                      data-testid={`edit-meeting-btn-${meeting.id}`}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                      <div className="pt-2 border-t">
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full bg-green-600 hover:bg-green-700"
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

                  <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    Created {new Date(meeting.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Your First Meeting
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}

export default MeetingManagement;
