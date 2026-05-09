import subprocess
import os
import sys

def run_update():
    print("Starting catalog update...")
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        init_path = os.path.join(script_dir, "init_catalog_db.py")
        scraper_path = os.path.join(script_dir, "newegg_scraper.py")
        subprocess.run([sys.executable, init_path, "--no-reset"], check=True)
        subprocess.run([sys.executable, scraper_path, "--no-details", "--keep-db"], check=True)
        print("Newegg catalog scrape completed successfully.")
    except Exception as e:
        print(f"Update failed: {e}")

if __name__ == "__main__":
    run_update()
