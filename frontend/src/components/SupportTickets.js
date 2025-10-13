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
import { toast } from 'sonner';
import Layout from './Layout';
import { 
  Ticket,
  Plus, 
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';

function SupportTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    // Filter tickets
    let filtered = tickets;
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter && priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    setFilteredTickets(filtered);
  }, [tickets, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/tickets');
      setTickets(response.data);
      setFilteredTickets(response.data);
    } catch (error) {
      toast.error('Failed to load tickets');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    
    try {
      await axios.post('/tickets', newTicket);
      toast.success('Ticket created successfully!');
      setCreateDialogOpen(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium'
      });
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create ticket');
    }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      await axios.put(`/tickets/${ticketId}`, updates);
      toast.success('Ticket updated successfully!');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update ticket');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const headerTitle = `Support Tickets (${filteredTickets.length} of ${tickets.length})`;
  
  const headerActions = (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          data-testid="create-ticket-btn"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 btn-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Submit a new support request
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <Label htmlFor="ticket-title">Title *</Label>
            <Input
              id="ticket-title"
              data-testid="ticket-title-input"
              value={newTicket.title}
              onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
              placeholder="Brief description of the issue"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="ticket-priority">Priority</Label>
            <Select
              value={newTicket.priority}
              onValueChange={(value) => setNewTicket({...newTicket, priority: value})}
            >
              <SelectTrigger data-testid="ticket-priority-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="ticket-description">Description *</Label>
            <Textarea
              id="ticket-description"
              data-testid="ticket-description-input"
              value={newTicket.description}
              onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
              placeholder="Detailed description of the issue..."
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewTicket({
                  title: '',
                  description: '',
                  priority: 'medium'
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              data-testid="create-ticket-submit-btn"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <Layout title={headerTitle} headerActions={headerActions}>
      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="priority-filter">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Tickets Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="card-hover" data-testid={`ticket-card-${ticket.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{ticket.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Ticket #{ticket.id.slice(0, 8)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Description */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-3">{ticket.description}</p>
                  </div>
                  
                  {/* Creator Info */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Created by: {user?.role === 'admin' ? 'Client User' : 'You'}</span>
                  </div>
                  
                  {/* Actions for Admin/Agent */}
                  {(user?.role === 'admin' || user?.role === 'agent') && (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleUpdateTicket(ticket.id, { status: value })}
                        >
                          <SelectTrigger className="flex-1" data-testid={`ticket-status-${ticket.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {ticket.status === 'open' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTicket(ticket.id, { 
                            status: 'in_progress', 
                            assigned_to: user.id 
                          })}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid={`assign-ticket-${ticket.id}`}
                        >
                          Assign to Me
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    Created {new Date(ticket.created_at).toLocaleDateString()}
                    {ticket.resolved_at && (
                      <span className="block mt-1">
                        Resolved {new Date(ticket.resolved_at).toLocaleDateString()}
                      </span>
                    )}
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
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {tickets.length === 0 ? 'No support tickets yet' : 'No tickets match your filters'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {tickets.length === 0 
                ? 'Create your first support ticket to get help with any issues or questions.'
                : 'Try adjusting your filters to find the tickets you\'re looking for.'
              }
            </p>
            {tickets.length === 0 ? (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Ticket
                  </Button>
                </DialogTrigger>
              </Dialog>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}

export default SupportTickets;