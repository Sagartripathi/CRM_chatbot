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
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import Layout from "./Layout";
import {
  Users,
  Target,
  Phone,
  TrendingUp,
  Calendar,
  Clock,
  Activity,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { Campaign, Lead } from "../../types/api";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format, startOfDay, endOfDay, subDays, isSameDay } from "date-fns";

interface DashboardStats {
  totalLeads: number;
  activeCampaigns: number;
  totalCalls: number;
  conversionRate: number;
  activeMeetings: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
}

interface CallStatistics {
  total_calls: number;
  calls_by_outcome: Record<string, number>;
  calls_by_date: Record<string, number>;
}

function Dashboard(): React.ReactElement {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeCampaigns: 0,
    totalCalls: 0,
    conversionRate: 0,
    activeMeetings: 0,
    callsToday: 0,
    callsThisWeek: 0,
    callsThisMonth: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [activeMeetingsList, setActiveMeetingsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [callDateFilter, setCallDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [campaignDateFilter, setCampaignDateFilter] = useState<
    Date | undefined
  >(undefined);
  const [leadDateFilter, setLeadDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [callStats, setCallStats] = useState<CallStatistics>({
    total_calls: 0,
    calls_by_outcome: {},
    calls_by_date: {},
  });

  useEffect(() => {
    if (user && !authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading, callDateFilter, campaignDateFilter, leadDateFilter]);

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);

      if (!user) {
        return;
      }

      // Fetch all data in parallel
      const [campaignsResponse, leadsResponse, meetingsResponse] =
        await Promise.all([
          apiClient.get<Campaign[]>("/campaigns"),
          apiClient.get<Lead[]>("/leads"),
          apiClient.get<any[]>("/meetings"),
        ]);

      const campaigns = campaignsResponse.data || [];
      const leads = leadsResponse.data || [];
      const meetings = meetingsResponse.data || [];

      // Filter by date if filter is set
      let filteredCampaigns = campaigns;
      if (campaignDateFilter) {
        filteredCampaigns = campaigns.filter((c) => {
          const createdDateStr = c.created_at;
          if (!createdDateStr) return false;
          try {
            const createdDate = new Date(createdDateStr);
            return isSameDay(createdDate, campaignDateFilter);
          } catch {
            return false;
          }
        });
      }

      let filteredLeads = leads;
      if (leadDateFilter) {
        filteredLeads = leads.filter((l) => {
          const createdDate = new Date(l.created_at || "");
          return isSameDay(createdDate, leadDateFilter);
        });
      }

      // Calculate active meetings (upcoming meetings)
      const now = new Date();
      const activeMeetings = meetings.filter((m) => {
        try {
          const startTime =
            m.start_time ||
            m.start?.dateTime ||
            m.start?.date ||
            m.start_time;
          if (!startTime) return false;
          const meetingStart = new Date(startTime);
          if (isNaN(meetingStart.getTime())) return false;
          return meetingStart >= now;
        } catch {
          return false;
        }
      });

      // Calculate stats
      const activeCampaignsCount = filteredCampaigns.filter(
        (c) => c.is_active
      ).length;
      const totalLeadsCount = filteredLeads.length;
      const convertedLeads = filteredLeads.filter(
        (l) => l.status === "converted"
      ).length;
      const conversionRate =
        totalLeadsCount > 0
          ? (convertedLeads / totalLeadsCount) * 100
          : 0;

      // Fetch call statistics
      let callStatistics: CallStatistics = {
        total_calls: 0,
        calls_by_outcome: {},
        calls_by_date: {},
      };

      try {
        const today = new Date();
        const startDate = callDateFilter
          ? startOfDay(callDateFilter)
          : startOfDay(subDays(today, 30)); // Last 30 days by default
        const endDate = callDateFilter
          ? endOfDay(callDateFilter)
          : endOfDay(today);

        const callsResponse = await apiClient.get<CallStatistics>(
          `/campaigns/calls/statistics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
        );
        callStatistics = callsResponse.data || callStatistics;
      } catch (error: any) {
        // Silently fail if call statistics endpoint doesn't exist or fails
        // This is expected if the endpoint hasn't been deployed yet
        callStatistics = {
          total_calls: 0,
          calls_by_outcome: {},
          calls_by_date: {},
        };
      }

      // Calculate calls for different periods
      const today = format(new Date(), "yyyy-MM-dd");
      const callsToday = callStatistics.calls_by_date[today] || 0;

      const weekStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const callsThisWeek = Object.entries(callStatistics.calls_by_date)
        .filter(([date]) => date >= weekStart)
        .reduce((sum, [, count]) => sum + count, 0);

      const monthStart = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const callsThisMonth = Object.entries(callStatistics.calls_by_date)
        .filter(([date]) => date >= monthStart)
        .reduce((sum, [, count]) => sum + count, 0);

      setStats({
        totalLeads: totalLeadsCount,
        activeCampaigns: activeCampaignsCount,
        totalCalls: callStatistics.total_calls,
        conversionRate,
        activeMeetings: activeMeetings.length,
        callsToday,
        callsThisWeek,
        callsThisMonth,
      });

      setCallStats(callStatistics);
      setRecentCampaigns(filteredCampaigns.slice(0, 5));
      setActiveMeetingsList(activeMeetings.slice(0, 5));
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to access dashboard data");
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Attractive Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
                  <h1 className="text-4xl md:text-5xl font-bold">
                    {getGreeting()}, {user?.first_name || "User"}! 👋
                  </h1>
                </div>
                <p className="text-xl md:text-2xl text-indigo-100 font-medium">
                  Here's your CRM performance overview
                </p>
                <p className="text-indigo-200 mt-2">
                  {user?.role === "client" && user?.client_id
                    ? `Client ID: ${user.client_id}`
                    : "Track your campaigns, leads, and meetings"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold">{stats.activeCampaigns}</div>
                  <div className="text-sm text-indigo-100">Active</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold">{stats.activeMeetings}</div>
                  <div className="text-sm text-indigo-100">Meetings</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads Card */}
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-indigo-300 transition-all shadow-lg hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-3xl opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Total Leads
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {stats.totalLeads}
              </div>
              <p className="text-xs text-gray-600 font-medium">
                All time leads in system
              </p>
              {leadDateFilter && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Filtered by date
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Active Campaigns Card */}
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-300 transition-all shadow-lg hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full blur-3xl opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Active Campaigns
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {stats.activeCampaigns}
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Currently running campaigns
              </p>
              {campaignDateFilter && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Filtered by date
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Total Calls Card */}
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-green-300 transition-all shadow-lg hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-3xl opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Total Calls
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Phone className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {stats.totalCalls}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1 text-green-600">
                  <Clock className="h-3 w-3" />
                  <span className="font-semibold">{stats.callsToday} today</span>
                </div>
                <div className="text-gray-500">
                  {stats.callsThisWeek} this week
                </div>
              </div>
              {callDateFilter && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Filtered by date
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rate Card */}
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-orange-300 transition-all shadow-lg hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-red-600 rounded-full blur-3xl opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Conversion Rate
              </CardTitle>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {stats.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Leads converted successfully
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Meetings Card */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Active Meetings
                </CardTitle>
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.activeMeetings}
              </div>
              <p className="text-xs text-gray-600">Upcoming scheduled</p>
            </CardContent>
          </Card>

          {/* Calls This Week */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Calls This Week
                </CardTitle>
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.callsThisWeek}
              </div>
              <p className="text-xs text-gray-600">Last 7 days</p>
            </CardContent>
          </Card>

          {/* Calls This Month */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Calls This Month
                </CardTitle>
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.callsThisMonth}
              </div>
              <p className="text-xs text-gray-600">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Filters Section */}
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-lg font-bold text-gray-900">
              Date Filters
            </CardTitle>
            <CardDescription>
              Filter campaigns, leads, and calls by date
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Campaign Date Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Filter Campaigns by Date
                </label>
                <CalendarComponent
                  mode="single"
                  selected={campaignDateFilter}
                  onSelect={setCampaignDateFilter}
                  className="rounded-md border"
                  classNames={{}}
                />
                {campaignDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCampaignDateFilter(undefined)}
                    className="mt-2 text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>

              {/* Lead Date Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Filter Leads by Date
                </label>
                <CalendarComponent
                  mode="single"
                  selected={leadDateFilter}
                  onSelect={setLeadDateFilter}
                  className="rounded-md border"
                  classNames={{}}
                />
                {leadDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeadDateFilter(undefined)}
                    className="mt-2 text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>

              {/* Call Date Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Filter Calls by Date
                </label>
                <CalendarComponent
                  mode="single"
                  selected={callDateFilter}
                  onSelect={setCallDateFilter}
                  className="rounded-md border"
                  classNames={{}}
                />
                {callDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCallDateFilter(undefined)}
                    className="mt-2 text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Statistics Breakdown */}
        {Object.keys(callStats.calls_by_outcome).length > 0 && (
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="text-lg font-bold text-gray-900">
                Call Outcomes Breakdown
              </CardTitle>
              <CardDescription>
                Distribution of calls by outcome
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(callStats.calls_by_outcome).map(
                  ([outcome, count]) => (
                    <div
                      key={outcome}
                      className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                    >
                      <div className="text-2xl font-bold text-gray-900">
                        {count}
                      </div>
                      <div className="text-sm text-gray-600 capitalize mt-1">
                        {outcome.replace("_", " ")}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Campaigns & Meetings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Campaigns */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Active Campaigns
                  </CardTitle>
                  <CardDescription>
                    Your currently running campaigns
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/campaigns")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {recentCampaigns.filter((c) => c.is_active).length > 0 ? (
                <div className="space-y-4">
                  {recentCampaigns
                    .filter((c) => c.is_active)
                    .slice(0, 5)
                    .map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {campaign.campaign_name || campaign.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {campaign.campaign_description ||
                              campaign.description ||
                              "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700 border-purple-300"
                            >
                              ID: {campaign.campaign_id}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                            >
                              {campaign.total_leads} leads
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-300"
                            >
                              {campaign.completed_leads} completed
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/campaigns/${campaign.id}`)
                          }
                          className="ml-4"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No active campaigns
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start a campaign to begin reaching out to leads
                  </p>
                  <Button onClick={() => navigate("/campaigns")}>
                    View Campaigns
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Upcoming Meetings
                  </CardTitle>
                  <CardDescription>
                    Your next scheduled meetings
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/meetings")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {activeMeetingsList.length > 0 ? (
                <div className="space-y-4">
                  {activeMeetingsList.slice(0, 5).map((meeting) => {
                    let meetingDate: Date | null = null;
                    let meetingEnd: Date | null = null;
                    
                    try {
                      const startTime =
                        meeting.start_time ||
                        meeting.start?.dateTime ||
                        meeting.start?.date;
                      if (startTime) {
                        meetingDate = new Date(startTime);
                        if (isNaN(meetingDate.getTime())) {
                          meetingDate = null;
                        }
                      }
                      
                      const endTime =
                        meeting.end_time ||
                        meeting.end?.dateTime ||
                        meeting.end?.date;
                      if (endTime) {
                        meetingEnd = new Date(endTime);
                        if (isNaN(meetingEnd.getTime())) {
                          meetingEnd = null;
                        }
                      }
                    } catch (error) {
                      // Handle date parsing errors silently
                    }

                    return (
                      <div
                        key={meeting.id || Math.random()}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-indigo-50 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {meeting.title ||
                              `Meeting with ${meeting.lead_name || "Lead"}`}
                          </h3>
                          {meetingDate && !isNaN(meetingDate.getTime()) && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(meetingDate, "MMM d, yyyy")}
                              </span>
                              <Clock className="h-4 w-4 ml-2" />
                              <span>
                                {meetingEnd && !isNaN(meetingEnd.getTime())
                                  ? `${format(meetingDate, "h:mm a")} - ${format(
                                      meetingEnd,
                                      "h:mm a"
                                    )}`
                                  : format(meetingDate, "h:mm a")}
                              </span>
                            </div>
                          )}
                          {meeting.lead_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              👤 {meeting.lead_name}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/meetings")}
                          className="ml-4"
                        >
                          View
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No upcoming meetings
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Schedule a meeting to stay organized
                  </p>
                  <Button onClick={() => navigate("/meetings")}>
                    View Meetings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns (All) */}
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Recent Campaigns
                </CardTitle>
                <CardDescription>
                  Your latest campaign activities
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/campaigns")}
              >
                View All Campaigns
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {recentCampaigns.length > 0 ? (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {campaign.campaign_name || campaign.name}
                        </h3>
                        <Badge
                          variant={campaign.is_active ? "default" : "secondary"}
                          className={
                            campaign.is_active
                              ? "bg-green-100 text-green-800 border-green-300"
                              : ""
                          }
                        >
                          {campaign.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {campaign.campaign_description ||
                          campaign.description ||
                          "No description"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          ID: {campaign.campaign_id}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.total_leads} leads
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.completed_leads} completed
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No campaigns yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first campaign to get started
                </p>
                <Button onClick={() => navigate("/campaigns")}>
                  View Campaigns
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Dashboard;
