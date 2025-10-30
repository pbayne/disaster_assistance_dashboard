#!/usr/bin/env python3
"""
Reset all homeowner application statuses to Pending
"""
from datetime import datetime
from database import SessionLocal, Homeowner, init_db

def reset_all_statuses():
    """
    Reset all homeowner statuses to 'Pending' and clear review fields
    """
    init_db()
    db = SessionLocal()

    try:
        # Get count before reset
        total_count = db.query(Homeowner).count()
        print(f"Total homeowners in database: {total_count}")

        # Count by current status
        status_counts = {}
        for status in ["Pending", "Under Review", "Approved", "Processing", "Rejected"]:
            count = db.query(Homeowner).filter(Homeowner.status == status).count()
            if count > 0:
                status_counts[status] = count

        print(f"\nCurrent status distribution:")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")

        # Reset all to Pending
        updated = db.query(Homeowner).update({
            "status": "Pending",
            "review_notes": None,
            "reviewer_name": None,
            "review_date": None,
            "updated_at": datetime.utcnow()
        })

        db.commit()

        print(f"\n✅ Successfully reset {updated} homeowner applications to 'Pending' status!")
        print(f"   All review notes, reviewer names, and review dates have been cleared.")

        # Verify
        pending_count = db.query(Homeowner).filter(Homeowner.status == "Pending").count()
        print(f"\nVerification: {pending_count} applications now have 'Pending' status")

    except Exception as e:
        print(f"❌ Error resetting statuses: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Resetting all homeowner application statuses to 'Pending'...")
    print("=" * 70)
    reset_all_statuses()
