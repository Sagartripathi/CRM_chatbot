#!/usr/bin/env python3
"""
CRM Backend API Testing Script
Tests all meeting-related endpoints with focus on new status update and delete functionality
"""

import requests
import json
import uuid
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Configuration
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://calltrack-hub.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class CRMTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_lead_id = None
        self.test_meeting_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def setup_auth(self):
        """Setup authentication by creating a test user and logging in"""
        print("\n=== Setting up Authentication ===")
        
        # Create test user
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        user_data = {
            "email": test_email,
            "password": "TestPassword123!",
            "first_name": "John",
            "last_name": "Doe",
            "role": "agent"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            if response.status_code == 200:
                user_info = response.json()
                self.test_user_id = user_info['id']
                self.log_result("User Registration", True, f"Created test user: {test_email}")
            else:
                self.log_result("User Registration", False, f"Failed to create user: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("User Registration", False, f"Exception during registration: {str(e)}")
            return False
        
        # Login
        login_data = {
            "email": test_email,
            "password": "TestPassword123!"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            if response.status_code == 200:
                token_data = response.json()
                self.auth_token = token_data['access_token']
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_result("User Login", True, "Successfully logged in")
                return True
            else:
                self.log_result("User Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("User Login", False, f"Exception during login: {str(e)}")
            return False
    
    def setup_test_data(self):
        """Create test lead for meeting tests"""
        print("\n=== Setting up Test Data ===")
        
        # Create test lead
        lead_data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": f"jane.smith_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "+1234567890",
            "source": "website",
            "notes": "Test lead for meeting functionality"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/leads", json=lead_data)
            if response.status_code == 200:
                lead_info = response.json()
                self.test_lead_id = lead_info['id']
                self.log_result("Test Lead Creation", True, f"Created test lead: {lead_info['first_name']} {lead_info['last_name']}")
                return True
            else:
                self.log_result("Test Lead Creation", False, f"Failed to create lead: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Test Lead Creation", False, f"Exception during lead creation: {str(e)}")
            return False
    
    def test_create_meeting(self):
        """Test POST /api/meetings - Create new meeting"""
        print("\n=== Testing Meeting Creation ===")
        
        # Test successful meeting creation
        start_time = datetime.now(timezone.utc) + timedelta(days=1)
        meeting_data = {
            "lead_id": self.test_lead_id,
            "title": "Sales Discussion",
            "start_time": start_time.isoformat(),
            "duration_minutes": 60,
            "notes": "Initial sales meeting to discuss requirements"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/meetings", json=meeting_data)
            if response.status_code == 200:
                meeting_info = response.json()
                self.test_meeting_id = meeting_info['id']
                self.log_result("Create Meeting", True, f"Created meeting: {meeting_info['title']}")
                
                # Verify meeting details
                if (meeting_info['lead_id'] == self.test_lead_id and 
                    meeting_info['organizer_id'] == self.test_user_id and
                    meeting_info['status'] == 'confirmed'):
                    self.log_result("Meeting Details Validation", True, "Meeting created with correct details")
                else:
                    self.log_result("Meeting Details Validation", False, "Meeting details don't match expected values")
                
            else:
                self.log_result("Create Meeting", False, f"Failed to create meeting: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Create Meeting", False, f"Exception during meeting creation: {str(e)}")
            return False
        
        # Test conflict detection
        try:
            response = self.session.post(f"{API_BASE}/meetings", json=meeting_data)
            if response.status_code == 400:
                self.log_result("Meeting Conflict Detection", True, "Correctly detected time slot conflict")
            else:
                self.log_result("Meeting Conflict Detection", False, f"Should have detected conflict: {response.status_code}")
        except Exception as e:
            self.log_result("Meeting Conflict Detection", False, f"Exception during conflict test: {str(e)}")
        
        return True
    
    def test_get_meetings(self):
        """Test GET /api/meetings - Get all meetings"""
        print("\n=== Testing Get Meetings ===")
        
        try:
            response = self.session.get(f"{API_BASE}/meetings")
            if response.status_code == 200:
                meetings = response.json()
                self.log_result("Get Meetings", True, f"Retrieved {len(meetings)} meetings")
                
                # Verify our test meeting is in the list
                test_meeting_found = any(m['id'] == self.test_meeting_id for m in meetings)
                if test_meeting_found:
                    self.log_result("Meeting List Validation", True, "Test meeting found in meetings list")
                else:
                    self.log_result("Meeting List Validation", False, "Test meeting not found in meetings list")
                
                # Verify role-based filtering (agent should only see their meetings)
                for meeting in meetings:
                    if meeting['organizer_id'] != self.test_user_id:
                        self.log_result("Role-based Filtering", False, "Found meeting not organized by current user")
                        break
                else:
                    self.log_result("Role-based Filtering", True, "All meetings belong to current user")
                
            else:
                self.log_result("Get Meetings", False, f"Failed to get meetings: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Meetings", False, f"Exception during get meetings: {str(e)}")
    
    def test_update_meeting(self):
        """Test PUT /api/meetings/{meeting_id} - Update meeting details"""
        print("\n=== Testing Meeting Update ===")
        
        if not self.test_meeting_id:
            self.log_result("Update Meeting", False, "No test meeting ID available")
            return
        
        # Update meeting details
        start_time = datetime.now(timezone.utc) + timedelta(days=2)
        update_data = {
            "lead_id": self.test_lead_id,
            "title": "Updated Sales Discussion",
            "start_time": start_time.isoformat(),
            "duration_minutes": 90,
            "notes": "Updated meeting with extended duration"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/meetings/{self.test_meeting_id}", json=update_data)
            if response.status_code == 200:
                updated_meeting = response.json()
                self.log_result("Update Meeting", True, f"Updated meeting: {updated_meeting['title']}")
                
                # Verify updates
                if (updated_meeting['title'] == "Updated Sales Discussion" and
                    updated_meeting['notes'] == "Updated meeting with extended duration"):
                    self.log_result("Meeting Update Validation", True, "Meeting updated with correct details")
                else:
                    self.log_result("Meeting Update Validation", False, "Meeting update details don't match")
                
            else:
                self.log_result("Update Meeting", False, f"Failed to update meeting: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Update Meeting", False, f"Exception during meeting update: {str(e)}")
    
    def test_update_meeting_status(self):
        """Test PATCH /api/meetings/{meeting_id}/status - Update meeting status (NEW ENDPOINT)"""
        print("\n=== Testing Meeting Status Update (NEW) ===")
        
        if not self.test_meeting_id:
            self.log_result("Update Meeting Status", False, "No test meeting ID available")
            return
        
        # Test status updates for all valid statuses
        statuses_to_test = ["proposed", "confirmed", "rescheduled", "cancelled"]
        
        for status in statuses_to_test:
            try:
                # Note: The endpoint expects status as a query parameter or in request body
                # Based on the FastAPI code, it expects status as a path parameter
                response = self.session.patch(f"{API_BASE}/meetings/{self.test_meeting_id}/status", 
                                            params={"status": status})
                
                if response.status_code == 200:
                    updated_meeting = response.json()
                    if updated_meeting['status'] == status:
                        self.log_result(f"Status Update to {status}", True, f"Successfully updated status to {status}")
                    else:
                        self.log_result(f"Status Update to {status}", False, f"Status not updated correctly: {updated_meeting['status']}")
                else:
                    self.log_result(f"Status Update to {status}", False, f"Failed to update status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result(f"Status Update to {status}", False, f"Exception during status update: {str(e)}")
        
        # Test permission check - this should work since we're the organizer
        # In a real scenario, we'd test with a different user to verify permission denial
    
    def test_delete_meeting(self):
        """Test DELETE /api/meetings/{meeting_id} - Delete meeting (NEW ENDPOINT)"""
        print("\n=== Testing Meeting Deletion (NEW) ===")
        
        if not self.test_meeting_id:
            self.log_result("Delete Meeting", False, "No test meeting ID available")
            return
        
        # First, create another meeting to delete (so we don't lose our main test meeting)
        start_time = datetime.now(timezone.utc) + timedelta(days=3)
        meeting_data = {
            "lead_id": self.test_lead_id,
            "title": "Meeting to Delete",
            "start_time": start_time.isoformat(),
            "duration_minutes": 30,
            "notes": "This meeting will be deleted"
        }
        
        try:
            # Create meeting to delete
            response = self.session.post(f"{API_BASE}/meetings", json=meeting_data)
            if response.status_code == 200:
                meeting_to_delete = response.json()
                delete_meeting_id = meeting_to_delete['id']
                
                # Now delete it
                delete_response = self.session.delete(f"{API_BASE}/meetings/{delete_meeting_id}")
                if delete_response.status_code == 200:
                    self.log_result("Delete Meeting", True, "Successfully deleted meeting")
                    
                    # Verify deletion by trying to get the meeting
                    verify_response = self.session.get(f"{API_BASE}/meetings")
                    if verify_response.status_code == 200:
                        meetings = verify_response.json()
                        deleted_meeting_found = any(m['id'] == delete_meeting_id for m in meetings)
                        if not deleted_meeting_found:
                            self.log_result("Delete Verification", True, "Meeting successfully removed from database")
                        else:
                            self.log_result("Delete Verification", False, "Meeting still exists after deletion")
                    
                else:
                    self.log_result("Delete Meeting", False, f"Failed to delete meeting: {delete_response.status_code}", delete_response.text)
            else:
                self.log_result("Delete Meeting Setup", False, f"Failed to create meeting for deletion test: {response.status_code}")
        except Exception as e:
            self.log_result("Delete Meeting", False, f"Exception during meeting deletion: {str(e)}")
    
    def test_permission_checks(self):
        """Test permission checks for meeting operations"""
        print("\n=== Testing Permission Checks ===")
        
        # For comprehensive permission testing, we'd need to create another user
        # For now, we'll test that our operations work with proper permissions
        
        # Test accessing meeting details
        if self.test_meeting_id:
            try:
                response = self.session.get(f"{API_BASE}/meetings")
                if response.status_code == 200:
                    meetings = response.json()
                    our_meeting = next((m for m in meetings if m['id'] == self.test_meeting_id), None)
                    if our_meeting and our_meeting['organizer_id'] == self.test_user_id:
                        self.log_result("Permission Check - Own Meeting", True, "Can access own meeting")
                    else:
                        self.log_result("Permission Check - Own Meeting", False, "Cannot access own meeting")
                else:
                    self.log_result("Permission Check", False, f"Failed to check permissions: {response.status_code}")
            except Exception as e:
                self.log_result("Permission Check", False, f"Exception during permission check: {str(e)}")
    
    def run_all_tests(self):
        """Run all meeting-related tests"""
        print("🚀 Starting CRM Backend Meeting API Tests")
        print(f"Testing against: {API_BASE}")
        
        # Setup
        if not self.setup_auth():
            print("❌ Authentication setup failed. Stopping tests.")
            return False
        
        if not self.setup_test_data():
            print("❌ Test data setup failed. Stopping tests.")
            return False
        
        # Run tests in order
        self.test_create_meeting()
        self.test_get_meetings()
        self.test_update_meeting()
        self.test_update_meeting_status()  # NEW endpoint
        self.test_delete_meeting()         # NEW endpoint
        self.test_permission_checks()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = CRMTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)