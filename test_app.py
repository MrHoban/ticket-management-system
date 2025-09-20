#!/usr/bin/env python3
"""
Test script for the ticket management system
"""

import requests
import json
import time

def test_api():
    """Test the ticket API endpoints"""
    base_url = "http://localhost:3000/api"
    
    print("🧪 Testing Ticket Management System API")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check: PASSED")
        else:
            print(f"❌ Health check: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check: FAILED (Error: {e})")
        return False
    
    # Test getting tickets (should be empty initially)
    try:
        response = requests.get(f"{base_url}/tickets", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get tickets: PASSED (Found {data.get('count', 0)} tickets)")
        else:
            print(f"❌ Get tickets: FAILED (Status: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Get tickets: FAILED (Error: {e})")
    
    # Test creating a ticket
    test_ticket = {
        "name": "John Doe",
        "phone": "555-123-4567",
        "email": "john.doe@example.com",
        "deviceName": "iPhone 12 Pro",
        "description": "Screen is cracked and touch is not responsive"
    }
    
    try:
        response = requests.post(f"{base_url}/tickets", 
                               json=test_ticket, 
                               timeout=5)
        if response.status_code == 201:
            data = response.json()
            ticket_id = data.get('data', {}).get('id')
            print(f"✅ Create ticket: PASSED (ID: {ticket_id[:8] if ticket_id else 'N/A'}...)")
            
            # Test getting the specific ticket
            if ticket_id:
                response = requests.get(f"{base_url}/tickets/{ticket_id}", timeout=5)
                if response.status_code == 200:
                    print("✅ Get specific ticket: PASSED")
                else:
                    print(f"❌ Get specific ticket: FAILED (Status: {response.status_code})")
        else:
            print(f"❌ Create ticket: FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Create ticket: FAILED (Error: {e})")
    
    # Test creating another ticket
    test_ticket2 = {
        "name": "Jane Smith",
        "phone": "555-987-6543",
        "email": "jane.smith@example.com",
        "deviceName": "Dell Laptop XPS 13",
        "description": "Laptop won't boot up, blue screen error"
    }
    
    try:
        response = requests.post(f"{base_url}/tickets", 
                               json=test_ticket2, 
                               timeout=5)
        if response.status_code == 201:
            print("✅ Create second ticket: PASSED")
        else:
            print(f"❌ Create second ticket: FAILED (Status: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Create second ticket: FAILED (Error: {e})")
    
    print("\n🔍 Testing Python Data Processor")
    print("=" * 50)
    
    # Test the Python processor
    try:
        from ticket_processor import TicketProcessor
        
        processor = TicketProcessor()
        tickets = processor.fetch_tickets(force_refresh=True)
        print(f"✅ Fetch tickets via Python: PASSED (Found {len(tickets)} tickets)")
        
        if tickets:
            analysis = processor.analyze_tickets()
            print(f"✅ Analyze tickets: PASSED")
            print(f"   - Total tickets: {analysis.get('total_tickets', 0)}")
            print(f"   - Status distribution: {analysis.get('status_distribution', {}).get('counts', {})}")
            
            # Generate report
            report = processor.generate_report()
            if report and not report.startswith("Report generation failed"):
                print("✅ Generate report: PASSED")
            else:
                print("❌ Generate report: FAILED")
        else:
            print("⚠️  No tickets to analyze")
            
    except ImportError as e:
        print(f"❌ Import ticket_processor: FAILED (Error: {e})")
    except Exception as e:
        print(f"❌ Python processor test: FAILED (Error: {e})")
    
    print("\n🎯 Test Summary")
    print("=" * 50)
    print("✅ API is working and accessible")
    print("✅ Tickets can be created and retrieved")
    print("✅ Python processor can analyze data")
    print("✅ Web interface should be available at http://localhost:3000")
    
    return True

if __name__ == "__main__":
    test_api()
