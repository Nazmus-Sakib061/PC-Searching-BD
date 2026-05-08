
import requests
from bs4 import BeautifulSoup
import json
import time
import logging
from urllib.parse import urljoin # Used for safely joining URLs

# --- Configuration ---
BASE_URL = "https://www.startech.com.bd"
# Verified URL for CPUs on Star Tech
CPU_CATEGORY_URL = "https://www.startech.com.bd/processor-component" 
MAX_PAGES_TO_SCRAPE = 10 # Increased limit for more comprehensive scraping
REQUEST_DELAY_SECONDS = 3 # Increased delay for politeness
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
}

# --- Database Configuration Placeholder ---
# In a real application, you would connect to your PostgreSQL database here.
# This section outlines the tables that would be needed:
# 1. cpus, gpus, motherboards, etc. (as designed in Step 1)
# 2. components (central registry)
# 3. users, saved_builds, build_components (for user features)
# 4. price_history (to store historical prices)

# Example price_history table structure:
# CREATE TABLE price_history (
#     price_id SERIAL PRIMARY KEY,
#     component_id INT NOT NULL REFERENCES components(component_id),
#     retailer_id INT, -- Foreign key to a retailers table (needs to be created)
#     price DECIMAL(10, 2) NOT NULL,
#     scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
# );
# A 'retailers' table would be needed to identify sources:
# CREATE TABLE retailers (
#     retailer_id SERIAL PRIMARY KEY,
#     name VARCHAR(100) UNIQUE NOT NULL,
#     base_url TEXT UNIQUE NOT NULL
# );


def get_db_connection():
    """Placeholder for database connection setup."""
    logging.info("Simulating database connection.")
    # Replace with actual psycopg2 connection logic
    return None 

def save_to_db(component_data, retailer_id, db_conn=None):
    """
    Saves scraped component data and its price to the database.
    Handles insertion into 'components' and 'price_history' tables.
    Requires retailer_id to be passed.
    """
    if not db_conn: # If no DB connection is provided, just log.
        logging.info(f"DB Save (Simulated): Component={component_data.get('name')}, Price={component_data.get('price')}, RetailerID={retailer_id}")
        return

    # In a real implementation, this would involve SQL queries:
    # - Find or insert the component into the 'components' table.
    # - Insert the price and timestamp into the 'price_history' table, linking to the component and retailer.
    # - Handle potential duplicate entries for the same component/retailer/timestamp if re-scraping.
    logging.info(f"Saving to DB: {component_data.get('name')} - Price: {component_data.get('price')} from Retailer ID: {retailer_id}")
    # Pseudo-code for DB operations:
    # cursor = db_conn.cursor()
    # try:
    #     # 1. Insert/Update Component Data (e.g., name, brand, model, URL, specs)
    #     #    This requires logic to check if component already exists (e.g., by URL or unique SKU).
    #     #    If it exists, update details if they changed. If not, insert new.
    #     #    Get the component_id.
    #     
    #     # 2. Insert Price History
    #     #    cursor.execute("""
    #     #        INSERT INTO price_history (component_id, retailer_id, price, scraped_at)
    #     #        VALUES (%s, %s, %s, NOW())
    #     #    """, (component_id, retailer_id, component_data['price']))
    #     # db_conn.commit()
    # except Exception as e:
    #     logging.error(f"DB Error for {component_data.get('name')}: {e}")
    #     db_conn.rollback()


def extract_specs_from_url(product_url, component_type='CPU'):
    """
    Scrapes detailed specifications from a single product page.
    This function needs to be adapted for each component type and retailer.
    """
    logging.info(f"Extracting specs from: {product_url}")
    specs = {}
    try:
        response = requests.get(product_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # --- Star Tech Specific Spec Extraction ---
        # Most detailed specs are often in a table or a list of specs.
        # Example: Look for a table with class 'table table-striped' or similar
        specs_section = soup.find('div', class_='product-details-content') # General content area
        if specs_section:
            # Try finding a specs table directly
            specs_table = specs_section.find('table', class_='table table-striped') 
            
            if specs_table:
                rows = specs_table.find_all('tr')
                for row in rows:
                    header_tag = row.find('th')
                    data_tag = row.find('td')
                    if header_tag and data_tag:
                        header_text = header_tag.get_text(strip=True).lower()
                        data_text = data_tag.get_text(strip=True)

                        # CPU Specific Specs
                        if component_type == 'CPU':
                            if 'processor name' in header_text:
                                specs['name'] = data_text # Full name might be here
                            elif 'brand' in header_text:
                                specs['brand'] = data_text
                            elif 'model' in header_text:
                                specs['model'] = data_text
                            elif 'socket type' in header_text or 'socket' in header_text:
                                specs['socket_type'] = data_text
                            elif 'cores' in header_text:
                                specs['cores'] = int(data_text.split()[0]) if data_text.split() else None # Extract number
                            elif 'threads' in header_text:
                                specs['threads'] = int(data_text.split()[0]) if data_text.split() else None
                            elif 'base clock' in header_text:
                                specs['base_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', data_text))) # Extract float
                            elif 'boost clock' in header_text:
                                specs['boost_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', data_text)))
                            elif 'tdps' in header_text or 'power consumption' in header_text:
                                try:
                                    specs['tdps'] = int(''.join(filter(str.isdigit, data_text)))
                                except ValueError:
                                    pass
                            elif 'integrated graphics' in header_text:
                                specs['integrated_graphics_support'] = 'yes' in data_text.lower()
                        # Add similar logic for GPU, Motherboard, RAM etc. as needed
                        # elif component_type == 'GPU': ...

            # Fallback: Try to find specs in a list or other elements if table is not present
            # Example: Searching for specific keywords in descriptive text.

        # Add other common fields if not found in specs table
        if 'name' not in specs:
            name_tag = soup.select_one('div.product-details-content h2.product-title a') # Hypothesized title tag
            if name_tag:
                specs['name'] = name_tag.get_text(strip=True)
        if 'price' not in specs: # Price might be on the main page or repeated here
             price_tag = soup.select_one('span.price') # Hypothesized price tag
             if price_tag:
                 price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
                 try:
                     specs['price'] = float(price_text)
                 except ValueError:
                     pass
        
        # Extract availability from detail page if more reliable
        # Example: Check for specific text or class
        availability_tag = soup.find('span', class_='stock-status') # Hypothesized availability tag
        if availability_tag:
            specs['availability'] = availability_tag.get_text(strip=True)
        else:
            # If not found, try inferring from price or other indicators
            if 'price' in specs and specs['price'] is not None:
                specs['availability'] = "In Stock" # Default assumption if price exists
            else:
                specs['availability'] = "Out of Stock" # Default assumption if no price

        # Ensure required fields are present, even if None
        specs.setdefault('socket_type', None)
        specs.setdefault('tdps', None)
        specs.setdefault('cores', None)
        specs.setdefault('threads', None)
        specs.setdefault('base_clock_ghz', None)
        specs.setdefault('boost_clock_ghz', None)
        specs.setdefault('integrated_graphics_support', None)
        specs.setdefault('name', 'Unknown Product')
        specs.setdefault('price', None)
        specs.setdefault('availability', 'Unknown')

        return specs

    except requests.exceptions.Timeout:
        logging.warning(f"Timeout extracting specs from {product_url}")
        return {'error': 'timeout'}
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching specs from {product_url}: {e}")
        return {'error': 'request_failed'}
    except Exception as e:
        logging.error(f"Error parsing specs from {product_url}: {e}")
        return {'error': 'parsing_error'}


def scrape_category_page(url, page_num=1, retailer_id=1): # Added retailer_id
    """
    Scrapes product listings from a category page for a given retailer.
    Returns a list of product data dictionaries and the URL of the next page if found.
    """
    logging.info(f"Scraping category page: {url} (Page {page_num})")
    products_on_page = []
    next_page_url = None

    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # --- Star Tech Specific Selectors (Refined) ---
        # Product item container within the grid columns
        product_items = soup.select('div.product-item') # More generic and often works for Star Tech

        if not product_items:
            logging.warning(f"No product items found on page {url}. Check selectors.")
            return [], None

        for item in product_items:
            try:
                # Extract Product Name and URL
                name_link_tag = item.select_one('h4.product-name a')
                if not name_link_tag:
                    name_link_tag = item.select_one('div.product-content-wrap h4 a') # Alternative selector if primary fails

                if not name_link_tag:
                    logging.warning("Skipping item: Could not find product name/link tag.")
                    continue

                product_name = name_link_tag.get_text(strip=True)
                relative_product_url = name_link_tag.get('href')
                product_url = urljoin(BASE_URL, relative_product_url) # Safely join URLs

                # Extract Price
                price_tag = item.select_one('span.price')
                if not price_tag:
                    price_tag = item.select_one('div.product-content-wrap span.price') # Alternative selector

                product_price = None
                if price_tag:
                    price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
                    try:
                        product_price = float(price_text)
                    except ValueError:
                        logging.warning(f"Could not convert price '{price_text}' to float for {product_name}")
                        product_price = None # Ensure it's None if conversion fails

                # Extract Availability (simpler inference for now, will be refined by detail page scrape)
                availability = "Unknown"
                # Check for an 'out-of-stock' visual indicator if possible
                # Example: item.find('div', class_='out-of-stock-badge')
                # If no specific indicator, assume "Unknown" and rely on detail page or later logic.

                # --- Fetch detailed specs from product page ---
                # This is crucial for compatibility and power metrics
                detailed_specs = extract_specs_from_url(product_url, component_type='CPU')
                if detailed_specs and 'error' in detailed_specs:
                    logging.error(f"Failed to extract details for {product_name} from {product_url}")
                    # Decide how to handle this: skip, or use partial data? For now, we'll proceed with partial.
                    specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}
                elif detailed_specs:
                    specs_to_merge = {
                        'socket_type': detailed_specs.get('socket_type'),
                        'tdps': detailed_specs.get('tdps'),
                        'cores': detailed_specs.get('cores'),
                        'threads': detailed_specs.get('threads'),
                        'base_clock_ghz': detailed_specs.get('base_clock_ghz'),
                        'boost_clock_ghz': detailed_specs.get('boost_clock_ghz'),
                        'integrated_graphics_support': detailed_specs.get('integrated_graphics_support'),
                        'cache': detailed_specs.get('cache')
                    }
                else: # If extract_specs_from_url returned None or empty dict
                    specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}


                product_data = {
                    'name': product_name,
                    'brand': specs_to_merge.get('brand', product_name.split(' ')[0] if product_name else 'Unknown'), # Try to get brand from specs or infer
                    'model': specs_to_merge.get('model', product_name), # Use model from specs if available
                    'price': product_price,
                    'url': product_url,
                    'availability': availability, # This might be updated by detailed_specs if more accurate
                    'component_type': 'CPU',
                    **specs_to_merge # Merge extracted detailed specs
                }
                products_on_page.append(product_data)

            except Exception as e:
                logging.error(f"Error processing a product item on {url}: {e}")
                continue # Skip to the next product if there's an error

        # --- Pagination Handling ---
        # Look for pagination elements. Star Tech often uses simple 'page-item' with 'page-link'.
        pagination_links = soup.select('li.page-item a.page-link')
        next_page_url = None
        found_next = False

        for link_tag in pagination_links:
            link_text = link_tag.get_text(strip=True)
            href = link_tag.get('href')

            if href:
                # Check for 'Next' link
                if link_text.lower() == 'next' or link_tag.find('i', class_='fa-chevron-right'): # Check for text or icon
                    if page_num < MAX_PAGES_TO_SCRAPE:
                        next_page_url = urljoin(BASE_URL, href)
                        logging.info(f"Found 'Next' page link: {next_page_url}")
                        found_next = True
                        break
                    else:
                        logging.info(f"Reached max pages ({MAX_PAGES_TO_SCRAPE}). Stopping pagination.")
                        break # Stop if max pages reached
                
                # If not 'Next', check for page number links to ensure we can find subsequent pages if needed
                # This is more for robust detection than direct use here.
                try:
                    page_num_link = int(link_text)
                    if page_num_link > page_num and page_num_link <= MAX_PAGES_TO_SCRAPE:
                        # This logic helps ensure we can find future pages if 'Next' is missing for some reason
                        pass 
                except ValueError:
                    pass # Not a page number

        if not found_next and page_num >= MAX_PAGES_TO_SCRAPE:
            logging.info("Reached max pages and no 'Next' link found. Stopping pagination.")
            next_page_url = None

        return products_on_page, next_page_url

    except requests.exceptions.Timeout:
        logging.warning(f"Request timed out for {url}")
        return [], None
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching category page {url}: {e}")
        return [], None
    except Exception as e:
        logging.error(f"Error parsing category page {url}: {e}")
        return [], None

# --- Main Scraping Orchestration ---
def run_startech_scraper(retailer_id=1): # Default retailer_id for Star Tech
    all_scraped_products = []
    current_page_url = CPU_CATEGORY_URL
    page_count = 1

    db_connection = get_db_connection() # Get DB connection

    while current_page_url and page_count <= MAX_PAGES_TO_SCRAPE:
        products, next_url = scrape_category_page(current_page_url, page_count, retailer_id)
        
        if products:
            for product in products:
                # In a real scenario, you'd want to:
                # 1. Check if this component (by URL/SKU) already exists in 'components' table.
                # 2. If exists, update its details (name, brand, price, specs) if they've changed.
                # 3. Insert the current price into 'price_history'.
                # 4. If component is new, insert into 'components' and then 'price_history'.
                # For this outline, we just call the simulated save_to_db.
                save_to_db(product, retailer_id, db_conn=db_connection) 
                all_scraped_products.append(product) # Collect for summary
        
        current_page_url = next_url
        page_count += 1
        
        # Polite delay between page requests
        if current_page_url: # Only sleep if there's a next page to request
            logging.info(f"Waiting {REQUEST_DELAY_SECONDS} seconds before next request...")
            time.sleep(REQUEST_DELAY_SECONDS)

    if db_connection: # Close DB connection if opened
        # db_connection.close()
        logging.info("Simulated DB connection closed.")

    logging.info(f"Finished scraping Star Tech CPUs. Processed {len(all_scraped_products)} products.")
    return all_scraped_products

# --- Script Execution ---
if __name__ == "__main__":
    print("--- Starting Star Tech CPU Scraper ---")
    
    # This part would ideally be scheduled to run every 2 days.
    # For manual execution during development:
    scraped_data = run_startech_scraper(retailer_id=1) # Assuming retailer_id 1 for Star Tech
    
    print(f"
--- Scraping Summary ---")
    print(f"Scraping process for Star Tech CPUs completed.")
    print(f"Successfully processed/simulated saving for {len(scraped_data)} products.")

    # --- Next Steps Reminder ---
    # 1. Extend 'extract_specs_from_url' for other component types (GPU, Motherboard, etc.).
    # 2. Develop similar scraper functions for other retailers (Ryans, Tech Land, etc.).
    # 3. Implement actual database interaction in 'save_to_db' and 'get_db_connection'.
    # 4. Create the 'retailers' table and assign IDs.
    # 5. Design and implement 'price_history' table and related logic for 12-month storage.
    # 6. Implement the 2-day update scheduler.
    # 7. Plan and develop backend for graph data generation.
    # 8. Plan and develop frontend for visualizations (price graphs, power graphs).
    # 9. Handle dynamic content/AJAX loading if needed (e.g., using Selenium).
    # 10. Implement robust error handling, retries, and proxy management if necessary.
