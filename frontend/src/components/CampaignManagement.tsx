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
} from "lucide-react";

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
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaignStats, setSelectedCampaignStats] = useState(null);
  // Sidebar managed by Layout component

  // Campaign form state matching backend Campaign model
  const emptyCampaign = {
    name: "",
    description: "",
    lead_ids: [],
  };
  const [newCampaign, setNewCampaign] = useState({ ...emptyCampaign });

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!user) {
        console.log("User not authenticated, skipping data fetch");
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
        console.log("Authentication error - user may need to log in");
        toast.error("Please log in to access this data");
      } else {
        toast.error("Failed to load data");
        console.error("Fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    if (!newCampaign.name || !newCampaign.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      const payload = {
        name: newCampaign.name,
        description: newCampaign.description || undefined,
        lead_ids: selectedLeads,
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

    if (!selectedCampaign?.name || !selectedCampaign.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      const payload = {
        name: selectedCampaign.name,
        description: selectedCampaign.description || undefined,
        lead_ids: selectedLeads,
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
      name: campaign.name ?? "",
      description: campaign.description ?? "",
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
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={newCampaign.name}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    name: e.target.value,
                  })
                }
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div>
              <Label htmlFor="campaign-description">
                Description (Optional)
              </Label>
              <Textarea
                id="campaign-description"
                value={newCampaign.description}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this campaign"
                rows={3}
              />
            </div>
          </div>

          {/* Lead Selection (Existing Section) */}
          <div className="pt-4 border-t">
            <Label className="text-base font-medium">
              Select Leads (Optional)
            </Label>
            <p className="text-sm text-gray-500 mb-4">
              Choose leads to include in this campaign or create an empty
              campaign
            </p>

            {leads.length > 0 ? (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`lead-${lead.id}`}
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) =>
                        handleLeadSelection(lead.id, checked)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lead.email} • {lead.phone}
                      </p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No leads available. Create some leads first.
              </p>
            )}

            <p className="text-sm text-indigo-600 mt-2">
              {selectedLeads.length > 0
                ? `${selectedLeads.length} lead(s) selected`
                : "No leads selected - campaign will be created empty"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setSelectedLeads([]);
                setNewCampaign({ ...emptyCampaign });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
                      {campaign.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {campaign.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={campaign.is_active ? "default" : "secondary"}>
                    {campaign.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">
                        {campaign.total_leads}
                      </p>
                      <p className="text-xs text-gray-500">Total Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {campaign.completed_leads}
                      </p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {campaign.total_leads > 0
                          ? Math.round(
                              (campaign.completed_leads /
                                campaign.total_leads) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="progress-bar h-2 rounded-full"
                        style={{
                          width:
                            campaign.total_leads > 0
                              ? `${
                                  (campaign.completed_leads /
                                    campaign.total_leads) *
                                  100
                                }%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {user?.role === "agent" && campaign.is_active && (
                      <Button
                        size="sm"
                        data-testid={`start-campaign-btn-${campaign.id}`}
                        onClick={() => handleStartCampaign(campaign.id)}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Agent
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`view-stats-btn-${campaign.id}`}
                      onClick={() => handleViewStats(campaign)}
                      className={
                        user?.role === "agent" && campaign.is_active
                          ? "flex-1"
                          : "flex-1"
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Stats
                    </Button>
                  </div>

                  {/* Edit/Delete Actions */}
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(campaign)}
                      className="flex-1"
                      data-testid={`edit-campaign-btn-${campaign.id}`}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteDialog(campaign)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-campaign-btn-${campaign.id}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    Created {new Date(campaign.created_at).toLocaleDateString()}
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
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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
                    onChange={(e) =>
                      setSelectedCampaign({
                        ...selectedCampaign,
                        campaign_id: e.target.value,
                      })
                    }
                    placeholder="Enter unique campaign ID"
                  />
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
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="edit-campaign-description"
                    data-testid="edit-campaign-description-input"
                    value={selectedCampaign.description || ""}
                    onChange={(e) =>
                      setSelectedCampaign({
                        ...selectedCampaign,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe this campaign"
                    rows={3}
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
                  <Label htmlFor="edit-agent-id-vb">Agent ID (VB)</Label>
                  <Input
                    id="edit-agent-id-vb"
                    value={selectedCampaign.agent_id_vb || ""}
                    onChange={(e) =>
                      setSelectedCampaign({
                        ...selectedCampaign,
                        agent_id_vb: e.target.value,
                      })
                    }
                    placeholder="Enter agent ID"
                  />
                </div>
              </div>

              {/* Scheduling & Attempts */}
              <div className="pt-4 border-t">
                <h3 className="text-base font-semibold mb-2">
                  Scheduling & Attempts
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-main-sequence-attempts">
                      Main Sequence Attempts
                    </Label>
                    <Input
                      id="edit-main-sequence-attempts"
                      type="number"
                      min="0"
                      value={selectedCampaign.main_sequence_attempts}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          main_sequence_attempts: Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 3"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-follow-up-delay-days">
                      Follow-up Delay (Days)
                    </Label>
                    <Input
                      id="edit-follow-up-delay-days"
                      type="number"
                      min="0"
                      value={selectedCampaign.follow_up_delay_days_pc}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          follow_up_delay_days_pc: Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-follow-up-max-attempts">
                      Follow-up Max Attempts
                    </Label>
                    <Input
                      id="edit-follow-up-max-attempts"
                      type="number"
                      min="0"
                      value={selectedCampaign.follow_up_max_attempts_pc}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          follow_up_max_attempts_pc: Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              </div>

              {/* Config Parameters */}
              <div className="pt-4 border-t">
                <h3 className="text-base font-semibold mb-2">
                  Config Parameters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-holiday-calendar">
                      Holiday Calendar
                    </Label>
                    <Input
                      id="edit-holiday-calendar"
                      value={selectedCampaign.holiday_calendar_pc}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          holiday_calendar_pc: e.target.value,
                        })
                      }
                      placeholder='e.g. "server_side_US_federal"'
                    />
                  </div>

                  <div className="flex items-center space-x-3 mt-6">
                    <Checkbox
                      id="edit-weekend-adjustment"
                      checked={selectedCampaign.weekend_adjustment_pc}
                      onCheckedChange={(checked) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          weekend_adjustment_pc: checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="edit-weekend-adjustment"
                      className="text-sm"
                    >
                      Weekend Adjustment (Move to Monday)
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="edit-timezone-shared">
                      Timezone Shared
                    </Label>
                    <Input
                      id="edit-timezone-shared"
                      value={selectedCampaign.timezone_shared}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          timezone_shared: e.target.value,
                        })
                      }
                      placeholder="e.g. America/New_York"
                    />
                  </div>
                </div>
              </div>

              {/* Operational */}
              <div className="pt-4 border-t">
                <h3 className="text-base font-semibold mb-2">Operational</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 mt-2">
                    <Checkbox
                      id="edit-is-active"
                      checked={selectedCampaign.is_active}
                      onCheckedChange={(checked) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          is_active: checked,
                        })
                      }
                    />
                    <Label htmlFor="edit-is-active" className="text-sm">
                      Is Active
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="edit-start-call">Start Call Trigger</Label>
                    <Input
                      id="edit-start-call"
                      value={selectedCampaign.start_call}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          start_call: e.target.value,
                        })
                      }
                      placeholder="API trigger endpoint"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="edit-created-at">Created At</Label>
                    <Input
                      id="edit-created-at"
                      type="datetime-local"
                      value={selectedCampaign.created_at}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          created_at: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-updated-at">Updated At</Label>
                    <Input
                      id="edit-updated-at"
                      type="datetime-local"
                      value={selectedCampaign.updated_at}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          updated_at: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Lead Selection for editing */}
              <div className="pt-4 border-t">
                <Label className="text-base font-medium">
                  Update Leads (Optional)
                </Label>
                <p className="text-sm text-gray-500 mb-4">
                  Add or remove leads from this campaign
                </p>

                {leads.length > 0 ? (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <Checkbox
                          id={`edit-lead-${lead.id}`}
                          data-testid={`edit-lead-checkbox-${lead.id}`}
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) =>
                            handleLeadSelection(lead.id, checked)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {lead.email} • {lead.phone}
                          </p>
                        </div>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No leads available.
                  </p>
                )}

                <p className="text-sm text-indigo-600 mt-2">
                  {selectedLeads.length > 0
                    ? `${selectedLeads.length} lead(s) selected`
                    : "No leads selected"}
                </p>
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
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">
                  {selectedCampaign.campaign_name || selectedCampaign.name}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {selectedCampaign.description || "No description"}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This will delete {selectedCampaign.total_leads} leads from the
                  campaign and all associated call logs.
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
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default CampaignManagement;
