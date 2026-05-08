import subprocess
import os
import sys

# Script to run every 2 days
def run_update():
    print("Starting bi-weekly update...")
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        scraper_path = os.path.join(script_dir, "multi_retailer_scraper.py")
        # Run the scraper
        subprocess.run([sys.executable, scraper_path], check=True)
        print("Scraping completed successfully.")
    except Exception as e:
        print(f"Update failed: {e}")

if __name__ == "__main__":
    run_update()
