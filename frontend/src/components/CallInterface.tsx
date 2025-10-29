import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, apiClient } from "../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
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
  Phone,
  PhoneOff,
  User,
  Mail,
  MapPin,
  FileText,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

function CallInterface() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentLead, setCurrentLead] = useState(null);
  const [campaignLead, setCampaignLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callOutcome, setCallOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== "agent") {
      navigate("/dashboard");
      return;
    }
    fetchNextLead();
  }, [campaignId, user, navigate]);

  const fetchNextLead = async () => {
    try {
      setLoading(true);

      if (!user) {
        navigate("/login");
        return;
      }

      const response = await apiClient.post(`/campaigns/${campaignId}/start`);

      setCurrentLead(response.data.lead);
      setCampaignLead(response.data.campaign_lead);
      setCallOutcome("");
      setCallNotes("");
      setCallActive(false);
      setCallStartTime(null);

      toast.success(response.data.message);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to access call interface");
        navigate("/login");
      } else if (error.response?.status === 404) {
        toast.info("No more leads available in this campaign");
        navigate("/campaigns");
      } else {
        toast.error(error.response?.data?.detail || "Failed to get next lead");
      }
    } finally {
      setLoading(false);
    }
  };

  const startCall = () => {
    setCallActive(true);
    setCallStartTime(new Date());
    toast.success("Call started - Good luck!");
  };

  const endCall = () => {
    setCallActive(false);
    // Keep the start time to calculate duration
  };

  const submitCallLog = async (e) => {
    e.preventDefault();

    if (!callOutcome) {
      toast.error("Please select a call outcome");
      return;
    }

    if (!callStartTime) {
      toast.error("Please start a call first");
      return;
    }

    try {
      setSubmitting(true);

      const callDuration = callStartTime
        ? Math.round((new Date().getTime() - callStartTime.getTime()) / 1000)
        : null;

      await apiClient.post("/calls", {
        campaign_lead_id: campaignLead.id,
        outcome: callOutcome,
        duration_seconds: callDuration,
        notes: callNotes,
      });

      toast.success("Call logged successfully!");

      // Check if this was the last attempt or if call was successful
      if (callOutcome === "answered" || campaignLead.attempts_made >= 2) {
        toast.info("Moving to next lead...");
        setTimeout(() => {
          fetchNextLead();
        }, 1500);
      } else {
        toast.info("Lead will be scheduled for next attempt");
        setTimeout(() => {
          fetchNextLead();
        }, 1500);
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to log call");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.detail || "Failed to log call");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getOutcomeColor = (outcome) => {
    const colors = {
      answered: "bg-green-100 text-green-800",
      no_answer: "bg-yellow-100 text-yellow-800",
      busy: "bg-orange-100 text-orange-800",
      voicemail: "bg-blue-100 text-blue-800",
    };
    return colors[outcome] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <Phone className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentLead || !campaignLead) {
    return (
      <Layout title="Call Interface">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <Phone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No leads available
              </h3>
              <p className="text-gray-500 mb-6">
                There are no more leads to call in this campaign.
              </p>
              <Button
                onClick={() => navigate("/campaigns")}
                className="btn-hover"
              >
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
        onClick={() => navigate("/campaigns")}
        className="btn-hover"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Button
        onClick={fetchNextLead}
        variant="outline"
        size="sm"
        disabled={loading}
        className="btn-hover"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Next Lead
      </Button>
    </div>
  );

  return (
    <Layout
      title="Call Interface"
      subtitle="Campaign: Active Campaign"
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-2">
          <Card data-testid="lead-info-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>
                    {currentLead.first_name} {currentLead.last_name}
                  </span>
                </CardTitle>
                <Badge className="capitalize">
                  {currentLead.status.replace("_", " ")}
                </Badge>
              </div>
              <CardDescription>
                Lead information and call history
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium" data-testid="lead-phone">
                      {currentLead.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium" data-testid="lead-email">
                      {currentLead.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Source</p>
                    <p className="font-medium">
                      {currentLead.source || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Attempts</p>
                    <p className="font-medium">
                      {campaignLead.attempts_made} / {campaignLead.max_attempts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Notes */}
              {currentLead.notes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Lead Notes</h4>
                  <p className="text-blue-800 text-sm">{currentLead.notes}</p>
                </div>
              )}

              {/* Campaign Lead Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(campaignLead.status)}
                  <div>
                    <p className="font-medium">Campaign Status</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {campaignLead.status.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {campaignLead.last_call_outcome && (
                  <Badge
                    className={getOutcomeColor(campaignLead.last_call_outcome)}
                  >
                    Last: {campaignLead.last_call_outcome.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call Controls */}
        <div>
          <Card data-testid="call-controls-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Call Controls</span>
              </CardTitle>
              <CardDescription>
                Make the call and log the outcome
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Call Status */}
              <div className="text-center">
                {callActive ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Phone className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-green-600 font-medium">
                      Call in progress
                    </p>
                    <p className="text-sm text-gray-500">
                      Started: {callStartTime?.toLocaleTimeString()}
                    </p>
                    <Button
                      onClick={endCall}
                      data-testid="end-call-btn"
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <PhoneOff className="mr-2 h-4 w-4" />
                      End Call
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                      <Phone className="h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Ready to call</p>
                    <Button
                      onClick={startCall}
                      data-testid="start-call-btn"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Start Call
                    </Button>
                  </div>
                )}
              </div>

              {/* Call Outcome Form */}
              <form onSubmit={submitCallLog} className="space-y-4">
                <div>
                  <Label htmlFor="call-outcome">Call Outcome</Label>
                  <Select value={callOutcome} onValueChange={setCallOutcome}>
                    <SelectTrigger data-testid="call-outcome-select">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="no_answer">No Answer</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="voicemail">Voicemail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="call-notes">Call Notes (Optional)</Label>
                  <Textarea
                    id="call-notes"
                    data-testid="call-notes-input"
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Add notes about this call..."
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  data-testid="submit-call-log-btn"
                  disabled={submitting || !callOutcome || !callStartTime}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {submitting ? "Logging..." : "Log Call & Continue"}
                </Button>
              </form>

              {/* Call Timer */}
              {callStartTime && (
                <div className="text-center text-sm text-gray-500 pt-4 border-t">
                  Call duration:{" "}
                  {callStartTime
                    ? Math.round(
                        (new Date().getTime() - callStartTime.getTime()) / 1000
                      )
                    : 0}
                  s
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default CallInterface;
