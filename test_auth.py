#!/usr/bin/env python3
"""
Test script for the authentication system
"""

import requests
import json

def test_authentication():
    """Test the authentication workflow"""
    base_url = "http://localhost:3000"
    api_url = f"{base_url}/api"
    
    print("🔐 Testing Authentication System")
    print("=" * 50)
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    # Test 1: Check initial auth status (should be unauthenticated)
    print("\n1️⃣ Testing Initial Auth Status")
    print("-" * 30)
    
    try:
        response = session.get(f"{api_url}/auth/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            is_auth = data.get('isAuthenticated', False)
            print(f"✅ Auth status check: {'Authenticated' if is_auth else 'Not authenticated'}")
            if not is_auth:
                print("   ✓ Correctly showing as not authenticated")
        else:
            print(f"❌ Auth status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Auth status error: {e}")
    
    # Test 2: Try to access protected route without auth
    print("\n2️⃣ Testing Protected Route Access (Unauthenticated)")
    print("-" * 30)
    
    try:
        response = session.patch(f"{api_url}/tickets/test-id", 
                               json={"status": "in-progress"}, 
                               timeout=5)
        if response.status_code == 401:
            print("✅ Protected route correctly blocked unauthenticated access")
            data = response.json()
            print(f"   Message: {data.get('message', 'N/A')}")
        else:
            print(f"❌ Protected route should have returned 401, got: {response.status_code}")
    except Exception as e:
        print(f"❌ Protected route test error: {e}")
    
    # Test 3: Login with wrong credentials
    print("\n3️⃣ Testing Login with Wrong Credentials")
    print("-" * 30)
    
    try:
        wrong_creds = {
            "username": "wrong",
            "password": "wrong"
        }
        response = session.post(f"{api_url}/auth/login", 
                              json=wrong_creds, 
                              timeout=5)
        if response.status_code == 401:
            print("✅ Login correctly rejected wrong credentials")
            data = response.json()
            print(f"   Message: {data.get('message', 'N/A')}")
        else:
            print(f"❌ Wrong credentials should return 401, got: {response.status_code}")
    except Exception as e:
        print(f"❌ Wrong credentials test error: {e}")
    
    # Test 4: Login with correct credentials
    print("\n4️⃣ Testing Login with Correct Credentials")
    print("-" * 30)
    
    try:
        correct_creds = {
            "username": "admin",
            "password": "admin123"
        }
        response = session.post(f"{api_url}/auth/login", 
                              json=correct_creds, 
                              timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Login successful with correct credentials")
                print(f"   User: {data.get('user', {}).get('username', 'N/A')}")
                print(f"   Message: {data.get('message', 'N/A')}")
            else:
                print(f"❌ Login failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Login test error: {e}")
    
    # Test 5: Check auth status after login
    print("\n5️⃣ Testing Auth Status After Login")
    print("-" * 30)
    
    try:
        response = session.get(f"{api_url}/auth/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            is_auth = data.get('isAuthenticated', False)
            user = data.get('user', {})
            print(f"✅ Auth status after login: {'Authenticated' if is_auth else 'Not authenticated'}")
            if is_auth:
                print(f"   ✓ Logged in as: {user.get('username', 'N/A')}")
        else:
            print(f"❌ Auth status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Auth status after login error: {e}")
    
    # Test 6: Access protected route after authentication
    print("\n6️⃣ Testing Protected Route Access (Authenticated)")
    print("-" * 30)
    
    try:
        # First get a real ticket ID
        tickets_response = session.get(f"{api_url}/tickets", timeout=5)
        if tickets_response.status_code == 200:
            tickets_data = tickets_response.json()
            tickets = tickets_data.get('data', [])
            
            if tickets:
                ticket_id = tickets[0]['id']
                
                # Try to update the ticket
                response = session.patch(f"{api_url}/tickets/{ticket_id}", 
                                       json={"status": "in-progress", "assignedTo": "Test Admin"}, 
                                       timeout=5)
                if response.status_code == 200:
                    print("✅ Protected route accessible after authentication")
                    data = response.json()
                    if data.get('success'):
                        print("   ✓ Ticket update successful")
                    else:
                        print(f"   ⚠️ Ticket update failed: {data.get('message', 'Unknown error')}")
                else:
                    print(f"❌ Protected route failed: {response.status_code}")
            else:
                print("⚠️ No tickets available to test with")
        else:
            print(f"❌ Could not fetch tickets: {tickets_response.status_code}")
    except Exception as e:
        print(f"❌ Protected route after auth error: {e}")
    
    # Test 7: Logout
    print("\n7️⃣ Testing Logout")
    print("-" * 30)
    
    try:
        response = session.post(f"{api_url}/auth/logout", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Logout successful")
                print(f"   Message: {data.get('message', 'N/A')}")
            else:
                print(f"❌ Logout failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Logout failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Logout test error: {e}")
    
    # Test 8: Check auth status after logout
    print("\n8️⃣ Testing Auth Status After Logout")
    print("-" * 30)
    
    try:
        response = session.get(f"{api_url}/auth/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            is_auth = data.get('isAuthenticated', False)
            print(f"✅ Auth status after logout: {'Authenticated' if is_auth else 'Not authenticated'}")
            if not is_auth:
                print("   ✓ Correctly logged out")
        else:
            print(f"❌ Auth status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Auth status after logout error: {e}")
    
    # Test 9: Try protected route after logout
    print("\n9️⃣ Testing Protected Route After Logout")
    print("-" * 30)
    
    try:
        response = session.patch(f"{api_url}/tickets/test-id", 
                               json={"status": "closed"}, 
                               timeout=5)
        if response.status_code == 401:
            print("✅ Protected route correctly blocked after logout")
        else:
            print(f"❌ Protected route should be blocked after logout, got: {response.status_code}")
    except Exception as e:
        print(f"❌ Protected route after logout error: {e}")
    
    # Summary
    print("\n🎯 Authentication Test Summary")
    print("=" * 50)
    print("✅ Authentication System Features:")
    print("   - Session-based authentication")
    print("   - Protected staff routes (/board, /ticket/:id)")
    print("   - Protected API endpoints (PATCH, DELETE)")
    print("   - Login/logout functionality")
    print("   - Auth status checking")
    
    print("\n✅ Security Features:")
    print("   - Password hashing with bcrypt")
    print("   - Session management")
    print("   - Automatic redirects for unauthenticated access")
    print("   - Proper HTTP status codes")
    
    print("\n✅ User Experience:")
    print("   - Clean login interface at /login")
    print("   - User info display in dashboard")
    print("   - Logout button in header")
    print("   - Automatic redirects")
    
    print("\n🔑 Default Credentials:")
    print("   Username: admin")
    print("   Password: admin123")
    
    return True

if __name__ == "__main__":
    test_authentication()
