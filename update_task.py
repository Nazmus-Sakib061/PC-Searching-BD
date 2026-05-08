import subprocess
import os
import sys

# Script to run every 2 days
def run_update():
    print("Starting bi-weekly update...")
    try:
        # Run the scraper
        subprocess.run([sys.executable, "multi_retailer_scraper.py"], check=True)
        print("Scraping completed successfully.")
    except Exception as e:
        print(f"Update failed: {e}")

if __name__ == "__main__":
    run_update()
