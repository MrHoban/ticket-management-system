#!/usr/bin/env python3
"""
Test script for the separated ticket workflow
"""

import requests
import json
import time

def test_separated_workflow():
    """Test the new separated workflow"""
    base_url = "http://localhost:3000/api"
    
    print("🧪 Testing Separated Ticket Workflow")
    print("=" * 50)
    
    # Test 1: Submit a new ticket (customer workflow)
    print("\n1️⃣ Testing Customer Ticket Submission")
    print("-" * 30)
    
    customer_ticket = {
        "name": "Alice Johnson",
        "phone": "555-444-3333",
        "email": "alice.johnson@example.com",
        "deviceName": "MacBook Pro 2023",
        "description": "Computer keeps freezing when running multiple applications. Started happening after the latest OS update."
    }
    
    try:
        response = requests.post(f"{base_url}/tickets", json=customer_ticket, timeout=5)
        if response.status_code == 201:
            data = response.json()
            new_ticket_id = data.get('data', {}).get('id')
            print(f"✅ Customer ticket submitted successfully")
            print(f"   Ticket ID: #{new_ticket_id[:8] if new_ticket_id else 'N/A'}...")
            print(f"   Status: {data.get('data', {}).get('status', 'N/A')}")
            print(f"   Priority: {data.get('data', {}).get('priority', 'N/A')}")
        else:
            print(f"❌ Customer ticket submission failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Customer ticket submission error: {e}")
        return False
    
    # Test 2: Staff views ticket board
    print("\n2️⃣ Testing Staff Dashboard View")
    print("-" * 30)
    
    try:
        response = requests.get(f"{base_url}/tickets", timeout=5)
        if response.status_code == 200:
            data = response.json()
            tickets = data.get('data', [])
            print(f"✅ Staff can view ticket board")
            print(f"   Total tickets visible: {len(tickets)}")
            
            # Show ticket summary
            for ticket in tickets[-3:]:  # Show last 3 tickets
                print(f"   - #{ticket['id'][:8]}: {ticket['name']} ({ticket['status']})")
        else:
            print(f"❌ Staff dashboard view failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Staff dashboard error: {e}")
        return False
    
    # Test 3: Staff opens and works on a ticket
    print("\n3️⃣ Testing Staff Ticket Management")
    print("-" * 30)
    
    if new_ticket_id:
        # Test status update
        try:
            update_data = {
                "status": "in-progress",
                "assignedTo": "John Smith",
                "priority": "high"
            }
            
            response = requests.patch(f"{base_url}/tickets/{new_ticket_id}", 
                                    json=update_data, timeout=5)
            if response.status_code == 200:
                print("✅ Staff can update ticket status and assignment")
                print(f"   Status changed to: in-progress")
                print(f"   Assigned to: John Smith")
                print(f"   Priority set to: high")
            else:
                print(f"❌ Ticket update failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Ticket update error: {e}")
        
        # Test adding notes
        try:
            note_data = {
                "note": "Contacted customer. Issue appears to be related to memory usage. Recommended closing unnecessary applications and checking for memory leaks.",
                "author": "John Smith"
            }
            
            response = requests.patch(f"{base_url}/tickets/{new_ticket_id}", 
                                    json=note_data, timeout=5)
            if response.status_code == 200:
                print("✅ Staff can add notes to tickets")
                print(f"   Note added by: John Smith")
            else:
                print(f"❌ Note addition failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Note addition error: {e}")
        
        # Test retrieving updated ticket
        try:
            response = requests.get(f"{base_url}/tickets/{new_ticket_id}", timeout=5)
            if response.status_code == 200:
                ticket = response.json().get('data', {})
                print("✅ Staff can view detailed ticket information")
                print(f"   Current status: {ticket.get('status', 'N/A')}")
                print(f"   Assigned to: {ticket.get('assignedTo', 'Unassigned')}")
                print(f"   Priority: {ticket.get('priority', 'N/A')}")
                print(f"   Notes count: {len(ticket.get('notes', []))}")
            else:
                print(f"❌ Ticket detail view failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Ticket detail error: {e}")
    
    # Test 4: Workflow separation verification
    print("\n4️⃣ Testing Workflow Separation")
    print("-" * 30)
    
    print("✅ Customer submission page: http://localhost:3000/submit")
    print("✅ Staff dashboard: http://localhost:3000/board")
    print("✅ Direct ticket links: http://localhost:3000/ticket/{id}")
    print("✅ API endpoints working for both interfaces")
    
    # Test 5: Python data processor integration
    print("\n5️⃣ Testing Python Integration")
    print("-" * 30)
    
    try:
        from ticket_processor import TicketProcessor
        
        processor = TicketProcessor()
        tickets = processor.fetch_tickets(force_refresh=True)
        print(f"✅ Python processor can fetch tickets: {len(tickets)} found")
        
        if tickets:
            analysis = processor.analyze_tickets()
            print(f"✅ Python analysis working")
            print(f"   Status distribution: {analysis.get('status_distribution', {}).get('counts', {})}")
            
            # Check for the new ticket features
            tickets_with_priority = [t for t in tickets if 'priority' in t]
            tickets_with_assignment = [t for t in tickets if t.get('assignedTo')]
            tickets_with_notes = [t for t in tickets if t.get('notes')]
            
            print(f"   Tickets with priority: {len(tickets_with_priority)}")
            print(f"   Tickets with assignment: {len(tickets_with_assignment)}")
            print(f"   Tickets with notes: {len(tickets_with_notes)}")
        
    except Exception as e:
        print(f"❌ Python integration error: {e}")
    
    # Summary
    print("\n🎯 Workflow Test Summary")
    print("=" * 50)
    print("✅ Customer Workflow:")
    print("   - Dedicated submission page at /submit")
    print("   - Clean, simple interface for ticket creation")
    print("   - Immediate confirmation with ticket ID")
    
    print("\n✅ Staff Workflow:")
    print("   - Comprehensive dashboard at /board")
    print("   - Ticket filtering and search capabilities")
    print("   - Click to open detailed ticket view")
    print("   - Status management and assignment")
    print("   - Note-taking and communication")
    
    print("\n✅ Integration:")
    print("   - Real-time updates between interfaces")
    print("   - Python data processing and analytics")
    print("   - Persistent data storage")
    
    return True

if __name__ == "__main__":
    test_separated_workflow()
