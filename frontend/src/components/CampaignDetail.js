import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import Layout from './Layout';
import { 
  ArrowLeft, 
  Play, 
  Users, 
  Target, 
  TrendingUp,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [campaignLeads, setCampaignLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const [campaignResponse, statsResponse] = await Promise.all([
        axios.get(`/campaigns`),
        axios.get(`/campaigns/${campaignId}/stats`)
      ]);
      
      const campaignData = campaignResponse.data.find(c => c.id === campaignId);
      if (!campaignData) {
        throw new Error('Campaign not found');
      }
      
      setCampaign(campaignData);
      setCampaignStats(statsResponse.data);
      
      // Fetch campaign leads (would need new endpoint, for now using leads)
      const leadsResponse = await axios.get('/leads');
      setCampaignLeads(leadsResponse.data.slice(0, 5)); // Mock: first 5 leads
      
    } catch (error) {
      toast.error('Failed to load campaign details');
      console.error('Fetch error:', error);
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = () => {
    navigate(`/campaigns/${campaignId}/call`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800', 
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <Layout title="Campaign Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Campaign not found</h3>
              <p className="text-gray-500 mb-6">The campaign you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/campaigns')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/campaigns')}
        className="btn-hover"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <Badge variant={campaign.is_active ? "default" : "secondary"}>
        {campaign.is_active ? 'Active' : 'Inactive'}
      </Badge>
      
      {user?.role === 'agent' && campaign.is_active && (
        <Button
          onClick={handleStartCampaign}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 btn-hover"
          data-testid="start-calling-btn"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Calling
        </Button>
      )}
      
      <Button
        variant="outline"
        onClick={() => navigate(`/campaigns`)}
      >
        <Edit className="mr-2 h-4 w-4" />
        Edit Campaign
      </Button>
    </div>
  );

  return (
    <Layout title={campaign.name} subtitle="Campaign Details" headerActions={headerActions}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Overview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
                <CardDescription>Overview and description</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {campaign.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{new Date(campaign.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Campaign Leads
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/leads')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View All Leads
                  </Button>
                </CardTitle>
                <CardDescription>Leads assigned to this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaignLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {lead.email} • {lead.phone || 'No phone'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(lead.status)}
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {campaignLeads.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No leads assigned to this campaign yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Statistics</CardTitle>
                <CardDescription>Performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {campaignStats ? (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{campaignStats.total_leads}</p>
                        <p className="text-xs text-blue-600">Total Leads</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{campaignStats.completed_leads}</p>
                        <p className="text-xs text-green-600">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{campaignStats.in_progress_leads}</p>
                        <p className="text-xs text-yellow-600">In Progress</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{campaignStats.failed_leads}</p>
                        <p className="text-xs text-red-600">Failed</p>
                      </div>
                    </div>
                    
                    {/* Conversion Rate */}
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">
                        {campaignStats.conversion_rate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-purple-600">Conversion Rate</p>
                    </div>
                    
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{campaignStats.conversion_rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${campaignStats.conversion_rate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Call Outcomes */}
                    {Object.keys(campaignStats.call_outcomes).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Call Outcomes</h4>
                        <div className="space-y-2">
                          {Object.entries(campaignStats.call_outcomes).map(([outcome, count]) => (
                            <div key={outcome} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm capitalize">{outcome.replace('_', ' ')}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user?.role === 'agent' && campaign.is_active && (
                  <Button
                    onClick={handleStartCampaign}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Calling
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/campaigns')}
                  className="w-full"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Campaign
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/leads')}
                  className="w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Leads
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    </Layout>
  );
}

export default CampaignDetail;