import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  FileText,
  Edit,
  Trash2,
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
  const leadsPerPage = 20;

  // Sidebar managed by Layout component
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [newLead, setNewLead] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    source: "",
    notes: "",
    status: "new",
    campaign_id: "",
  });

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
          `${lead.first_name} ${lead.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone?.includes(searchTerm)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
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
        console.log("User not authenticated, skipping leads data fetch");
        return;
      }

      const tokenHeader = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const [leadsResponse, campaignsResponse] = await Promise.all([
        axios.get("/leads", tokenHeader),
        axios.get("/campaigns", tokenHeader),
      ]);
      setLeads(leadsResponse.data);
      setFilteredLeads(leadsResponse.data);
      setCampaigns(campaignsResponse.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Authentication error - user may need to log in");
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

    if (!newLead.first_name.trim() || !newLead.last_name.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    try {
      await axios.post("/leads", newLead);
      toast.success("Lead created successfully!");
      setCreateDialogOpen(false);
      setNewLead({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        source: "",
        notes: "",
        status: "new",
        campaign_id: "",
      });
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create lead");
    }
  };

  const handleEditLead = async (e) => {
    e.preventDefault();

    if (!selectedLead.first_name.trim() || !selectedLead.last_name.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    try {
      await axios.put(`/leads/${selectedLead.id}`, selectedLead);
      toast.success("Lead updated successfully!");
      setEditDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update lead");
    }
  };

  const handleDeleteLead = async () => {
    try {
      await axios.delete(`/leads/${selectedLead.id}`);
      toast.success("Lead deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete lead");
    }
  };

  const handleUploadCSV = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.error("Please select a CSV file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);

      const url = uploadCampaignId
        ? `/leads/upload-csv?campaign_id=${uploadCampaignId}`
        : "/leads/upload-csv";

      const response = await axios.post(url, formData, {
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
      await axios.patch(
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
      contacted: "bg-yellow-100 text-yellow-800",
      converted: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
      no_response: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.new;
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

  const headerTitle = `Leads (${filteredLeads.length} of ${leads.length})`;

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead to your database
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first-name">First Name *</Label>
                <Input
                  id="first-name"
                  data-testid="lead-firstname-input"
                  value={newLead.first_name}
                  onChange={(e) =>
                    setNewLead({ ...newLead, first_name: e.target.value })
                  }
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name *</Label>
                <Input
                  id="last-name"
                  data-testid="lead-lastname-input"
                  value={newLead.last_name}
                  onChange={(e) =>
                    setNewLead({ ...newLead, last_name: e.target.value })
                  }
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="lead-email-input"
                type="email"
                value={newLead.email}
                onChange={(e) =>
                  setNewLead({ ...newLead, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                data-testid="lead-phone-input"
                value={newLead.phone}
                onChange={(e) =>
                  setNewLead({ ...newLead, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                data-testid="lead-source-input"
                value={newLead.source}
                onChange={(e) =>
                  setNewLead({ ...newLead, source: e.target.value })
                }
                placeholder="Website, Referral, etc."
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                data-testid="lead-notes-input"
                value={newLead.notes}
                onChange={(e) =>
                  setNewLead({ ...newLead, notes: e.target.value })
                }
                placeholder="Add any relevant notes..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="campaign">Campaign (Optional)</Label>
              <Select
                value={newLead.campaign_id || "none"}
                onValueChange={(value) =>
                  setNewLead({
                    ...newLead,
                    campaign_id: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger data-testid="lead-campaign-select">
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
                  setCreateDialogOpen(false);
                  setNewLead({
                    first_name: "",
                    last_name: "",
                    phone: "",
                    email: "",
                    source: "",
                    notes: "",
                    status: "new",
                    campaign_id: "",
                  });
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
              placeholder="Search leads by name, email, or phone..."
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
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
              {getUniqueValues("source").map((source) => (
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50"
                    data-testid={`lead-row-${lead.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        {lead.notes && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {lead.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-xs">
                              {lead.email}
                            </span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openCampaignDialog(lead)}
                        className="text-sm text-indigo-600 hover:text-indigo-900 underline"
                      >
                        {getCampaignName(lead.campaign_id)}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={`${getStatusColor(lead.status)} capitalize`}
                      >
                        {lead.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.source || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(lead)}
                          data-testid={`edit-lead-btn-${lead.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(lead)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={handleEditLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-first-name">First Name *</Label>
                  <Input
                    id="edit-first-name"
                    data-testid="edit-lead-firstname-input"
                    value={selectedLead.first_name}
                    onChange={(e) =>
                      setSelectedLead({
                        ...selectedLead,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-last-name">Last Name *</Label>
                  <Input
                    id="edit-last-name"
                    data-testid="edit-lead-lastname-input"
                    value={selectedLead.last_name}
                    onChange={(e) =>
                      setSelectedLead({
                        ...selectedLead,
                        last_name: e.target.value,
                      })
                    }
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  data-testid="edit-lead-email-input"
                  type="email"
                  value={selectedLead.email || ""}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  data-testid="edit-lead-phone-input"
                  value={selectedLead.phone || ""}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, phone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="edit-source">Source</Label>
                <Input
                  id="edit-source"
                  data-testid="edit-lead-source-input"
                  value={selectedLead.source || ""}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, source: e.target.value })
                  }
                  placeholder="Website, Referral, etc."
                />
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  data-testid="edit-lead-notes-input"
                  value={selectedLead.notes || ""}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, notes: e.target.value })
                  }
                  placeholder="Add any relevant notes..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-campaign">Campaign</Label>
                <Select
                  value={selectedLead.campaign_id || "none"}
                  onValueChange={(value) =>
                    setSelectedLead({
                      ...selectedLead,
                      campaign_id: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger data-testid="edit-lead-campaign-select">
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
                  {selectedLead.first_name} {selectedLead.last_name}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {selectedLead.email || "No email"} •{" "}
                  {selectedLead.phone || "No phone"}
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
              Upload a CSV file with leads. Required columns: first_name,
              last_name, email, phone, status
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
                Format: first_name, last_name, email, phone, status
              </p>
            </div>

            <div>
              <Label htmlFor="upload-campaign">
                Assign to Campaign (Optional)
              </Label>
              <Select
                value={uploadCampaignId || "none"}
                onValueChange={(value) =>
                  setUploadCampaignId(value === "none" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No campaign (add later)" />
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
