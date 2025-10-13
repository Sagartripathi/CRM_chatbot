import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import Layout from './Layout';
import { 
  Users, 
  Target, 
  Phone, 
  TrendingUp, 
  Plus
} from 'lucide-react';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCampaigns: 0,
    totalCalls: 0,
    conversionRate: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  // Sidebar state managed by Layout component

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const campaignsResponse = await axios.get('/campaigns');
      const campaigns = campaignsResponse.data;
      
      // Fetch leads
      const leadsResponse = await axios.get('/leads');
      const leads = leadsResponse.data;
      
      // Calculate stats
      const activeCampaigns = campaigns.filter(c => c.is_active).length;
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.status === 'converted').length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : 0;
      
      setStats({
        totalLeads,
        activeCampaigns,
        totalCalls: 0, // TODO: Calculate from call logs
        conversionRate: parseFloat(conversionRate)
      });
      
      setRecentCampaigns(campaigns.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const StatCard = ({ icon: Icon, title, value, description, color = "indigo", onClick, clickable = false }) => (
    <Card 
      className={`card-hover ${clickable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group' : ''}`}
      onClick={clickable ? onClick : undefined}
      data-testid={clickable ? `dashboard-stat-${title.toLowerCase().replace(' ', '-')}` : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium text-gray-600 ${clickable ? 'group-hover:text-blue-700' : ''}`}>
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600 ${clickable ? 'group-hover:text-blue-700' : ''}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold text-${color}-600 ${clickable ? 'group-hover:text-blue-700' : ''}`}>
          {value}
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${clickable ? 'group-hover:text-blue-600' : ''}`}>
          {description}
          {clickable && <span className="block text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1">Click to view →</span>}
        </p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const headerActions = (user?.role === 'admin' || user?.role === 'agent') ? (
    <Button
      onClick={() => navigate('/campaigns')}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 btn-hover"
    >
      <Plus className="mr-2 h-4 w-4" />
      New Campaign
    </Button>
  ) : null;

  return (
    <Layout title="Dashboard" headerActions={headerActions}>
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.first_name}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your {user?.role === 'admin' ? 'organization' : 'account'} today.
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              title="Total Leads"
              value={stats.totalLeads}
              description="All leads in your system"
              color="blue"
              clickable={true}
              onClick={() => navigate('/leads')}
            />
            <StatCard
              icon={Target}
              title="Active Campaigns"
              value={stats.activeCampaigns}
              description="Currently running campaigns"
              color="green"
              clickable={true}
              onClick={() => navigate('/campaigns')}
            />
            <StatCard
              icon={Phone}
              title="Total Calls"
              value={stats.totalCalls}
              description="Calls made this month"
              color="orange"
            />
            <StatCard
              icon={TrendingUp}
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              description="Leads converted to customers"
              color="purple"
            />
          </div>
          
          {/* Recent Campaigns */}
          {recentCampaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Campaigns
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/campaigns')}
                  >
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>
                  Your latest campaign activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCampaigns.map((campaign) => (
                    <div 
                      key={campaign.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      data-testid={`dashboard-campaign-${campaign.id}`}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{campaign.name}</h3>
                        <p className="text-sm text-gray-500">{campaign.description || 'No description'}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-xs text-gray-500">
                            {campaign.total_leads} leads
                          </span>
                          <span className="text-xs text-gray-500">
                            {campaign.completed_leads} completed
                          </span>
                          <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to view details →
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={campaign.is_active ? "default" : "secondary"}>
                          {campaign.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user?.role === 'agent' && campaign.is_active && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              navigate(`/campaigns/${campaign.id}/call`);
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          >
                            Start Calling
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Empty State */}
          {recentCampaigns.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-500 mb-6">
                  {user?.role === 'admin' || user?.role === 'agent'
                    ? 'Create your first campaign to start managing leads and making calls.'
                    : 'No campaigns have been created yet. Contact your administrator.'}
                </p>
                {(user?.role === 'admin' || user?.role === 'agent') && (
                  <Button
                    onClick={() => navigate('/campaigns')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
    </Layout>
  );
}

export default Dashboard;
