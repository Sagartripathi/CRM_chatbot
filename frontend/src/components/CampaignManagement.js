import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import Layout from './Layout';
import { 
  Target, 
  Plus, 
  Play, 
  Users, 
  TrendingUp, 
  Phone,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

function CampaignManagement() {
  const { user, logout } = useAuth();
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
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    lead_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsResponse, leadsResponse] = await Promise.all([
        axios.get('/campaigns'),
        axios.get('/leads')
      ]);
      
      setCampaigns(campaignsResponse.data);
      setLeads(leadsResponse.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    if (!newCampaign.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    
    // Lead selection is optional - campaigns can be created empty
    
    try {
      await axios.post('/campaigns', {
        ...newCampaign,
        lead_ids: selectedLeads
      });
      
      toast.success('Campaign created successfully!');
      setCreateDialogOpen(false);
      setNewCampaign({ name: '', description: '', lead_ids: [] });
      setSelectedLeads([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create campaign');
    }
  };

  const handleStartCampaign = (campaignId) => {
    navigate(`/campaigns/${campaignId}/call`);
  };

  const handleViewStats = async (campaign) => {
    try {
      const response = await axios.get(`/campaigns/${campaign.id}/stats`);
      setSelectedCampaignStats(response.data);
      setStatsDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load campaign stats');
    }
  };

  const handleLeadSelection = (leadId, checked) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleEditCampaign = async (e) => {
    e.preventDefault();
    
    if (!selectedCampaign.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    
    try {
      await axios.put(`/campaigns/${selectedCampaign.id}`, {
        name: selectedCampaign.name,
        description: selectedCampaign.description,
        lead_ids: selectedLeads
      });
      
      toast.success('Campaign updated successfully!');
      setEditDialogOpen(false);
      setSelectedCampaign(null);
      setSelectedLeads([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async () => {
    try {
      await axios.delete(`/campaigns/${selectedCampaign.id}`);
      toast.success('Campaign deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedCampaign(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete campaign');
    }
  };

  const openEditDialog = (campaign) => {
    setSelectedCampaign({ ...campaign });
    // TODO: Load campaign leads for editing
    setSelectedLeads([]);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (campaign) => {
    setSelectedCampaign(campaign);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      no_response: 'bg-gray-100 text-gray-800'
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
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        data-testid="campaign-name-input"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                        placeholder="Enter campaign name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaign-description">Description (Optional)</Label>
                      <Textarea
                        id="campaign-description"
                        data-testid="campaign-description-input"
                        value={newCampaign.description}
                        onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                        placeholder="Describe this campaign"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Lead Selection */}
                  <div>
                    <Label className="text-base font-medium">Select Leads (Optional)</Label>
                    <p className="text-sm text-gray-500 mb-4">Choose leads to include in this campaign or create an empty campaign</p>
                    
                    {leads.length > 0 ? (
                      <div className="border rounded-lg max-h-60 overflow-y-auto">
                        {leads.map((lead) => (
                          <div key={lead.id} className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50">
                            <Checkbox
                              id={`lead-${lead.id}`}
                              data-testid={`lead-checkbox-${lead.id}`}
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={(checked) => handleLeadSelection(lead.id, checked)}
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
                              {lead.status.replace('_', ' ')}
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
                        : 'No leads selected - campaign will be created empty'}
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCreateDialogOpen(false);
                        setSelectedLeads([]);
                        setNewCampaign({ name: '', description: '', lead_ids: [] });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      data-testid="create-campaign-submit-btn"
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
                <Card key={campaign.id} className="card-hover" data-testid={`campaign-card-${campaign.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{campaign.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {campaign.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge variant={campaign.is_active ? "default" : "secondary"}>
                        {campaign.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-600">{campaign.total_leads}</p>
                          <p className="text-xs text-gray-500">Total Leads</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-600">{campaign.completed_leads}</p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {campaign.total_leads > 0 
                              ? Math.round((campaign.completed_leads / campaign.total_leads) * 100)
                              : 0
                            }%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="progress-bar h-2 rounded-full"
                            style={{
                              width: campaign.total_leads > 0 
                                ? `${(campaign.completed_leads / campaign.total_leads) * 100}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {user?.role === 'agent' && campaign.is_active && (
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
                          className={user?.role === 'agent' && campaign.is_active ? "flex-1" : "flex-1"}
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
                <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create your first campaign to start organizing leads and tracking call activities. 
                  Campaigns help you manage outreach efforts efficiently.
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
                  <p className="text-2xl font-bold text-blue-600">{selectedCampaignStats.total_leads}</p>
                  <p className="text-sm text-blue-600">Total Leads</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedCampaignStats.completed_leads}</p>
                  <p className="text-sm text-green-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{selectedCampaignStats.in_progress_leads}</p>
                  <p className="text-sm text-yellow-600">In Progress</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{selectedCampaignStats.failed_leads}</p>
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
                  <h4 className="font-medium text-gray-900 mb-3">Call Outcomes</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedCampaignStats.call_outcomes).map(([outcome, count]) => (
                      <div key={outcome} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="capitalize">{outcome.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
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
            <DialogDescription>
              Update campaign information
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <form onSubmit={handleEditCampaign} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-campaign-name">Campaign Name</Label>
                  <Input
                    id="edit-campaign-name"
                    data-testid="edit-campaign-name-input"
                    value={selectedCampaign.name}
                    onChange={(e) => setSelectedCampaign({...selectedCampaign, name: e.target.value})}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-campaign-description">Description (Optional)</Label>
                  <Textarea
                    id="edit-campaign-description"
                    data-testid="edit-campaign-description-input"
                    value={selectedCampaign.description || ''}
                    onChange={(e) => setSelectedCampaign({...selectedCampaign, description: e.target.value})}
                    placeholder="Describe this campaign"
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Lead Selection for editing */}
              <div>
                <Label className="text-base font-medium">Update Leads (Optional)</Label>
                <p className="text-sm text-gray-500 mb-4">Add or remove leads from this campaign</p>
                
                {leads.length > 0 ? (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {leads.map((lead) => (
                      <div key={lead.id} className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50">
                        <Checkbox
                          id={`edit-lead-${lead.id}`}
                          data-testid={`edit-lead-checkbox-${lead.id}`}
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleLeadSelection(lead.id, checked)}
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
                          {lead.status.replace('_', ' ')}
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
                    : 'No leads selected'}
                </p>
              </div>
              
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
              Are you sure you want to delete this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">
                  {selectedCampaign.name}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {selectedCampaign.description || 'No description'}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This will delete {selectedCampaign.total_leads} leads from the campaign and all associated call logs.
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
