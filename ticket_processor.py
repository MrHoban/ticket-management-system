#!/usr/bin/env python3
"""
Ticket Processing Module

This Python module provides data processing and analysis capabilities
for the ticket management system. It can be used to:
- Analyze ticket patterns
- Generate reports
- Process ticket data
- Integrate with external systems
"""

import json
import requests
import datetime
from typing import List, Dict, Any, Optional
from collections import Counter
import re


class TicketProcessor:
    """Main class for processing ticket data"""
    
    def __init__(self, api_base_url: str = "http://localhost:3000/api"):
        self.api_base_url = api_base_url
        self.tickets_cache = []
        self.last_fetch = None
    
    def fetch_tickets(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Fetch tickets from the Node.js API"""
        try:
            # Use cache if recent (within 5 minutes) and not forcing refresh
            if (not force_refresh and 
                self.last_fetch and 
                (datetime.datetime.now() - self.last_fetch).seconds < 300):
                return self.tickets_cache
            
            response = requests.get(f"{self.api_base_url}/tickets")
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                self.tickets_cache = data.get('data', [])
                self.last_fetch = datetime.datetime.now()
                return self.tickets_cache
            else:
                print(f"API Error: {data.get('message', 'Unknown error')}")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"Network error fetching tickets: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return []
    
    def analyze_tickets(self) -> Dict[str, Any]:
        """Analyze ticket data and return insights"""
        tickets = self.fetch_tickets()
        
        if not tickets:
            return {"error": "No tickets available for analysis"}
        
        analysis = {
            "total_tickets": len(tickets),
            "status_distribution": self._analyze_status_distribution(tickets),
            "device_analysis": self._analyze_devices(tickets),
            "time_analysis": self._analyze_time_patterns(tickets),
            "contact_analysis": self._analyze_contact_info(tickets),
            "summary": {}
        }
        
        # Generate summary insights
        analysis["summary"] = self._generate_summary(analysis, tickets)
        
        return analysis
    
    def _analyze_status_distribution(self, tickets: List[Dict]) -> Dict[str, Any]:
        """Analyze ticket status distribution"""
        statuses = [ticket.get('status', 'unknown') for ticket in tickets]
        status_counts = Counter(statuses)
        
        total = len(tickets)
        return {
            "counts": dict(status_counts),
            "percentages": {status: round((count/total)*100, 1) 
                          for status, count in status_counts.items()}
        }
    
    def _analyze_devices(self, tickets: List[Dict]) -> Dict[str, Any]:
        """Analyze device patterns"""
        devices = [ticket.get('deviceName', '').lower() for ticket in tickets if ticket.get('deviceName')]
        
        # Extract device types/brands
        device_types = []
        brands = []
        
        for device in devices:
            # Common device type patterns
            if any(term in device for term in ['iphone', 'ios']):
                device_types.append('iPhone')
                brands.append('Apple')
            elif any(term in device for term in ['android', 'samsung', 'galaxy']):
                device_types.append('Android')
                if 'samsung' in device:
                    brands.append('Samsung')
            elif any(term in device for term in ['laptop', 'dell', 'hp', 'lenovo', 'macbook']):
                device_types.append('Laptop')
                if 'dell' in device:
                    brands.append('Dell')
                elif 'hp' in device:
                    brands.append('HP')
                elif 'lenovo' in device:
                    brands.append('Lenovo')
                elif 'macbook' in device:
                    brands.append('Apple')
            elif any(term in device for term in ['desktop', 'pc']):
                device_types.append('Desktop')
        
        return {
            "total_devices": len(devices),
            "device_types": dict(Counter(device_types)),
            "brands": dict(Counter(brands)),
            "most_common_devices": dict(Counter(devices).most_common(5))
        }
    
    def _analyze_time_patterns(self, tickets: List[Dict]) -> Dict[str, Any]:
        """Analyze time-based patterns"""
        timestamps = []
        for ticket in tickets:
            try:
                created_at = ticket.get('createdAt')
                if created_at:
                    # Parse ISO timestamp
                    dt = datetime.datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    timestamps.append(dt)
            except (ValueError, TypeError):
                continue
        
        if not timestamps:
            return {"error": "No valid timestamps found"}
        
        # Analyze patterns
        hours = [dt.hour for dt in timestamps]
        days_of_week = [dt.strftime('%A') for dt in timestamps]
        
        return {
            "total_analyzed": len(timestamps),
            "busiest_hours": dict(Counter(hours).most_common(5)),
            "busiest_days": dict(Counter(days_of_week)),
            "date_range": {
                "earliest": min(timestamps).isoformat(),
                "latest": max(timestamps).isoformat()
            }
        }
    
    def _analyze_contact_info(self, tickets: List[Dict]) -> Dict[str, Any]:
        """Analyze contact information patterns"""
        emails = [ticket.get('email', '') for ticket in tickets if ticket.get('email')]
        phones = [ticket.get('phone', '') for ticket in tickets if ticket.get('phone')]
        
        # Email domain analysis
        email_domains = []
        for email in emails:
            if '@' in email:
                domain = email.split('@')[1].lower()
                email_domains.append(domain)
        
        # Phone number pattern analysis
        phone_patterns = []
        for phone in phones:
            # Simple pattern detection
            digits_only = re.sub(r'\D', '', phone)
            if len(digits_only) == 10:
                phone_patterns.append('US-10-digit')
            elif len(digits_only) == 11:
                phone_patterns.append('US-11-digit')
            else:
                phone_patterns.append('Other')
        
        return {
            "total_emails": len(emails),
            "email_domains": dict(Counter(email_domains).most_common(10)),
            "total_phones": len(phones),
            "phone_patterns": dict(Counter(phone_patterns))
        }
    
    def _generate_summary(self, analysis: Dict, tickets: List[Dict]) -> Dict[str, Any]:
        """Generate summary insights"""
        summary = {}
        
        # Most common status
        status_dist = analysis.get('status_distribution', {}).get('counts', {})
        if status_dist:
            most_common_status = max(status_dist, key=status_dist.get)
            summary['most_common_status'] = most_common_status
        
        # Most problematic device
        device_analysis = analysis.get('device_analysis', {})
        device_types = device_analysis.get('device_types', {})
        if device_types:
            most_common_device = max(device_types, key=device_types.get)
            summary['most_common_device_type'] = most_common_device
        
        # Peak activity time
        time_analysis = analysis.get('time_analysis', {})
        busiest_hours = time_analysis.get('busiest_hours', {})
        if busiest_hours:
            peak_hour = max(busiest_hours, key=busiest_hours.get)
            summary['peak_hour'] = f"{peak_hour}:00"
        
        return summary
    
    def generate_report(self, output_file: Optional[str] = None) -> str:
        """Generate a comprehensive report"""
        analysis = self.analyze_tickets()
        
        if "error" in analysis:
            return f"Report generation failed: {analysis['error']}"
        
        report_lines = [
            "=" * 50,
            "TICKET SYSTEM ANALYSIS REPORT",
            "=" * 50,
            f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            f"📊 OVERVIEW",
            f"Total Tickets: {analysis['total_tickets']}",
            "",
            f"📈 STATUS DISTRIBUTION",
        ]
        
        # Status distribution
        status_dist = analysis.get('status_distribution', {})
        for status, count in status_dist.get('counts', {}).items():
            percentage = status_dist.get('percentages', {}).get(status, 0)
            report_lines.append(f"  {status.title()}: {count} ({percentage}%)")
        
        report_lines.extend([
            "",
            f"💻 DEVICE ANALYSIS",
        ])
        
        # Device analysis
        device_analysis = analysis.get('device_analysis', {})
        device_types = device_analysis.get('device_types', {})
        for device_type, count in device_types.items():
            report_lines.append(f"  {device_type}: {count}")
        
        # Summary insights
        summary = analysis.get('summary', {})
        if summary:
            report_lines.extend([
                "",
                f"🔍 KEY INSIGHTS",
                f"Most common status: {summary.get('most_common_status', 'N/A')}",
                f"Most common device: {summary.get('most_common_device_type', 'N/A')}",
                f"Peak activity hour: {summary.get('peak_hour', 'N/A')}",
            ])
        
        report_text = "\n".join(report_lines)
        
        if output_file:
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(report_text)
                print(f"Report saved to: {output_file}")
            except IOError as e:
                print(f"Error saving report: {e}")
        
        return report_text


def main():
    """Main function for command-line usage"""
    processor = TicketProcessor()
    
    print("🎫 Ticket Data Processor")
    print("=" * 30)
    
    # Fetch and analyze tickets
    tickets = processor.fetch_tickets(force_refresh=True)
    print(f"Fetched {len(tickets)} tickets")
    
    if tickets:
        # Generate analysis
        analysis = processor.analyze_tickets()
        
        # Generate and display report
        report = processor.generate_report("ticket_report.txt")
        print("\n" + report)
    else:
        print("No tickets found or unable to connect to API")


if __name__ == "__main__":
    main()
