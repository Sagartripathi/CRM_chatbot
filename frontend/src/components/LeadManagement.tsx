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
import { CampaignSelector } from "./CampaignSelector";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  FileText,
  Edit,
  Trash2,
  Building2,
  User,
} from "lucide-react";

function LeadManagement() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCampaignId, setUploadCampaignId] = useState("");
  const [uploading, setUploading] = useState(false);
  const leadsPerPage = parseInt(process.env.REACT_APP_LEADS_PER_PAGE || "20");

  // Sidebar managed by Layout component
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Empty lead state constant
  const emptyLeadState = {
    // Mandatory fields
    lead_type: "individual", // Default to individual
    campaign_name: "",
    campaign_id: "",

    // Individual fields
    lead_first_name: "",
    lead_last_name: "",
    lead_phone: "",
    leads_notes: "",
    lead_email: "",

    // Organization fields
    business_name: "",
    business_phone: "",
    business_address: "",
    business_summary: "",

    // Legacy fields (for backward compatibility)
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    source: "",
    notes: "",
    status: "new",

    // Voice Bot fields
    decision_maker_identified_shared: false,
    first_contact_name_vb: "",
    referral_name_vb: "",
    referral_phone_vb: "",
    referral_email_vb: "",
    referral_role_vb: "",
    call_status_vb: "",
    call_duration_vb: 0,
    conversation_summary_vb: "",
    record_summary_shared: "",
    follow_up_count_pc: false,
    undetermined_flag_pc: false,
    meeting_booked_shared: false,
    demo_booking_shared: {
      booking_name_shared: "",
      booking_phone_shared: "",
      booking_email_shared: "",
      booking_date_shared: "",
      booking_time_shared: "",
      calendar_event_id_shared: "",
    },
    updated_by_shared: "",
  };

  const [newLead, setNewLead] = useState(emptyLeadState);

  useEffect(() => {
    if (user && !authLoading) {
      fetchLeads();
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Filter leads based on search and filters
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          `${lead.lead_first_name || lead.first_name || ""} ${
            lead.lead_last_name || lead.last_name || ""
          }`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (lead.lead_email || lead.email)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (lead.lead_phone || lead.phone)?.includes(searchTerm) ||
          lead.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "null" || statusFilter === "no_status") {
        // Filter for leads with null or undefined status
        filtered = filtered.filter(
          (lead) =>
            lead.status == null || lead.status === null || lead.status === ""
        );
      } else {
        filtered = filtered.filter((lead) => lead.status === statusFilter);
      }
    }

    if (sourceFilter && sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      if (!user) {
        return;
      }

      const [leadsResponse, campaignsResponse] = await Promise.all([
        apiClient.get("/leads/"),
        apiClient.get("/campaigns/"),
      ]);

      // Sort leads by created_at descending (newest first)
      const sortedLeads = [...(leadsResponse.data || [])].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      // Sort campaigns by created_at descending (newest first)
      const sortedCampaigns = [...(campaignsResponse.data || [])].sort(
        (a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }
      );

      setLeads(sortedLeads);
      setFilteredLeads(sortedLeads);
      setCampaigns(sortedCampaigns);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to access leads data");
      } else {
        toast.error("Failed to load data");
        console.error("Fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();

    // Validate mandatory fields
    if (!newLead.campaign_name.trim() || !newLead.campaign_id.trim()) {
      toast.error("Campaign is required");
      return;
    }

    if (!newLead.lead_type) {
      toast.error("Lead type is required");
      return;
    }

    // Validate conditional fields based on lead type
    if (newLead.lead_type === "individual") {
      if (!newLead.lead_first_name.trim()) {
        toast.error("First Name is required for individual leads");
        return;
      }
      if (!newLead.lead_last_name.trim()) {
        toast.error("Last Name is required for individual leads");
        return;
      }
      if (!newLead.lead_phone.trim()) {
        toast.error("Lead's Contact # is required for individual leads");
        return;
      }
      if (!newLead.leads_notes.trim()) {
        toast.error("Lead's Insight is required for individual leads");
        return;
      }
    } else if (newLead.lead_type === "organization") {
      if (!newLead.business_name.trim()) {
        toast.error("Business Name is required for organization leads");
        return;
      }
      if (!newLead.business_phone.trim()) {
        toast.error("Business Phone is required for organization leads");
        return;
      }
      if (!newLead.business_address.trim()) {
        toast.error("Business Address is required for organization leads");
        return;
      }
    }

    try {
      // Build lead data based on lead type
      const leadData: any = {
        lead_type: newLead.lead_type,
        campaign_name: newLead.campaign_name,
        campaign_id: newLead.campaign_id,
        status: newLead.status,
      };

      // Add fields based on lead type
      if (newLead.lead_type === "individual") {
        leadData.lead_first_name = newLead.lead_first_name;
        leadData.lead_last_name = newLead.lead_last_name;
        leadData.lead_phone = newLead.lead_phone;
        leadData.leads_notes = newLead.leads_notes;
        if (newLead.lead_email) leadData.lead_email = newLead.lead_email;

        // Internal fields (will be set by backend)
        leadData.batch_id = "";
        leadData.updated_at_shared = "";

        leadData.is_valid = true;
      } else if (newLead.lead_type === "organization") {
        leadData.business_name = newLead.business_name;
        leadData.business_phone = newLead.business_phone;
        leadData.business_address = newLead.business_address;
        if (newLead.business_summary)
          leadData.business_summary = newLead.business_summary;

        // Internal fields (will be set by backend)
        leadData.batch_id = "";
        leadData.updated_at_shared = "";

        leadData.is_valid = true;
      }

      // Add optional legacy fields
      leadData.source = "manual_form"; // Set source for form-created leads
      if (newLead.notes) leadData.notes = newLead.notes;

      // Voice Bot Contact fields
      if (newLead.first_contact_name_vb)
        leadData.first_contact_name_vb = newLead.first_contact_name_vb;
      if (newLead.referral_name_vb)
        leadData.referral_name_vb = newLead.referral_name_vb;
      if (newLead.referral_phone_vb)
        leadData.referral_phone_vb = newLead.referral_phone_vb;
      if (newLead.referral_email_vb)
        leadData.referral_email_vb = newLead.referral_email_vb;
      if (newLead.referral_role_vb)
        leadData.referral_role_vb = newLead.referral_role_vb;

      // Call status fields
      if (newLead.call_status_vb)
        leadData.call_status_vb = newLead.call_status_vb;
      if (newLead.call_duration_vb)
        leadData.call_duration_vb = newLead.call_duration_vb;
      if (newLead.conversation_summary_vb)
        leadData.conversation_summary_vb = newLead.conversation_summary_vb;
      if (newLead.record_summary_shared)
        leadData.record_summary_shared = newLead.record_summary_shared;

      // Boolean fields - include if true
      if (newLead.decision_maker_identified_shared)
        leadData.decision_maker_identified_shared =
          newLead.decision_maker_identified_shared;
      if (newLead.follow_up_count_pc)
        leadData.follow_up_count_pc = newLead.follow_up_count_pc;
      if (newLead.undetermined_flag_pc)
        leadData.undetermined_flag_pc = newLead.undetermined_flag_pc;
      if (newLead.meeting_booked_shared)
        leadData.meeting_booked_shared = newLead.meeting_booked_shared;

      // Demo booking - only if it has any data
      if (
        newLead.demo_booking_shared?.booking_name_shared ||
        newLead.demo_booking_shared?.booking_phone_shared ||
        newLead.demo_booking_shared?.booking_email_shared ||
        newLead.demo_booking_shared?.booking_date_shared ||
        newLead.demo_booking_shared?.booking_time_shared ||
        newLead.demo_booking_shared?.calendar_event_id_shared
      ) {
        leadData.demo_booking_shared = {};
        if (newLead.demo_booking_shared.booking_name_shared)
          leadData.demo_booking_shared.booking_name_shared =
            newLead.demo_booking_shared.booking_name_shared;
        if (newLead.demo_booking_shared.booking_phone_shared)
          leadData.demo_booking_shared.booking_phone_shared =
            newLead.demo_booking_shared.booking_phone_shared;
        if (newLead.demo_booking_shared.booking_email_shared)
          leadData.demo_booking_shared.booking_email_shared =
            newLead.demo_booking_shared.booking_email_shared;
        if (newLead.demo_booking_shared.booking_date_shared)
          leadData.demo_booking_shared.booking_date_shared =
            newLead.demo_booking_shared.booking_date_shared;
        if (newLead.demo_booking_shared.booking_time_shared)
          leadData.demo_booking_shared.booking_time_shared =
            newLead.demo_booking_shared.booking_time_shared;
        if (newLead.demo_booking_shared.calendar_event_id_shared)
          leadData.demo_booking_shared.calendar_event_id_shared =
            newLead.demo_booking_shared.calendar_event_id_shared;
      }

      if (newLead.updated_by_shared)
        leadData.updated_by_shared = newLead.updated_by_shared;

      await apiClient.post("/leads/", leadData);
      toast.success("Lead created successfully!");
      setCreateDialogOpen(false);
      setNewLead(emptyLeadState);
      fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
      console.error("Error response:", error.response?.data);

      // Handle validation errors (array of error objects)
      if (
        error.response?.data?.detail &&
        Array.isArray(error.response.data.detail)
      ) {
        const errorMessages = error.response.data.detail
          .map((err) => `${err.loc?.join(" > ") || "Field"}: ${err.msg}`)
          .join(", ");
        console.error("Validation errors:", error.response.data.detail);
        toast.error(`Validation error: ${errorMessages}`);
      } else if (typeof error.response?.data?.detail === "string") {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to create lead. Please check your input.");
      }
    }
  };

  const handleEditLead = async (e) => {
    e.preventDefault();

    // Validate conditional fields based on lead type
    if (selectedLead.lead_type === "individual") {
      if (!selectedLead.lead_first_name?.trim()) {
        toast.error("First Name is required for individual leads");
        return;
      }
      if (!selectedLead.lead_last_name?.trim()) {
        toast.error("Last Name is required for individual leads");
        return;
      }
      if (!selectedLead.lead_phone?.trim()) {
        toast.error("Lead's Contact # is required for individual leads");
        return;
      }
      if (!selectedLead.leads_notes?.trim()) {
        toast.error("Lead's Insight is required for individual leads");
        return;
      }
    } else if (selectedLead.lead_type === "organization") {
      if (!selectedLead.business_name?.trim()) {
        toast.error("Business Name is required for organization leads");
        return;
      }
      if (!selectedLead.business_phone?.trim()) {
        toast.error("Business Phone is required for organization leads");
        return;
      }
      if (!selectedLead.business_address?.trim()) {
        toast.error("Business Address is required for organization leads");
        return;
      }
    }

    try {
      // Send all existing lead data
      const leadData = {
        ...selectedLead,
        // Ensure optional fields are undefined if empty
        lead_email: selectedLead.lead_email || undefined,
        business_summary: selectedLead.business_summary || undefined,
        // Voice bot fields
        first_contact_name_vb: selectedLead.first_contact_name_vb || undefined,
        referral_name_vb: selectedLead.referral_name_vb || undefined,
        referral_phone_vb: selectedLead.referral_phone_vb || undefined,
        referral_email_vb: selectedLead.referral_email_vb || undefined,
        referral_role_vb: selectedLead.referral_role_vb || undefined,
        call_status_vb: selectedLead.call_status_vb || undefined,
        call_duration_vb: selectedLead.call_duration_vb || undefined,
        conversation_summary_vb:
          selectedLead.conversation_summary_vb || undefined,
        record_summary_shared: selectedLead.record_summary_shared || undefined,
        updated_by_shared: selectedLead.updated_by_shared || undefined,
        // Handle demo_booking_shared
        demo_booking_shared:
          selectedLead.demo_booking_shared?.booking_name_shared ||
          selectedLead.demo_booking_shared?.booking_phone_shared ||
          selectedLead.demo_booking_shared?.booking_email_shared ||
          selectedLead.demo_booking_shared?.booking_date_shared ||
          selectedLead.demo_booking_shared?.booking_time_shared ||
          selectedLead.demo_booking_shared?.calendar_event_id_shared
            ? {
                booking_name_shared:
                  selectedLead.demo_booking_shared.booking_name_shared ||
                  undefined,
                booking_phone_shared:
                  selectedLead.demo_booking_shared.booking_phone_shared ||
                  undefined,
                booking_email_shared:
                  selectedLead.demo_booking_shared.booking_email_shared ||
                  undefined,
                booking_date_shared:
                  selectedLead.demo_booking_shared.booking_date_shared ||
                  undefined,
                booking_time_shared:
                  selectedLead.demo_booking_shared.booking_time_shared ||
                  undefined,
                calendar_event_id_shared:
                  selectedLead.demo_booking_shared.calendar_event_id_shared ||
                  undefined,
              }
            : undefined,
      };

      await apiClient.put(`/leads/${selectedLead.id}`, leadData);
      toast.success("Lead updated successfully!");
      setEditDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
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

  const handleDeleteLead = async () => {
    try {
      await apiClient.delete(`/leads/${selectedLead.id}`);
      toast.success("Lead deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      const errorMsg =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Failed to delete lead";
      toast.error(errorMsg);
    }
  };

  const handleUploadCSV = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.error("Please select a CSV file");
      return;
    }

    if (!uploadCampaignId) {
      toast.error("Please select a campaign to assign the leads to");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);

      const url = `/leads/upload-csv?campaign_id=${uploadCampaignId}`;

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
      setUploadCampaignId("");
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();

    if (!selectedLead) return;

    try {
      const campaignId = selectedLead.campaign_id || null;
      await apiClient.patch(
        `/leads/${selectedLead.id}/campaign?campaign_id=${campaignId || ""}`
      );
      toast.success("Campaign updated successfully!");
      setCampaignDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update campaign");
    }
  };

  const openEditDialog = (lead) => {
    setSelectedLead({ ...lead });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (lead) => {
    setSelectedLead(lead);
    setDeleteDialogOpen(true);
  };

  const openCampaignDialog = (lead) => {
    setSelectedLead({ ...lead });
    setCampaignDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      ready: "bg-indigo-100 text-indigo-800",
      pending_preview: "bg-violet-100 text-violet-800",
      previewed: "bg-purple-100 text-purple-800",
      contacted: "bg-yellow-100 text-yellow-800",
      converted: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
      no_response: "bg-gray-100 text-gray-800",
    };
    // Handle null, undefined, or empty string status
    if (!status || status === null || status === "") {
      return "bg-gray-100 text-gray-600";
    }
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getUniqueValues = (field) => {
    return [...new Set(leads.map((lead) => lead[field]).filter(Boolean))];
  };

  const getCampaignName = (campaignId) => {
    if (!campaignId) return "No Campaign";
    const campaign = campaigns.find((c) => c.id === campaignId);
    return campaign ? campaign.name : "Unknown Campaign";
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter]);

  // Sidebar component removed - now using GlobalSidebar via Layout

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const headerTitle =
    user?.role === "client"
      ? `My Leads (${filteredLeads.length} of ${leads.length})`
      : `Leads (${filteredLeads.length} of ${leads.length})`;

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Button
        variant="outline"
        onClick={() => setUploadDialogOpen(true)}
        data-testid="upload-csv-btn"
      >
        <FileText className="mr-2 h-4 w-4" />
        Upload CSV
      </Button>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button
            data-testid="create-lead-btn"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 btn-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead to your database
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4">
            {/* Campaign Information Section - At the top */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Campaign Information
              </h3>

              <CampaignSelector
                campaigns={campaigns}
                value={newLead.campaign_id}
                onValueChange={(campaignId, campaignName) => {
                  setNewLead({
                    ...newLead,
                    campaign_id: campaignId,
                    campaign_name: campaignName,
                  });
                }}
                placeholder="Search and select campaign"
              />
            </div>

            {/* Lead Information Section */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Lead Information
              </h3>

              <div>
                <Label htmlFor="lead-type">Lead Type *</Label>
                <Select
                  value={newLead.lead_type}
                  onValueChange={(value) =>
                    setNewLead({ ...newLead, lead_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional Fields Based on Lead Type */}
            {newLead.lead_type === "individual" && (
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Individual Details
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lead-first-name">First Name *</Label>
                    <Input
                      id="lead-first-name"
                      value={newLead.lead_first_name}
                      onChange={(e) =>
                        setNewLead({
                          ...newLead,
                          lead_first_name: e.target.value,
                        })
                      }
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-last-name">Last Name *</Label>
                    <Input
                      id="lead-last-name"
                      value={newLead.lead_last_name}
                      onChange={(e) =>
                        setNewLead({
                          ...newLead,
                          lead_last_name: e.target.value,
                        })
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lead-phone">Lead's Contact # *</Label>
                  <Input
                    id="lead-phone"
                    value={newLead.lead_phone}
                    onChange={(e) =>
                      setNewLead({ ...newLead, lead_phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="lead-email">Lead's Email</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    value={newLead.lead_email}
                    onChange={(e) =>
                      setNewLead({ ...newLead, lead_email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="leads-notes">Lead's Insight *</Label>
                  <Textarea
                    id="leads-notes"
                    value={newLead.leads_notes}
                    onChange={(e) =>
                      setNewLead({ ...newLead, leads_notes: e.target.value })
                    }
                    placeholder="Add notes or background information..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {newLead.lead_type === "organization" && (
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Organization Details
                </h3>

                <div>
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    value={newLead.business_name}
                    onChange={(e) =>
                      setNewLead({ ...newLead, business_name: e.target.value })
                    }
                    placeholder="Company Name"
                  />
                </div>

                <div>
                  <Label htmlFor="business-phone">Business Phone *</Label>
                  <Input
                    id="business-phone"
                    value={newLead.business_phone}
                    onChange={(e) =>
                      setNewLead({ ...newLead, business_phone: e.target.value })
                    }
                    placeholder="Business phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="business-address">Business Address *</Label>
                  <Textarea
                    id="business-address"
                    value={newLead.business_address}
                    onChange={(e) =>
                      setNewLead({
                        ...newLead,
                        business_address: e.target.value,
                      })
                    }
                    placeholder="Full business address"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="business-summary">
                    Lead's Business Insight (Optional, max 240 chars)
                  </Label>
                  <Textarea
                    id="business-summary"
                    value={newLead.business_summary}
                    onChange={(e) =>
                      setNewLead({
                        ...newLead,
                        business_summary: e.target.value,
                      })
                    }
                    placeholder="Brief description of the business"
                    maxLength={240}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newLead.business_summary?.length || 0}/240 characters
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewLead(emptyLeadState);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="create-lead-submit-btn"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Create Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Layout title={headerTitle} headerActions={headerActions}>
      {/* Filters */}
      <div className="bg-white border-b p-4 -mt-6 -mx-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search leads by name, email, phone, or campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-leads-input"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-full sm:w-48"
              data-testid="status-filter"
            >
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="null">No Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="pending_preview">Pending Review</SelectItem>
              <SelectItem value="previewed">Reviewed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="no_response">No Response</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger
              className="w-full sm:w-48"
              data-testid="source-filter"
            >
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual_form">Manual Form</SelectItem>
              <SelectItem value="csv_upload">CSV Upload</SelectItem>
              {getUniqueValues("source")
                .filter(
                  (source) =>
                    source !== "manual_form" && source !== "csv_upload"
                )
                .map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leads List */}
      <main className="p-6">
        {paginatedLeads.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>

                  {/* this is the extraction for lead display */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr
                      className="hover:bg-gray-50 h-20"
                      data-testid={`lead-row-${lead.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap h-20">
                        <div className="h-full flex flex-col justify-center">
                          <div className="flex items-center space-x-2 mb-1">
                            {lead.lead_type === "organization" ? (
                              <Building2 className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                            ) : (
                              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {lead.lead_type === "individual"
                                ? `${lead.lead_first_name || ""} ${
                                    lead.lead_last_name || ""
                                  }`.trim() || "No name"
                                : lead.business_name || "No business name"}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center space-x-2 ml-6">
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
                      <td className="px-6 py-4 whitespace-nowrap h-20">
                        <div className="h-full flex flex-col justify-center space-y-1">
                          {lead.lead_type === "organization" ? (
                            <>
                              <div className="flex items-center space-x-1 h-5">
                                <Building2 className="h-3 w-3 text-indigo-600 flex-shrink-0" />
                                <span className="truncate max-w-xs text-gray-900">
                                  {lead.business_name || "No business name"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 h-5">
                                <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-900">
                                  {lead.business_phone || "No phone"}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-1 h-5">
                                <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-xs text-gray-900">
                                  {lead.lead_email || lead.email || "No email"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 h-5">
                                <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-900">
                                  {lead.lead_phone || lead.phone || "No phone"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap h-20">
                        <div className="h-full flex flex-col justify-center">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.campaign_name ||
                              getCampaignName(lead.campaign_id) ||
                              "No campaign"}
                          </div>
                          {lead.campaign_id && (
                            <div className="text-xs text-gray-500 font-mono">
                              ({lead.campaign_id})
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap h-20">
                        <div className="h-full flex items-center">
                          <Badge
                            className={`${getStatusColor(
                              lead.status
                            )} capitalize`}
                          >
                            {lead.status
                              ? lead.status.replace(/_/g, " ")
                              : "No Status"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap h-20">
                        <div className="h-full flex items-center">
                          {lead.source ? (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                lead.source === "csv_upload"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : lead.source === "manual_form"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {lead.source === "csv_upload"
                                ? "CSV Upload"
                                : lead.source === "manual_form"
                                ? "Manual Form"
                                : lead.source}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 italic">
                              Not specified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium h-20">
                        <div className="h-full flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(lead)}
                            data-testid={`edit-lead-btn-${lead.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user?.role !== "client" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDeleteDialog(lead)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`delete-lead-btn-${lead.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Call Tracking Section - commented out for now */}
                    {false &&
                      (lead.call_status_vb ||
                        lead.business_name ||
                        lead.conversation_summary_vb ||
                        lead.first_contact_name_vb) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-900">
                                Additional Information
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Business Info */}
                                {lead.business_name && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">
                                      Business:
                                    </span>
                                    <span className="ml-2 text-gray-600">
                                      {lead.business_name}
                                    </span>
                                  </div>
                                )}

                                {/* Call Status */}
                                {lead.call_status_vb && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">
                                      Call Status:
                                    </span>
                                    <Badge variant="outline" className="ml-2">
                                      {lead.call_status_vb}
                                    </Badge>
                                    {lead.call_duration_vb && (
                                      <span className="ml-2 text-gray-500">
                                        ({lead.call_duration_vb}s)
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Contact Name */}
                                {lead.first_contact_name_vb && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">
                                      Contact:
                                    </span>
                                    <span className="ml-2 text-gray-600">
                                      {lead.first_contact_name_vb}
                                    </span>
                                  </div>
                                )}

                                {/* Referral Info */}
                                {lead.referral_name_vb && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">
                                      Referral:
                                    </span>
                                    <span className="ml-2 text-gray-600">
                                      {lead.referral_name_vb}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Conversation Summary */}
                              {lead.conversation_summary_vb && (
                                <div className="text-sm bg-white p-3 rounded border">
                                  <span className="font-medium text-gray-700">
                                    Summary:
                                  </span>
                                  <p className="mt-1 text-gray-600">
                                    {lead.conversation_summary_vb}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(endIndex, filteredLeads.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredLeads.length}
                      </span>{" "}
                      leads
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="rounded-r-none"
                      >
                        Previous
                      </Button>
                      {[...Array(totalPages)].map((_, idx) => {
                        const page = idx + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              className="rounded-none"
                            >
                              {page}
                            </Button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                      <Button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="rounded-l-none"
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {leads.length === 0
                  ? "No leads yet"
                  : "No leads match your filters"}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {leads.length === 0
                  ? "Create your first lead to start building your customer database and running campaigns."
                  : "Try adjusting your search terms or filters to find the leads you're looking for."}
              </p>
              {leads.length === 0 ? (
                <Dialog
                  open={createDialogOpen}
                  onOpenChange={setCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Lead
                    </Button>
                  </DialogTrigger>
                </Dialog>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSourceFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={handleEditLead} className="space-y-4">
              {/* Campaign Information - Display at top */}
              <div className="space-y-3 border-b pb-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">
                  Campaign Information
                </h3>

                <div>
                  <Label>Campaign</Label>
                  <div className="text-sm mt-1">
                    <span className="font-medium">
                      {selectedLead.campaign_name || "No Campaign"}
                    </span>
                    {selectedLead.campaign_id && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({selectedLead.campaign_id})
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
                    value={(selectedLead.status || "new").replace("_", "-")}
                    onValueChange={(value) =>
                      setSelectedLead({
                        ...selectedLead,
                        // map dash to underscore for API/backend enum
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
                      <SelectItem value="pending_preview">
                        Pending Review
                      </SelectItem>
                      <SelectItem value="previewed">Reviewed</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="no_response">No Response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Lead ID</Label>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    {selectedLead.lead_id || selectedLead.id}
                  </div>
                </div>
                <div>
                  <Label>Lead Type</Label>
                  <div className="text-sm font-medium mt-1 capitalize">
                    {selectedLead.lead_type || "N/A"}
                  </div>
                </div>
              </div>

              {/* Conditional Fields Based on Lead Type */}
              {selectedLead.lead_type === "individual" && (
                <div className="space-y-3 border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Individual Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-lead-first-name">First Name *</Label>
                      <Input
                        id="edit-lead-first-name"
                        value={selectedLead.lead_first_name || ""}
                        onChange={(e) =>
                          setSelectedLead({
                            ...selectedLead,
                            lead_first_name: e.target.value,
                          })
                        }
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-lead-last-name">Last Name *</Label>
                      <Input
                        id="edit-lead-last-name"
                        value={selectedLead.lead_last_name || ""}
                        onChange={(e) =>
                          setSelectedLead({
                            ...selectedLead,
                            lead_last_name: e.target.value,
                          })
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-lead-phone">Lead's Contact # *</Label>
                    <Input
                      id="edit-lead-phone"
                      value={selectedLead.lead_phone || ""}
                      onChange={(e) =>
                        setSelectedLead({
                          ...selectedLead,
                          lead_phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-lead-email">Lead's Email</Label>
                    <Input
                      id="edit-lead-email"
                      type="email"
                      value={selectedLead.lead_email || ""}
                      onChange={(e) =>
                        setSelectedLead({
                          ...selectedLead,
                          lead_email: e.target.value,
                        })
                      }
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-leads-notes">Lead's Insight *</Label>
                    <Textarea
                      id="edit-leads-notes"
                      value={selectedLead.leads_notes || ""}
                      onChange={(e) =>
                        setSelectedLead({
                          ...selectedLead,
                          leads_notes: e.target.value,
                        })
                      }
                      placeholder="Add notes or background information..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {selectedLead.lead_type === "organization" && (
                <div className="space-y-3 border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Organization Details
                  </h3>

                  <div>
                    <Label htmlFor="edit-business-name">Business Name *</Label>
                    <Input
                      id="edit-business-name"
                      value={selectedLead.business_name || ""}
                      onChange={(e) =>
                        setSelectedLead({
                          ...selectedLead,
                          business_name: e.target.value,
                        })
                      }
                      placeholder="Company Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-business-phone">
                      Business Phone *
                    </Label>
                    <Input
                      id="edit-business-phone"
                      value={selectedLead.business_phone || ""}
                      onChange={(e) =>
                        setSelectedLead({
                          ...selectedLead,
                          business_phone: e.target.value,
                        })
                      }
                      placeholder="Business phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-business-address">
                      Business Address *
                    </Label>
                    <Textarea
                      id="edit-business-address"
                      value={selectedLead.business_address || ""}
                      onChange={(e) =>
                        setSelectedLead({
                          ...selectedLead,
                          business_address: e.target.value,
                        })
                      }
                      placeholder="Full business address"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-business-summary">
                      Lead's Business Insight (Optional, max 240 chars)
                    </Label>
                    <Textarea
                      id="edit-business-summary"
                      value={selectedLead.business_summary || ""}
                      onChange={(e) =>
                        setSelectedLead({
                          ...selectedLead,
                          business_summary: e.target.value,
                        })
                      }
                      placeholder="Brief description of the business"
                      maxLength={240}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedLead.business_summary?.length || 0}/240
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
                    setEditDialogOpen(false);
                    setSelectedLead(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="edit-lead-submit-btn"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Update Lead
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Lead Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lead? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">
                  {selectedLead.lead_type === "individual"
                    ? `${
                        selectedLead.lead_first_name ||
                        selectedLead.first_name ||
                        ""
                      } ${
                        selectedLead.lead_last_name ||
                        selectedLead.last_name ||
                        ""
                      }`.trim() || "No name"
                    : selectedLead.business_name || "No business name"}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {selectedLead.lead_type === "individual" ? (
                    <>
                      {selectedLead.lead_email ||
                        selectedLead.email ||
                        "No email"}{" "}
                      •{" "}
                      {selectedLead.lead_phone ||
                        selectedLead.phone ||
                        "No phone"}
                    </>
                  ) : (
                    <>{selectedLead.business_phone || "No phone"}</>
                  )}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedLead(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteLead}
                  data-testid="delete-lead-confirm-btn"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Leads from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with leads. Required columns: lead_type, status.
              For individual leads: first_name, last_name, phone. For
              organization leads: business_name, business_phone,
              business_address. Campaign assignment is mandatory.
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
                Format: lead_type, status, first_name, last_name, phone
                (individual) OR business_name, business_phone, business_address
                (organization)
              </p>
            </div>

            <div>
              <CampaignSelector
                campaigns={campaigns}
                value={uploadCampaignId}
                onValueChange={(campaignId, campaignName) => {
                  setUploadCampaignId(campaignId);
                }}
                placeholder="Search and select campaign"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setUploadFile(null);
                  setUploadCampaignId("");
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

      {/* Campaign Assignment Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Campaign</DialogTitle>
            <DialogDescription>
              Change the campaign assignment for this lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">
                  {selectedLead.first_name} {selectedLead.last_name}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Current: {getCampaignName(selectedLead.campaign_id)}
                </p>
              </div>

              <div>
                <Label htmlFor="new-campaign">New Campaign</Label>
                <Select
                  value={selectedLead.campaign_id || "none"}
                  onValueChange={(value) =>
                    setSelectedLead({
                      ...selectedLead,
                      campaign_id: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Campaign</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCampaignDialogOpen(false);
                    setSelectedLead(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Update Campaign
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default LeadManagement;
