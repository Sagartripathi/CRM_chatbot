"""
Script to add sample raw call data records to the database.
Adds 3 sample Twilio call records for testing.
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

# Add the backend directory to the Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


async def add_sample_data():
    """Add 3 sample raw call data records."""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.db_name]
    raw_call_data_collection = db["raw_call_data"]
    
    print("Starting: Adding sample raw call data records...")
    
    # Sample data records
    sample_records = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "sid": "CAf2280f8ce65faefdc4b5d322e76de001",
            "phone_number_sid": "PNaf84023ee887b55e2c2ace76c1817a4d",
            "account_sid": "AC2d6a0b60ca3cb98032136b0cb9a77a5d",
            "source_trigger": "lets-optimize.app.n8n.cloud",
            "direction": "outbound-api",
            "duration": "45",
            "end_time": "Wed, 05 Nov 2025 10:15:45 +0000",
            "start_time": "Wed, 05 Nov 2025 10:15:00 +0000",
            "queue_time": "2",
            "content_lenght": "150",
            "conn_ip": "47.187.146.247",
            "origin": None,
            "execution_mode": "production",
            "status": "completed",
            "batch_id": "2025-11-05T10:14:00.000Z",
            "campaign_id": "C-VR9B7",
            "campaign_history": "[]",
            "lead_id": "L-E9711DF",
            "lead_type": "organization",
            "called_from": "+18559072608",
            "called_to": "+19016316632",
            "record_summary_shared": "Lead engaged, interested in product demo",
            "leads_notes": "Follow up next week",
            "meeting_booked_shared": "true",
            "demo_booking_shared": None,
            "date_created": "Wed, 05 Nov 2025 10:14:00 +0000",
            "date_updated": "Wed, 05 Nov 2025 10:15:45 +0000",
            "raw_CD_original": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "sid": "CAf2280f8ce65faefdc4b5d322e76de002",
            "phone_number_sid": "PNaf84023ee887b55e2c2ace76c1817a4d",
            "account_sid": "AC2d6a0b60ca3cb98032136b0cb9a77a5d",
            "source_trigger": "lets-optimize.app.n8n.cloud",
            "direction": "outbound-api",
            "duration": "12",
            "end_time": "Wed, 05 Nov 2025 11:30:12 +0000",
            "start_time": "Wed, 05 Nov 2025 11:30:00 +0000",
            "queue_time": "1",
            "content_lenght": "85",
            "conn_ip": "47.187.146.248",
            "origin": None,
            "execution_mode": "production",
            "status": "no-answer",
            "batch_id": "2025-11-05T11:29:00.000Z",
            "campaign_id": "C-NS204",
            "campaign_history": "[]",
            "lead_id": "L-82566C9",
            "lead_type": "individual",
            "called_from": "+18559072608",
            "called_to": "+15550123456",
            "record_summary_shared": None,
            "leads_notes": None,
            "meeting_booked_shared": None,
            "demo_booking_shared": None,
            "date_created": "Wed, 05 Nov 2025 11:29:00 +0000",
            "date_updated": "Wed, 05 Nov 2025 11:30:12 +0000",
            "raw_CD_original": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "sid": "CAf2280f8ce65faefdc4b5d322e76de003",
            "phone_number_sid": "PNaf84023ee887b55e2c2ace76c1817a4d",
            "account_sid": "AC2d6a0b60ca3cb98032136b0cb9a77a5d",
            "source_trigger": "lets-optimize.app.n8n.cloud",
            "direction": "outbound-api",
            "duration": "180",
            "end_time": "Wed, 05 Nov 2025 14:05:00 +0000",
            "start_time": "Wed, 05 Nov 2025 14:02:00 +0000",
            "queue_time": "3",
            "content_lenght": "320",
            "conn_ip": "47.187.146.249",
            "origin": None,
            "execution_mode": "test",
            "status": "completed",
            "batch_id": "2025-11-05T14:01:00.000Z",
            "campaign_id": "C-VR9B7",
            "campaign_history": "[{\"from\":\"C-OLD123\",\"to\":\"C-VR9B7\",\"changed_at\":\"2025-11-04\"}]",
            "lead_id": "L-D954399",
            "lead_type": "individual",
            "called_from": "+18559072608",
            "called_to": "+15550987654",
            "record_summary_shared": "Very interested customer, discussed pricing and next steps",
            "leads_notes": "Ready to schedule demo for next week",
            "meeting_booked_shared": "true",
            "demo_booking_shared": "{\"date\":\"2025-11-12\",\"time\":\"14:00\"}",
            "date_created": "Wed, 05 Nov 2025 14:01:00 +0000",
            "date_updated": "Wed, 05 Nov 2025 14:05:00 +0000",
            "raw_CD_original": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    ]
    
    # Insert sample records
    inserted_count = 0
    for record in sample_records:
        try:
            # Check if already exists
            existing = await raw_call_data_collection.find_one({"sid": record["sid"]})
            if existing:
                print(f"⚠️  Skipping {record['sid']} - already exists")
                continue
            
            await raw_call_data_collection.insert_one(record)
            inserted_count += 1
            print(f"✅ Inserted call record: {record['sid']} (Lead: {record['lead_id']})")
        except Exception as e:
            print(f"❌ Error inserting {record['sid']}: {str(e)}")
    
    print(f"\n{'='*60}")
    print(f"Sample data insertion completed!")
    print(f"Inserted: {inserted_count} records")
    
    # Show total records
    total_records = await raw_call_data_collection.count_documents({})
    print(f"Total raw call data records in database: {total_records}")
    
    # Show sample query
    print(f"\n{'='*60}")
    print("Sample records by lead:")
    for lead_id in ["L-E9711DF", "L-82566C9", "L-D954399"]:
        count = await raw_call_data_collection.count_documents({"lead_id": lead_id})
        if count > 0:
            print(f"  Lead {lead_id}: {count} call(s)")
    
    # Close the connection
    client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Add Sample Raw Call Data Records")
    print("=" * 60)
    asyncio.run(add_sample_data())
    print("=" * 60)

