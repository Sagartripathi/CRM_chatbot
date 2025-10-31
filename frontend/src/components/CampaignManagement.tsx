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
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import Layout from "./Layout";
import {
  Target,
  Plus,
  Play,
  Users,
  TrendingUp,
  Phone,
  Eye,
  Edit,
  Trash2,
  FileText,
  Mail,
} from "lucide-react";

// DateTimePicker Component
const DateTimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({
    hours: 12,
    minutes: 0,
    period: "AM",
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateTime = (date, time) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours =
      time.period === "PM" && time.hours !== 12
        ? time.hours + 12
        : time.period === "AM" && time.hours === 12
        ? 0
        : time.hours;
    const minutes = String(time.minutes).padStart(2, "0");
    return `${year}-${month}-${day}T${String(hours).padStart(
      2,
      "0"
    )}:${minutes}`;
  };

  const handleDateSelect = (day) => {
    // Only update the selected date; don't close or emit yet
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
  };

  const handleTimeChange = (field, value) => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    const formattedDateTime = formatDateTime(selectedDate, newTime);
    onChange(formattedDateTime);
  };

  const handleDone = () => {
    const formattedDateTime = formatDateTime(selectedDate, selectedTime);
    onChange(formattedDateTime);
    setIsOpen(false);
  };

  // Initialize picker state from external value when opening or when value changes
  useEffect(() => {
    if (!isOpen) return;
    if (!value) return;
    try {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        const hours24 = parsed.getHours();
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
        const minutes = parsed.getMinutes();
        setSelectedTime({ hours: hours12, minutes, period });
      }
    } catch (_) {
      // ignore parse errors and keep defaults
    }
  }, [isOpen, value]);

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];

    // Previous month days
    const prevMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - 1,
      0
    );
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div
          key={`prev-${i}`}
          className="text-center py-2 text-gray-400 text-sm"
        >
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === selectedDate.getDate();
      days.push(
        <div
          key={day}
          className={`text-center py-2 cursor-pointer rounded hover:bg-gray-100 text-sm ${
            isSelected ? "bg-blue-500 text-white" : ""
          }`}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="text-center py-2 text-gray-400 text-sm"
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const renderTimePicker = () => {
    const hours = [];
    const minutes = [];

    for (let i = 1; i <= 12; i++) {
      hours.push(
        <SelectItem key={i} value={i.toString()}>
          {i}
        </SelectItem>
      );
    }

    for (let i = 0; i < 60; i += 15) {
      minutes.push(
        <SelectItem key={i} value={i.toString()}>
          {String(i).padStart(2, "0")}
        </SelectItem>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Label className="text-xs">Hour</Label>
            <Select
              value={selectedTime.hours.toString()}
              onValueChange={(value) =>
                handleTimeChange("hours", parseInt(value))
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{hours}</SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Min</Label>
            <Select
              value={selectedTime.minutes.toString()}
              onValueChange={(value) =>
                handleTimeChange("minutes", parseInt(value))
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{minutes}</SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Period</Label>
            <Select
              value={selectedTime.period}
              onValueChange={(value) => handleTimeChange("period", value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <Input
        value={value}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
        placeholder="Select date and time"
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
            <div className="space-y-4">
              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                    className="h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                  <span className="font-semibold text-lg">
                    {months[selectedDate.getMonth()]}{" "}
                    {selectedDate.getFullYear()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                    className="h-8 w-8 p-0"
                  >
                    →
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-sm">
                  {days.map((day) => (
                    <div
                      key={day}
                      className="text-center font-medium text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
              </div>

              {/* Time Picker */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-3">Select Time</div>
                {renderTimePicker()}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDone}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CampaignManagement() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadClientId, setUploadClientId] = useState("");
  const [uploadAgentId, setUploadAgentId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaignStats, setSelectedCampaignStats] = useState(null);
  const [selectedLeadInCampaign, setSelectedLeadInCampaign] = useState(null);
  const [editLeadInCampaignDialogOpen, setEditLeadInCampaignDialogOpen] =
    useState(false);
  const [deleteLeadInCampaignDialogOpen, setDeleteLeadInCampaignDialogOpen] =
    useState(false);
  // Sidebar managed by Layout component

  // Campaign form state matching backend Campaign model
  const emptyCampaign = {
    campaign_name: "",
    campaign_description: "",
    lead_ids: [],
    campaign_id: "",
    client_id: "", // Will be selected from dropdown
    agent_id: "", // Will be selected from dropdown
    timezone_shared: "", // Will be selected from dropdown
    is_active: false, // Default to Inactive as per requirements
    start_call: "",
    call_created_at: "",
    call_created_at_custom: "",

    call_updated_at: "",
    call_updated_at_custom: "",
  };
  const [newCampaign, setNewCampaign] = useState({ ...emptyCampaign });

  // Helper function to convert dropdown values to actual datetime
  const getDateTimeValue = (dropdownValue, customValue) => {
    if (!dropdownValue) return undefined;

    if (dropdownValue === "custom") {
      return customValue || undefined;
    }

    if (dropdownValue === "now") {
      return new Date().toISOString().slice(0, 16);
    }

    const now = new Date();
    let targetDate;

    switch (dropdownValue) {
      case "1-hour-ago":
        targetDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "2-hours-ago":
        targetDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        break;
      case "4-hours-ago":
        targetDate = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        break;
      case "1-day-ago":
        targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "2-days-ago":
        targetDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        break;
      case "1-week-ago":
        targetDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return undefined;
    }

    return targetDate.toISOString().slice(0, 16);
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

      const [campaignsResponse, leadsResponse] = await Promise.all([
        apiClient.get("/campaigns"),
        apiClient.get("/leads"),
      ]);

      setCampaigns(campaignsResponse.data);
      setLeads(leadsResponse.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to access this data");
      } else {
        toast.error("Failed to load data");
        console.error("Fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsOnly = async () => {
    try {
      const leadsResponse = await apiClient.get("/leads");
      setLeads(leadsResponse.data);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    if (!newCampaign.campaign_name || !newCampaign.campaign_name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    if (
      !newCampaign.campaign_description ||
      !newCampaign.campaign_description.trim()
    ) {
      toast.error("Campaign description is required");
      return;
    }

    if (!newCampaign.client_id) {
      toast.error("Client ID is required");
      return;
    }

    if (!newCampaign.agent_id) {
      toast.error("Agent ID is required");
      return;
    }

    try {
      const payload = {
        campaign_name: newCampaign.campaign_name,
        campaign_description: newCampaign.campaign_description,
        lead_ids: selectedLeads,
        campaign_id: newCampaign.campaign_id || undefined,
        client_id: newCampaign.client_id, // Now mandatory
        agent_id: newCampaign.agent_id, // Now mandatory
        timezone_shared: newCampaign.timezone_shared || undefined,
        is_active: !!newCampaign.is_active,
        start_call: newCampaign.start_call || undefined,
        call_created_at: getDateTimeValue(
          newCampaign.call_created_at,
          newCampaign.call_created_at_custom
        ),
        call_updated_at: getDateTimeValue(
          newCampaign.call_updated_at,
          newCampaign.call_updated_at_custom
        ),
      };

      await apiClient.post("/campaigns", payload);

      toast.success("Campaign created successfully!");
      setCreateDialogOpen(false);
      setNewCampaign({ ...emptyCampaign });
      setSelectedLeads([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create campaign");
    }
  };

  const handleStartCampaign = (campaignId) => {
    navigate(`/campaigns/${campaignId}/call`);
  };

  const handleViewStats = async (campaign) => {
    try {
      const response = await apiClient.get(`/campaigns/${campaign.id}/stats`);
      setSelectedCampaignStats(response.data);
      setStatsDialogOpen(true);
    } catch (error) {
      toast.error("Failed to load campaign stats");
    }
  };

  const handleLeadSelection = (leadId, checked) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  const handleEditCampaign = async (e) => {
    e.preventDefault();

    const campaignName =
      selectedCampaign?.campaign_name || selectedCampaign?.name;
    if (!campaignName || !campaignName.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      const payload = {
        campaign_name: selectedCampaign.campaign_name || selectedCampaign.name,
        campaign_description:
          selectedCampaign.campaign_description ||
          selectedCampaign.description ||
          undefined,
        campaign_id: selectedCampaign.campaign_id || undefined,
        client_id: selectedCampaign.client_id || undefined,
        agent_id: selectedCampaign.agent_id || undefined,
        timezone_shared: selectedCampaign.timezone_shared || undefined,
        is_active: !!selectedCampaign.is_active,
        start_call: selectedCampaign.start_call || undefined,
        call_created_at: getDateTimeValue(
          selectedCampaign.call_created_at,
          selectedCampaign.call_created_at_custom
        ),
        call_updated_at: getDateTimeValue(
          selectedCampaign.call_updated_at,
          selectedCampaign.call_updated_at_custom
        ),
      };

      await apiClient.put(`/campaigns/${selectedCampaign.id}`, payload);

      toast.success("Campaign updated successfully!");
      setEditDialogOpen(false);
      setSelectedCampaign(null);
      setSelectedLeads([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update campaign");
    }
  };

  const openEditDialog = (campaign) => {
    setSelectedCampaign({
      ...campaign,
      campaign_id: campaign.campaign_id ?? "",
      campaign_name: (campaign.campaign_name || campaign.name) ?? "",
      campaign_description:
        (campaign.campaign_description || campaign.description) ?? "",
      client_id: campaign.client_id ?? "",
      agent_id: (campaign.agent_id || campaign.agent_id_vb) ?? "",
      main_sequence_attempts: campaign.main_sequence_attempts ?? "",
      follow_up_delay_days_pc: campaign.follow_up_delay_days_pc ?? "",
      follow_up_max_attempts_pc: campaign.follow_up_max_attempts_pc ?? "",
      holiday_calendar_pc: campaign.holiday_calendar_pc ?? "",
      weekend_adjustment_pc: !!campaign.weekend_adjustment_pc,
      timezone_shared: campaign.timezone_shared ?? "",
      is_active: !!campaign.is_active,
      start_call: campaign.start_call ?? "",
      lead_ids:
        campaign.lead_ids ??
        (campaign.leads ? campaign.leads.map((l) => l.id) : []),
    });

    const leadIds =
      campaign.lead_ids ??
      (campaign.leads ? campaign.leads.map((l) => l.id) : []) ??
      [];
    setSelectedLeads(Array.isArray(leadIds) ? leadIds : []);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (campaign) => {
    setSelectedCampaign(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCampaign = async () => {
    try {
      await apiClient.delete(`/campaigns/${selectedCampaign.id}`);
      toast.success("Campaign deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedCampaign(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete campaign");
    }
  };

  const handleUploadCSV = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.error("Please select a CSV file");
      return;
    }

    if (!uploadClientId) {
      toast.error("Please select a client ID");
      return;
    }

    if (!uploadAgentId) {
      toast.error("Please select an agent ID");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);

      const url = `/campaigns/upload-csv?client_id=${uploadClientId}&agent_id=${uploadAgentId}`;

      const response = await apiClient.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(response.data.message);
      if (response.data.skipped_count > 0) {
        toast.info(`${response.data.skipped_count} duplicates skipped`);
      }
      if (response.data.error_count > 0) {
        toast.warning(`${response.data.error_count} rows had errors`);
      }

      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadClientId("");
      setUploadAgentId("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  const openEditLeadInCampaignDialog = (lead) => {
    setSelectedLeadInCampaign(lead);
    setEditLeadInCampaignDialogOpen(true);
  };

  const openDeleteLeadInCampaignDialog = (lead) => {
    setSelectedLeadInCampaign(lead);
    setDeleteLeadInCampaignDialogOpen(true);
  };

  const handleEditLeadInCampaign = async (e) => {
    e.preventDefault();

    // Validate conditional fields based on lead type
    if (selectedLeadInCampaign.lead_type === "individual") {
      if (!selectedLeadInCampaign.lead_first_name?.trim()) {
        toast.error("First Name is required for individual leads");
        return;
      }
      if (!selectedLeadInCampaign.lead_last_name?.trim()) {
        toast.error("Last Name is required for individual leads");
        return;
      }
      if (!selectedLeadInCampaign.lead_phone?.trim()) {
        toast.error("Lead's Contact # is required for individual leads");
        return;
      }
      if (!selectedLeadInCampaign.leads_notes?.trim()) {
        toast.error("Lead's Insight is required for individual leads");
        return;
      }
    } else if (selectedLeadInCampaign.lead_type === "organization") {
      if (!selectedLeadInCampaign.business_name?.trim()) {
        toast.error("Business Name is required for organization leads");
        return;
      }
      if (!selectedLeadInCampaign.business_phone?.trim()) {
        toast.error("Business Phone is required for organization leads");
        return;
      }
      if (!selectedLeadInCampaign.business_address?.trim()) {
        toast.error("Business Address is required for organization leads");
        return;
      }
    }

    try {
      // Send all existing lead data
      const leadData = {
        ...selectedLeadInCampaign,
        // Ensure optional fields are undefined if empty
        lead_email: selectedLeadInCampaign.lead_email || undefined,
        business_summary: selectedLeadInCampaign.business_summary || undefined,
      };

      await apiClient.put(`/leads/${selectedLeadInCampaign.id}`, leadData);
      toast.success("Lead updated successfully!");
      setEditLeadInCampaignDialogOpen(false);
      setSelectedLeadInCampaign(null);
      fetchLeadsOnly();
    } catch (error) {
      console.error("Error updating lead:", error);
      // Handle validation errors (array of error objects)
      if (
        error.response?.data?.detail &&
        Array.isArray(error.response.data.detail)
      ) {
        const errorMessages = error.response.data.detail
          .map((err) => `${err.loc?.join(" > ") || "Field"}: ${err.msg}`)
          .join(", ");
        toast.error(`Validation error: ${errorMessages}`);
      } else if (typeof error.response?.data?.detail === "string") {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to update lead. Please check your input.");
      }
    }
  };

  const handleDeleteLeadInCampaign = async () => {
    try {
      await apiClient.delete(`/leads/${selectedLeadInCampaign.id}`);
      toast.success("Lead deleted successfully!");
      setDeleteLeadInCampaignDialogOpen(false);
      setSelectedLeadInCampaign(null);
      fetchLeadsOnly();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete lead");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      converted: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
      no_response: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.new;
  };

  // Sidebar component removed - now using GlobalSidebar via Layout

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            data-testid="upload-csv-btn"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <FileText className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
        </DialogTrigger>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button
            data-testid="create-campaign-btn"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 btn-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new campaign and select leads to include
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-6">
            {/* Campaign Basic Info */}
            <div className="space-y-4">
              <Label htmlFor="campaign-id">Campaign ID</Label>
              <Input
                id="campaign-id"
                value={newCampaign.campaign_id || ""}
                placeholder="Auto-generated campaign ID"
                className="bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500">
                Campaign ID is automatically generated when you create the
                campaign
              </p>
            </div>

            <div>
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                value={newCampaign.campaign_name || ""}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    campaign_name: e.target.value,
                  })
                }
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div>
              <Label htmlFor="campaign-description">Description *</Label>
              <Textarea
                id="campaign-description"
                value={newCampaign.campaign_description || ""}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    campaign_description: e.target.value,
                  })
                }
                placeholder="Enter campaign description"
                rows={3}
                required
              />
            </div>

            {/* Client and Agent IDs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-id">Client ID *</Label>
                <Select
                  value={newCampaign.client_id || ""}
                  onValueChange={(value) =>
                    setNewCampaign({
                      ...newCampaign,
                      client_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLI-00001">CLI-00001</SelectItem>
                    <SelectItem value="CLI-00002">CLI-00002</SelectItem>
                    <SelectItem value="CLI-00003">CLI-00003</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="agent-id">Agent ID *</Label>
                <Select
                  value={newCampaign.agent_id || ""}
                  onValueChange={(value) =>
                    setNewCampaign({
                      ...newCampaign,
                      agent_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGE-00001">AGE-00001</SelectItem>
                    <SelectItem value="AGE-00002">AGE-00002</SelectItem>
                    <SelectItem value="AGE-00003">AGE-00003</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timezone & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={newCampaign.timezone_shared || ""}
                  onValueChange={(value) =>
                    setNewCampaign({
                      ...newCampaign,
                      timezone_shared: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      America/New_York (Eastern)
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      America/Chicago (Central)
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      America/Denver (Mountain)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      America/Los_Angeles (Pacific)
                    </SelectItem>
                    <SelectItem value="America/Anchorage">
                      America/Anchorage (Alaska)
                    </SelectItem>
                    <SelectItem value="Pacific/Honolulu">
                      Pacific/Honolulu (Hawaii)
                    </SelectItem>
                    <SelectItem value="America/Toronto">
                      America/Toronto (Eastern Canada)
                    </SelectItem>
                    <SelectItem value="America/Winnipeg">
                      America/Winnipeg (Central Canada)
                    </SelectItem>
                    <SelectItem value="America/Edmonton">
                      America/Edmonton (Mountain Canada)
                    </SelectItem>
                    <SelectItem value="America/Vancouver">
                      America/Vancouver (Pacific Canada)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newCampaign.is_active ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setNewCampaign({
                      ...newCampaign,
                      is_active: value === "active",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Call Scheduling */}
            <div className="pt-4 border-t space-y-3">
              <Label className="text-base font-medium">Call Scheduling</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start-call">Start Call (API Trigger)</Label>
                  <Input
                    id="start-call"
                    value={newCampaign.start_call || ""}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        start_call: e.target.value,
                      })
                    }
                    placeholder="API trigger for start call"
                  />
                </div>
                <div>
                  <Label htmlFor="call-created-at">Call Created At</Label>
                  <DateTimePicker
                    value={newCampaign.call_created_at || ""}
                    onChange={(value) =>
                      setNewCampaign({
                        ...newCampaign,
                        call_created_at: value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="call-updated-at">Call Updated At</Label>
                  <DateTimePicker
                    value={newCampaign.call_updated_at || ""}
                    onChange={(value) =>
                      setNewCampaign({
                        ...newCampaign,
                        call_updated_at: value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewCampaign({ ...emptyCampaign });
                  setSelectedLeads([]);
                }}
              >
                Cancel
              </Button>

              <Button
                // onClick={() => {
                //   setCampaigns();
                // }}
                onClick={() => navigate("/campaigns")}
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Create Campaign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Campaigns CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to create multiple campaigns at once
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadCSV} className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File *</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a CSV file with campaign data
              </p>
            </div>

            <div>
              <Label htmlFor="upload-client-id">Client ID *</Label>
              <Select value={uploadClientId} onValueChange={setUploadClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client ID" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLI-00001">CLI-00001</SelectItem>
                  <SelectItem value="CLI-00002">CLI-00002</SelectItem>
                  <SelectItem value="CLI-00003">CLI-00003</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="upload-agent-id">Agent ID *</Label>
              <Select value={uploadAgentId} onValueChange={setUploadAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent ID" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGE-00001">AGE-00001</SelectItem>
                  <SelectItem value="AGE-00002">AGE-00002</SelectItem>
                  <SelectItem value="AGE-00003">AGE-00003</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="mb-2 font-medium">
                CSV should contain the following columns:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  <strong>campaign_name</strong> - Name of the campaign
                </li>
                <li>
                  <strong>campaign_description</strong> - Description of the
                  campaign
                </li>
                <li>
                  <strong>timezone_shared</strong> - Timezone (optional, e.g.,
                  "America/New_York")
                </li>
                <li>
                  <strong>is_active</strong> - true/false for active status
                  (optional)
                </li>
                <li>
                  <strong>start_call</strong> - API trigger for start call
                  (optional)
                </li>
                <li>
                  <strong>call_created_at</strong> - Call created date/time
                  (optional, format: YYYY-MM-DDTHH:MM)
                </li>
                <li>
                  <strong>call_updated_at</strong> - Call updated date/time
                  (optional, format: YYYY-MM-DDTHH:MM)
                </li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setUploadFile(null);
                  setUploadClientId("");
                  setUploadAgentId("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {uploading ? "Uploading..." : "Upload CSV"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Layout title="Campaigns" headerActions={headerActions}>
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="card-hover"
              data-testid={`campaign-card-${campaign.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {campaign?.campaign_name ||
                        campaign?.name ||
                        "Untitled Campaign"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {campaign?.campaign_description ||
                        campaign?.description ||
                        "No description"}
                    </CardDescription>
                    {campaign && campaign.campaign_id && (
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        ID: {campaign.campaign_id}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={campaign?.is_active ? "default" : "secondary"}
                  >
                    {campaign?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                    <div>
                      <div className="text-xs text-gray-500">Total Leads</div>
                      <div className="text-lg font-semibold">
                        {campaign.total_leads || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Completed</div>
                      <div className="text-lg font-semibold">
                        {campaign.completed_leads || 0}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div className="space-y-2 text-sm">
                    {campaign.client_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Client ID:</span>
                        <span className="font-medium text-gray-700">
                          {campaign.client_id}
                        </span>
                      </div>
                    )}

                    {(campaign.agent_id || campaign.agent_id_vb) && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Agent ID:</span>
                        <span className="font-medium text-gray-700 font-mono text-xs">
                          {campaign.agent_id || campaign.agent_id_vb}
                        </span>
                      </div>
                    )}

                    {campaign.timezone_shared && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Timezone:</span>
                        <span className="font-medium text-gray-700">
                          {campaign.timezone_shared}
                        </span>
                      </div>
                    )}

                    {/* Call Scheduling Info */}
                    {(campaign.start_call ||
                      campaign.call_created_at ||
                      campaign.call_updated_at) && (
                      <div className="pt-2 border-t">
                        <div className="text-xs font-semibold text-gray-600 mb-1">
                          Call Scheduling
                        </div>
                        <div className="space-y-1 text-xs">
                          {campaign.start_call && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                API Trigger:
                              </span>
                              <span className="font-medium text-gray-700">
                                {campaign.start_call}
                              </span>
                            </div>
                          )}
                          {campaign.call_created_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Call Created:
                              </span>
                              <span className="font-medium text-gray-700">
                                {new Date(
                                  campaign.call_created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {campaign.call_updated_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Call Updated:
                              </span>
                              <span className="font-medium text-gray-700">
                                {new Date(
                                  campaign.call_updated_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleStartCampaign(campaign.id)}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      <Phone className="h-4 w-4 inline mr-1" />
                      Start Calls
                    </button>
                    <button
                      onClick={() => handleViewStats(campaign)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditDialog(campaign)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(campaign)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first campaign to start organizing leads and tracking
              call activities. Campaigns help you manage outreach efforts
              efficiently.
            </p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Campaign Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Campaign Statistics</DialogTitle>
            <DialogDescription>
              {selectedCampaignStats?.campaign_name}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaignStats && (
            <div className="space-y-6">
              {/* Lead Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedCampaignStats.total_leads}
                  </p>
                  <p className="text-sm text-blue-600">Total Leads</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCampaignStats.completed_leads}
                  </p>
                  <p className="text-sm text-green-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedCampaignStats.in_progress_leads}
                  </p>
                  <p className="text-sm text-yellow-600">In Progress</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {selectedCampaignStats.failed_leads}
                  </p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">
                  {selectedCampaignStats.conversion_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-purple-600">Conversion Rate</p>
              </div>

              {/* Call Outcomes */}
              {Object.keys(selectedCampaignStats.call_outcomes).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Call Outcomes
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedCampaignStats.call_outcomes).map(
                      ([outcome, count]) => (
                        <div
                          key={outcome}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="capitalize">
                            {outcome.replace("_", " ")}
                          </span>
                          <Badge variant="secondary">
                            {count as React.ReactNode}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update campaign information</DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <form onSubmit={handleEditCampaign} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-campaign-id">Campaign ID</Label>
                  <Input
                    id="edit-campaign-id"
                    value={selectedCampaign.campaign_id}
                    placeholder="Campaign ID (cannot be changed)"
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Campaign ID cannot be modified after creation
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-campaign-name">Campaign Name</Label>
                  <Input
                    id="edit-campaign-name"
                    data-testid="edit-campaign-name-input"
                    value={
                      selectedCampaign.campaign_name ??
                      selectedCampaign.name ??
                      ""
                    }
                    onChange={(e) =>
                      setSelectedCampaign({
                        ...selectedCampaign,
                        campaign_name: e.target.value,
                        // keep legacy name in sync for backwards compatibility
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-campaign-description">
                    Description *
                  </Label>
                  <Textarea
                    id="edit-campaign-description"
                    data-testid="edit-campaign-description-input"
                    value={
                      selectedCampaign.campaign_description ??
                      selectedCampaign.description ??
                      ""
                    }
                    onChange={(e) =>
                      setSelectedCampaign({
                        ...selectedCampaign,
                        campaign_description: e.target.value,
                        // keep legacy description in sync for backwards compatibility
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe this campaign"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-client-id">Client ID</Label>
                  <Input
                    id="edit-client-id"
                    value={selectedCampaign.client_id || ""}
                    onChange={(e) =>
                      setSelectedCampaign({
                        ...selectedCampaign,
                        client_id: e.target.value,
                      })
                    }
                    placeholder="Enter client ID"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-agent-id">Agent ID</Label>
                  <Input
                    id="edit-agent-id"
                    value={
                      selectedCampaign.agent_id ??
                      selectedCampaign.agent_id_vb ??
                      ""
                    }
                    onChange={(e) =>
                      setSelectedCampaign({
                        ...selectedCampaign,
                        agent_id: e.target.value,
                      })
                    }
                    placeholder="Enter agent ID"
                  />
                </div>
              </div>

              {/* Call Scheduling */}
              <div className="pt-4 border-t">
                <h3 className="text-base font-semibold mb-2">
                  Call Scheduling
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-start-call">
                      Start Call (API Trigger)
                    </Label>
                    <Input
                      id="edit-start-call"
                      value={selectedCampaign.start_call || ""}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          start_call: e.target.value,
                        })
                      }
                      placeholder="API trigger for start call"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-call-created-at">
                      Call Created At
                    </Label>
                    <DateTimePicker
                      value={selectedCampaign.call_created_at || ""}
                      onChange={(value) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          call_created_at: value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-call-updated-at">
                      Call Updated At
                    </Label>
                    <DateTimePicker
                      value={selectedCampaign.call_updated_at || ""}
                      onChange={(value) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          call_updated_at: value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Lead Selection for editing - Display as table */}
              <div className="pt-3 border-t">
                <Label className="text-base font-medium mb-2 block">
                  Campaign Leads
                </Label>

                {(() => {
                  const campaignLeads = leads.filter(
                    (lead) =>
                      lead.campaign_name === selectedCampaign.campaign_name
                  );

                  return campaignLeads.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden max-h-96">
                      <div className="overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {campaignLeads.map((lead) => (
                              <tr
                                key={lead.id}
                                className="hover:bg-gray-50"
                                data-testid={`lead-row-${lead.id}`}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <div className="text-sm font-medium text-gray-900">
                                      {lead.lead_type === "individual"
                                        ? `${lead.lead_first_name || ""} ${
                                            lead.lead_last_name || ""
                                          }`.trim() || "No name"
                                        : lead.business_name ||
                                          "No business name"}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                                      <Badge
                                        variant="outline"
                                        className="capitalize text-xs"
                                      >
                                        {lead.lead_type || "Unknown"}
                                      </Badge>
                                      {lead.lead_id && (
                                        <span className="font-mono text-xs text-gray-400">
                                          {lead.lead_id}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex flex-col space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="truncate max-w-xs text-sm text-gray-900">
                                        {lead.lead_email ||
                                          lead.email ||
                                          "No email"}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm text-gray-900">
                                        {lead.lead_phone ||
                                          lead.phone ||
                                          "No phone"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge
                                    className={`${getStatusColor(
                                      lead.status
                                    )} capitalize text-xs`}
                                  >
                                    {lead.status.replace("_", " ")}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        openEditLeadInCampaignDialog(lead)
                                      }
                                      data-testid={`edit-lead-btn-${lead.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        openDeleteLeadInCampaignDialog(lead)
                                      }
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      data-testid={`delete-lead-btn-${lead.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No leads available for this campaign.
                    </p>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedCampaign(null);
                    setSelectedLeads([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="edit-campaign-submit-btn"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Update Campaign
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              {(() => {
                const isActive = selectedCampaign.is_active;
                const leadCount = selectedCampaign.total_leads || 0;
                const campaignName =
                  selectedCampaign.campaign_name || selectedCampaign.name;

                // Check if campaign has any leads with "ready" status
                const campaignLeads = leads.filter(
                  (lead) => lead.campaign_name === campaignName
                );
                const hasReadyLeads = campaignLeads.some(
                  (lead) => lead.status === "ready"
                );

                if (isActive && leadCount > 0) {
                  // Active campaign with leads - cannot delete
                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium text-red-900">
                            {campaignName}
                          </h4>
                        </div>
                        <p className="text-sm text-red-700 mt-2">
                          This campaign has {leadCount} leads which can't be
                          deleted. First delete those leads then you can delete
                          this campaign.
                        </p>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDeleteDialogOpen(false);
                            setSelectedCampaign(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled
                          data-testid="delete-campaign-confirm-btn"
                          className="bg-red-300 text-white cursor-not-allowed"
                        >
                          Delete Campaign
                        </Button>
                      </div>
                    </div>
                  );
                } else if (!isActive && hasReadyLeads) {
                  // Inactive campaign with ready leads - cannot delete
                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium text-red-900">
                            {campaignName}
                          </h4>
                        </div>
                        <p className="text-sm text-red-700 mt-2">
                          You have leads with status "ready". You can't delete
                          this campaign. Either delete the leads or change their
                          status to something other than ready.
                        </p>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDeleteDialogOpen(false);
                            setSelectedCampaign(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled
                          data-testid="delete-campaign-confirm-btn"
                          className="bg-red-300 text-white cursor-not-allowed"
                        >
                          Delete Campaign
                        </Button>
                      </div>
                    </div>
                  );
                } else {
                  // Inactive campaign without ready leads or active with 0 leads - can delete
                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-900">
                          {campaignName}
                        </h4>
                        <p className="text-sm text-red-600 mt-2">
                          This will delete {leadCount} leads from the campaign
                          and all associated call logs.
                        </p>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDeleteDialogOpen(false);
                            setSelectedCampaign(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDeleteCampaign}
                          data-testid="delete-campaign-confirm-btn"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete Campaign
                        </Button>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Lead in Campaign Dialog */}
      <Dialog
        open={deleteLeadInCampaignDialogOpen}
        onOpenChange={setDeleteLeadInCampaignDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lead? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedLeadInCampaign && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">
                  {selectedLeadInCampaign.lead_type === "individual"
                    ? `${selectedLeadInCampaign.lead_first_name || ""} ${
                        selectedLeadInCampaign.lead_last_name || ""
                      }`.trim() || "No name"
                    : selectedLeadInCampaign.business_name ||
                      "No business name"}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {selectedLeadInCampaign.lead_email ||
                    selectedLeadInCampaign.email ||
                    "No email"}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteLeadInCampaignDialogOpen(false);
                    setSelectedLeadInCampaign(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteLeadInCampaign}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead in Campaign Dialog */}
      <Dialog
        open={editLeadInCampaignDialogOpen}
        onOpenChange={setEditLeadInCampaignDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          {selectedLeadInCampaign && (
            <form onSubmit={handleEditLeadInCampaign} className="space-y-4">
              {/* Campaign Information - Display at top */}
              <div className="space-y-3 border-b pb-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">
                  Campaign Information
                </h3>

                <div>
                  <Label>Campaign</Label>
                  <div className="text-sm mt-1">
                    <span className="font-medium">
                      {selectedLeadInCampaign.campaign_name || "No Campaign"}
                    </span>
                    {selectedLeadInCampaign.campaign_id && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({selectedLeadInCampaign.campaign_id})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lead Information */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Lead Information
                </h3>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={(selectedLeadInCampaign.status || "new").replace(
                      "_",
                      "-"
                    )}
                    onValueChange={(value) =>
                      setSelectedLeadInCampaign({
                        ...selectedLeadInCampaign,
                        status: value.replace("-", "_") as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="pending-preview">
                        Pending Preview
                      </SelectItem>
                      <SelectItem value="previewed">Previewed</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="no-response">No Response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Lead ID</Label>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    {selectedLeadInCampaign.lead_id ||
                      selectedLeadInCampaign.id}
                  </div>
                </div>
                <div>
                  <Label>Lead Type</Label>
                  <div className="text-sm font-medium mt-1 capitalize">
                    {selectedLeadInCampaign.lead_type || "N/A"}
                  </div>
                </div>
              </div>

              {/* Conditional Fields Based on Lead Type */}
              {selectedLeadInCampaign.lead_type === "individual" && (
                <div className="space-y-3 border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Individual Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-lead-in-campaign-first-name">
                        First Name *
                      </Label>
                      <Input
                        id="edit-lead-in-campaign-first-name"
                        value={selectedLeadInCampaign.lead_first_name || ""}
                        onChange={(e) =>
                          setSelectedLeadInCampaign({
                            ...selectedLeadInCampaign,
                            lead_first_name: e.target.value,
                          })
                        }
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-lead-in-campaign-last-name">
                        Last Name *
                      </Label>
                      <Input
                        id="edit-lead-in-campaign-last-name"
                        value={selectedLeadInCampaign.lead_last_name || ""}
                        onChange={(e) =>
                          setSelectedLeadInCampaign({
                            ...selectedLeadInCampaign,
                            lead_last_name: e.target.value,
                          })
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-lead-in-campaign-phone">
                      Lead's Contact # *
                    </Label>
                    <Input
                      id="edit-lead-in-campaign-phone"
                      value={selectedLeadInCampaign.lead_phone || ""}
                      onChange={(e) =>
                        setSelectedLeadInCampaign({
                          ...selectedLeadInCampaign,
                          lead_phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-lead-in-campaign-email">
                      Lead's Email
                    </Label>
                    <Input
                      id="edit-lead-in-campaign-email"
                      type="email"
                      value={selectedLeadInCampaign.lead_email || ""}
                      onChange={(e) =>
                        setSelectedLeadInCampaign({
                          ...selectedLeadInCampaign,
                          lead_email: e.target.value,
                        })
                      }
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-leads-in-campaign-notes">
                      Lead's Insight *
                    </Label>
                    <Textarea
                      id="edit-leads-in-campaign-notes"
                      value={selectedLeadInCampaign.leads_notes || ""}
                      onChange={(e) =>
                        setSelectedLeadInCampaign({
                          ...selectedLeadInCampaign,
                          leads_notes: e.target.value,
                        })
                      }
                      placeholder="Add notes or background information..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {selectedLeadInCampaign.lead_type === "organization" && (
                <div className="space-y-3 border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Organization Details
                  </h3>

                  <div>
                    <Label htmlFor="edit-business-in-campaign-name">
                      Business Name *
                    </Label>
                    <Input
                      id="edit-business-in-campaign-name"
                      value={selectedLeadInCampaign.business_name || ""}
                      onChange={(e) =>
                        setSelectedLeadInCampaign({
                          ...selectedLeadInCampaign,
                          business_name: e.target.value,
                        })
                      }
                      placeholder="Company Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-business-in-campaign-phone">
                      Business Phone *
                    </Label>
                    <Input
                      id="edit-business-in-campaign-phone"
                      value={selectedLeadInCampaign.business_phone || ""}
                      onChange={(e) =>
                        setSelectedLeadInCampaign({
                          ...selectedLeadInCampaign,
                          business_phone: e.target.value,
                        })
                      }
                      placeholder="Business phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-business-in-campaign-address">
                      Business Address *
                    </Label>
                    <Textarea
                      id="edit-business-in-campaign-address"
                      value={selectedLeadInCampaign.business_address || ""}
                      onChange={(e) =>
                        setSelectedLeadInCampaign({
                          ...selectedLeadInCampaign,
                          business_address: e.target.value,
                        })
                      }
                      placeholder="Full business address"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-business-in-campaign-summary">
                      Lead's Business Insight (Optional, max 240 chars)
                    </Label>
                    <Textarea
                      id="edit-business-in-campaign-summary"
                      value={selectedLeadInCampaign.business_summary || ""}
                      onChange={(e) =>
                        setSelectedLeadInCampaign({
                          ...selectedLeadInCampaign,
                          business_summary: e.target.value,
                        })
                      }
                      placeholder="Brief description of the business"
                      maxLength={240}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedLeadInCampaign.business_summary?.length || 0}/240
                      characters
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditLeadInCampaignDialogOpen(false);
                    setSelectedLeadInCampaign(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Update Lead
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default CampaignManagement;
