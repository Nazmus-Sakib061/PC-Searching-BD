
import requests
from bs4 import BeautifulSoup
import json
import time
import logging
from urllib.parse import urljoin
import sqlite3

# --- Configuration ---
BASE_URL = "https://www.startech.com.bd"
CPU_CATEGORY_URL_ST = "https://www.startech.com.bd/component/processor"
RYANS_CPU_CATEGORY_URL = "https://www.ryanscomputers.com/category/desktop-component-processor"
TECHLAND_CPU_CATEGORY_URL = "https://www.techlandbd.com/shop-pc-components-processor"
MAX_PAGES_TO_SCRAPE = 3 # Reduced for testing
REQUEST_DELAY_SECONDS = 3
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
}

RYANS_HEADERS = HEADERS
TECHLAND_HEADERS = HEADERS

# --- Database Connection ---
DB_NAME = "pc_builder_db.sqlite"

def get_db_connection():
    """Establishes and returns a SQLite database connection."""
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        logging.info("Database connection established successfully.")
        return conn
    except sqlite3.Error as e:
        logging.error(f"Database connection failed: {e}")
        return None

def save_to_db(product_data, retailer_id, db_conn=None):
    """Updates the price of an existing component in the SQLite database."""
    if not db_conn:
        logging.warning(f"DB connection not available. Skipping save for {product_data.get('name')}.")
        return

    cursor = db_conn.cursor()
    try:
        # We assume the component already exists in 'components' table
        # We update the price for the component that matches the name
        cursor.execute("""
            UPDATE components 
            SET price = ? 
            WHERE name = ?
        """, (
            product_data.get('price'),
            product_data.get('name')
        ))
        
        if cursor.rowcount == 0:
            logging.info(f"Component '{product_data.get('name')}' not found for update, skipping.")
        else:
            db_conn.commit()
            logging.info(f"Successfully updated price for {product_data.get('name')} to {product_data.get('price')}.")
            
    except sqlite3.Error as e:
        logging.error(f"Database update error for {product_data.get('name')}: {e}")
    finally:
        cursor.close()


# --- Scraper Functions for Star Tech (CPU) ---
# (These are based on the refined script from the previous turn)
def extract_specs_startech_cpu(product_url):
    """Extracts detailed CPU specs from Star Tech product page."""
    logging.info(f"Extracting Star Tech CPU specs from: {product_url}")
    specs = {}
    try:
        response = requests.get(product_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        specs_section = soup.find('div', class_='product-details-content')
        if specs_section:
            specs_table = specs_section.find('table', class_='table table-striped')
            if specs_table:
                rows = specs_table.find_all('tr')
                for row in rows:
                    header_tag = row.find('th')
                    data_tag = row.find('td')
                    if header_tag and data_tag:
                        header_text = header_tag.get_text(strip=True).lower()
                        data_text = data_tag.get_text(strip=True)
                        if 'processor name' in header_text: specs['name'] = data_text
                        elif 'brand' in header_text: specs['brand'] = data_text
                        elif 'model' in header_text: specs['model'] = data_text
                        elif 'socket type' in header_text or 'socket' in header_text: specs['socket_type'] = data_text
                        elif 'cores' in header_text: specs['cores'] = int(data_text.split()[0]) if data_text.split() else None
                        elif 'threads' in header_text: specs['threads'] = int(data_text.split()[0]) if data_text.split() else None
                        elif 'base clock' in header_text: specs['base_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', data_text)))
                        elif 'boost clock' in header_text: specs['boost_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', data_text)))
                        elif 'tdps' in header_text or 'power consumption' in header_text:
                            try: specs['tdps'] = int(''.join(filter(str.isdigit, data_text)))
                            except ValueError: pass
                        elif 'integrated graphics' in header_text: specs['integrated_graphics_support'] = 'yes' in data_text.lower()
                        elif 'cache' in header_text: specs['cache'] = data_text

        if 'name' not in specs:
            name_tag = soup.select_one('div.product-details-content h2.product-title a')
            if name_tag: specs['name'] = name_tag.get_text(strip=True)
        if 'price' not in specs:
             price_tag = soup.select_one('span.price')
             if price_tag:
                 price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
                 try: specs['price'] = float(price_text)
                 except ValueError: pass

        availability_tag = soup.find('span', class_='stock-status')
        if availability_tag: specs['availability'] = availability_tag.get_text(strip=True)
        elif 'price' in specs and specs['price'] is not None: specs['availability'] = "In Stock"
        else: specs['availability'] = "Out of Stock"

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

    except (requests.exceptions.Timeout, requests.exceptions.RequestException, Exception) as e:
        logging.error(f"Error processing specs for {product_url}: {e}")
        return {'error': str(e)}


def scrape_category_startech(url, page_num=1):
    """Scrapes CPU listings from Star Tech category page."""
    logging.info(f"Scraping Star Tech CPU page: {url} (Page {page_num})")
    products_on_page = []
    next_page_url = None
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        product_items = soup.select('div.product-item')

        if not product_items:
            logging.warning(f"No product items found on Star Tech page {url}. Check selectors.")
            return [], None

        for item in product_items:
            try:
                name_link_tag = item.select_one('h4.product-name a')
                if not name_link_tag: name_link_tag = item.select_one('div.product-content-wrap h4 a')

                if not name_link_tag: continue

                product_name = name_link_tag.get_text(strip=True)
                relative_url = name_link_tag.get('href')
                product_url = urljoin(BASE_URL, relative_url)

                price_tag = item.select_one('span.price')
                if not price_tag: price_tag = item.select_one('div.product-content-wrap span.price')

                product_price = None
                if price_tag:
                    price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
                    try: product_price = float(price_text)
                    except ValueError: pass

                availability = "Unknown"

                detailed_specs = extract_specs_startech_cpu(product_url)
                if detailed_specs and 'error' in detailed_specs:
                    logging.error(f"Failed to extract details for {product_name} from {product_url}")
                    specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}
                elif detailed_specs:
                    specs_to_merge = {
                        'socket_type': detailed_specs.get('socket_type'), 'tdps': detailed_specs.get('tdps'),
                        'cores': detailed_specs.get('cores'), 'threads': detailed_specs.get('threads'),
                        'base_clock_ghz': detailed_specs.get('base_clock_ghz'), 'boost_clock_ghz': detailed_specs.get('boost_clock_ghz'),
                        'integrated_graphics_support': detailed_specs.get('integrated_graphics_support'), 'cache': detailed_specs.get('cache'),
                        'name': detailed_specs.get('name', product_name),
                        'brand': detailed_specs.get('brand', product_name.split(' ')[0] if product_name else 'Unknown'),
                        'model': detailed_specs.get('model', product_name),
                        'availability': detailed_specs.get('availability', availability),
                        'price': detailed_specs.get('price', product_price)
                    }
                else: specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}

                product_data = {
                    'name': specs_to_merge.get('name', product_name),
                    'brand': specs_to_merge.get('brand', 'Unknown'),
                    'model': specs_to_merge.get('model', product_name),
                    'price': specs_to_merge.get('price', product_price),
                    'url': product_url,
                    'availability': specs_to_merge.get('availability', availability),
                    'component_type': 'CPU',
                    **specs_to_merge
                }
                products_on_page.append(product_data)
            except Exception as e:
                logging.error(f"Error processing a product item on {url}: {e}")
                continue

        pagination_links = soup.select('li.page-item a.page-link')
        for link_tag in pagination_links:
            link_text = link_tag.get_text(strip=True)
            href = link_tag.get('href')
            if href and link_text.lower() == 'next':
                if page_num < MAX_PAGES_TO_SCRAPE:
                    next_page_url = urljoin(BASE_URL, href)
                    logging.info(f"Found Star Tech 'Next' page link: {next_page_url}")
                    break
        
        if not next_page_url and page_num >= MAX_PAGES_TO_SCRAPE:
            logging.info(f"Reached max pages ({MAX_PAGES_TO_SCRAPE}) for Star Tech. Stopping pagination.")
        elif not next_page_url:
            logging.info("No 'Next' page link found on Star Tech. Assuming end of pagination.")

        return products_on_page, next_page_url

    except (requests.exceptions.Timeout, requests.exceptions.RequestException, Exception) as e:
        logging.error(f"Error fetching Star Tech category page {url}: {e}")
        return [], None


# --- Scraper Functions for Ryans Computers (CPU) ---
def extract_specs_ryans_cpu(product_url):
    """Extracts detailed CPU specs from Ryans Computers product page."""
    logging.info(f"Extracting Ryans CPU specs from: {product_url}")
    specs = {}
    try:
        response = requests.get(product_url, headers=RYANS_HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        spec_list_container = soup.select_one('div.product-details-wrapper ul.list-unstyled')
        
        if spec_list_container:
            items = spec_list_container.find_all('li')
            for item in items:
                text = item.get_text(strip=True)
                if 'Socket' in text: specs['socket_type'] = text.split('Socket: ')[-1]
                elif 'Core Count' in text: specs['cores'] = int(text.split('Core Count: ')[-1]) if text.split('Core Count: ')[-1].isdigit() else None
                elif 'Thread Count' in text: specs['threads'] = int(text.split('Thread Count: ')[-1]) if text.split('Thread Count: ')[-1].isdigit() else None
                elif 'Base Clock' in text: specs['base_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', text.split('Base Clock: ')[-1])))
                elif 'Boost Clock' in text: specs['boost_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', text.split('Boost Clock: ')[-1])))
                elif 'TDP' in text: specs['tdps'] = int(''.join(filter(str.isdigit, text)))
                elif 'Graphics' in text and ('Integrated' in text or 'Internal' in text): specs['integrated_graphics_support'] = True

        product_title_tag = soup.select_one('h1.product-title')
        if product_title_tag: specs['name'] = product_title_tag.get_text(strip=True)

        price_tag = soup.select_one('span.price')
        if price_tag:
            price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
            try: specs['price'] = float(price_text)
            except ValueError: pass

        availability_tag = soup.select_one('div.stock-info span')
        if availability_tag: specs['availability'] = availability_tag.get_text(strip=True)
        elif 'price' in specs and specs['price'] is not None: specs['availability'] = "In Stock"
        else: specs['availability'] = "Out of Stock"
        
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

    except (requests.exceptions.Timeout, requests.exceptions.RequestException, Exception) as e:
        logging.error(f"Error extracting Ryans CPU specs from {product_url}: {e}")
        return {'error': str(e)}


def scrape_category_ryans(url, page_num=1):
    """Scrapes CPU listings from Ryans Computers category page."""
    logging.info(f"Scraping Ryans CPU page: {url} (Page {page_num})")
    products_on_page = []
    next_page_url = None
    try:
        response = requests.get(url, headers=RYANS_HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        product_items = soup.select('div.product-layout.product-grid')

        if not product_items:
            logging.warning(f"No product items found on Ryans page {url}. Check selectors.")
            return [], None

        for item in product_items:
            try:
                name_link_tag = item.select_one('div.product-name a')
                if not name_link_tag: continue

                product_name = name_link_tag.get_text(strip=True)
                relative_url = name_link_tag.get('href')
                product_url = urljoin(RYANS_BASE_URL, relative_url)

                price_tag = item.select_one('div.product-price span')
                product_price = None
                if price_tag:
                    price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
                    try: product_price = float(price_text)
                    except ValueError: pass
                
                availability = "Unknown"

                detailed_specs = extract_specs_ryans_cpu(product_url)
                if detailed_specs and 'error' in detailed_specs:
                    logging.error(f"Failed to extract details for {product_name} from {product_url}")
                    specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}
                elif detailed_specs:
                    specs_to_merge = {
                        'socket_type': detailed_specs.get('socket_type'), 'tdps': detailed_specs.get('tdps'),
                        'cores': detailed_specs.get('cores'), 'threads': detailed_specs.get('threads'),
                        'base_clock_ghz': detailed_specs.get('base_clock_ghz'), 'boost_clock_ghz': detailed_specs.get('boost_clock_ghz'),
                        'integrated_graphics_support': detailed_specs.get('integrated_graphics_support'),
                        'name': detailed_specs.get('name', product_name),
                        'brand': detailed_specs.get('brand', product_name.split(' ')[0] if product_name else 'Unknown'),
                        'model': detailed_specs.get('model', product_name),
                        'availability': detailed_specs.get('availability', availability),
                        'price': detailed_specs.get('price', product_price)
                    }
                else: specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}

                product_data = {
                    'name': specs_to_merge.get('name', product_name),
                    'brand': specs_to_merge.get('brand', 'Unknown'),
                    'model': specs_to_merge.get('model', product_name),
                    'price': specs_to_merge.get('price', product_price),
                    'url': product_url,
                    'availability': specs_to_merge.get('availability', availability),
                    'component_type': 'CPU',
                    **specs_to_merge
                }
                products_on_page.append(product_data)
            except Exception as e:
                logging.error(f"Error processing a product item on Ryans {url}: {e}")
                continue

        pagination_controls = soup.select('ul.pagination li.page-item a.page-link')
        for link_tag in pagination_controls:
            href = link_tag.get('href')
            if href and 'page=' in href:
                page_num_param_start = href.find('page=') + 5
                try:
                    current_page_num_in_href = int(href[page_num_param_start:].split('&')[0])
                    if current_page_num_in_href > page_num:
                        if page_num < MAX_PAGES_TO_SCRAPE:
                            next_page_url = urljoin(RYANS_BASE_URL, href)
                            logging.info(f"Found Ryans 'Next' page link: {next_page_url}")
                            break
                        else:
                            logging.info(f"Reached max pages ({MAX_PAGES_TO_SCRAPE}) for Ryans. Stopping pagination.")
                            break
                except (ValueError, IndexError):
                    pass

        if not next_page_url and page_num >= MAX_PAGES_TO_SCRAPE:
            logging.info(f"Reached max pages ({MAX_PAGES_TO_SCRAPE}) for Ryans. Stopping pagination.")
        elif not next_page_url:
            logging.info("No further page links found on Ryans. Assuming end of pagination.")
        
        return products_on_page, next_page_url

    except (requests.exceptions.Timeout, requests.exceptions.RequestException, Exception) as e:
        logging.error(f"Error fetching Ryans category page {url}: {e}")
        return [], None


# --- Scraper Functions for Tech Land BD (CPU) ---
def extract_specs_techland_cpu(product_url):
    """Extracts detailed CPU specs from Tech Land BD product page."""
    logging.info(f"Extracting Tech Land BD CPU specs from: {product_url}")
    specs = {}
    try:
        response = requests.get(product_url, headers=TECHLAND_HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        spec_section = soup.select_one('div.product-details-area table.table')
        
        if spec_section:
            rows = spec_section.find_all('tr')
            for row in rows:
                header_tag = row.find('td') # Header might be in first td
                data_tag = row.find_all('td')[1] if len(row.find_all('td')) > 1 else None # Data in second td
                
                if header_tag and data_tag:
                    header_text = header_tag.get_text(strip=True).lower()
                    data_text = data_tag.get_text(strip=True)

                    if 'processor name' in header_text: specs['name'] = data_text
                    elif 'brand' in header_text: specs['brand'] = data_text
                    elif 'model' in header_text: specs['model'] = data_text
                    elif 'socket' in header_text: specs['socket_type'] = data_text
                    elif 'cores' in header_text: specs['cores'] = int(data_text.split()[0]) if data_text.split() else None
                    elif 'threads' in header_text: specs['threads'] = int(data_text.split()[0]) if data_text.split() else None
                    elif 'base clock' in header_text: specs['base_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', data_text)))
                    elif 'boost clock' in header_text: specs['boost_clock_ghz'] = float(''.join(filter(lambda x: x.isdigit() or x == '.', data_text)))
                    elif 'tdps' in header_text or 'power consumption' in header_text:
                        try: specs['tdps'] = int(''.join(filter(str.isdigit, data_text)))
                        except ValueError: pass
                    elif 'integrated graphics' in header_text: specs['integrated_graphics_support'] = 'yes' in data_text.lower()
                    elif 'cache' in header_text: specs['cache'] = data_text
        
        product_title_tag = soup.select_one('div.product-details h1')
        if product_title_tag: specs['name'] = product_title_tag.get_text(strip=True)
        
        price_tag = soup.select_one('span.price')
        if price_tag:
            price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
            try: specs['price'] = float(price_text)
            except ValueError: pass

        availability_tag = soup.select_one('div.stock-availability')
        if availability_tag: specs['availability'] = availability_tag.get_text(strip=True)
        elif 'price' in specs and specs['price'] is not None: specs['availability'] = "In Stock"
        else: specs['availability'] = "Out of Stock"

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

    except (requests.exceptions.Timeout, requests.exceptions.RequestException, Exception) as e:
        logging.error(f"Error extracting Tech Land BD CPU specs from {product_url}: {e}")
        return {'error': str(e)}

def scrape_category_techland(url, page_num=1):
    """Scrapes CPU listings from Tech Land BD category page."""
    logging.info(f"Scraping Tech Land BD CPU page: {url} (Page {page_num})")
    products_on_page = []
    next_page_url = None
    try:
        response = requests.get(url, headers=TECHLAND_HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        product_items = soup.select('div.col-md-3')

        if not product_items:
            logging.warning(f"No product items found on Tech Land BD page {url}. Check selectors.")
            return [], None

        for item in product_items:
            try:
                name_link_tag = item.select_one('h3.product-title a')
                if not name_link_tag: continue

                product_name = name_link_tag.get_text(strip=True)
                relative_url = name_link_tag.get('href')
                product_url = urljoin(TECHLAND_BASE_URL, relative_url)

                price_tag = item.select_one('div.price')
                product_price = None
                if price_tag:
                    price_text = price_tag.get_text(strip=True).replace('৳', '').replace(',', '').strip()
                    try: product_price = float(price_text)
                    except ValueError: pass
                
                availability = "Unknown"

                detailed_specs = extract_specs_techland_cpu(product_url)
                if detailed_specs and 'error' in detailed_specs:
                    logging.error(f"Failed to extract details for {product_name} from {product_url}")
                    specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}
                elif detailed_specs:
                    specs_to_merge = {
                        'socket_type': detailed_specs.get('socket_type'), 'tdps': detailed_specs.get('tdps'),
                        'cores': detailed_specs.get('cores'), 'threads': detailed_specs.get('threads'),
                        'base_clock_ghz': detailed_specs.get('base_clock_ghz'), 'boost_clock_ghz': detailed_specs.get('boost_clock_ghz'),
                        'integrated_graphics_support': detailed_specs.get('integrated_graphics_support'),
                        'name': detailed_specs.get('name', product_name),
                        'brand': detailed_specs.get('brand', product_name.split(' ')[0] if product_name else 'Unknown'),
                        'model': detailed_specs.get('model', product_name),
                        'availability': detailed_specs.get('availability', availability),
                        'price': detailed_specs.get('price', product_price)
                    }
                else: specs_to_merge = {'socket_type': None, 'tdps': None, 'cores': None, 'threads': None}

                product_data = {
                    'name': specs_to_merge.get('name', product_name),
                    'brand': specs_to_merge.get('brand', 'Unknown'),
                    'model': specs_to_merge.get('model', product_name),
                    'price': specs_to_merge.get('price', product_price),
                    'url': product_url,
                    'availability': specs_to_merge.get('availability', availability),
                    'component_type': 'CPU',
                    **specs_to_merge
                }
                products_on_page.append(product_data)
            except Exception as e:
                logging.error(f"Error processing a product item on Tech Land BD {url}: {e}")
                continue

        pagination_links = soup.select('ul.pagination li a')
        for link_tag in pagination_links:
            href = link_tag.get('href')
            if href and ('page=' in href or '/page/' in href):
                try:
                    page_num_str = None
                    if 'page=' in href:
                        page_num_str = href.split('page=')[-1].split('&')[0]
                    elif '/page/' in href:
                        page_num_str = href.split('/page/')[-1].split('/')[0]

                    if page_num_str:
                        current_page_num_in_href = int(page_num_str)
                        if current_page_num_in_href > page_num:
                            if page_num < MAX_PAGES_TO_SCRAPE:
                                next_page_url = urljoin(TECHLAND_BASE_URL, href)
                                logging.info(f"Found Tech Land BD 'Next' page link: {next_page_url}")
                                break
                            else:
                                logging.info(f"Reached max pages ({MAX_PAGES_TO_SCRAPE}) for Tech Land BD. Stopping pagination.")
                                break
                except (ValueError, IndexError):
                    pass

        if not next_page_url and page_num >= MAX_PAGES_TO_SCRAPE:
            logging.info(f"Reached max pages ({MAX_PAGES_TO_SCRAPE}) for Tech Land BD. Stopping pagination.")
        elif not next_page_url:
            logging.info("No further page links found on Tech Land BD. Assuming end of pagination.")
        
        return products_on_page, next_page_url

    except (requests.exceptions.Timeout, requests.exceptions.RequestException, Exception) as e:
        logging.error(f"Error fetching Tech Land BD category page {url}: {e}")
        return [], None

# --- Orchestration and Database Schema for Historical Data ---

# Assume retailers are pre-populated or added dynamically:
# retailer_startech_id = 1
# retailer_ryans_id = 2
# retailer_techland_id = 3

def run_all_retailer_scrapers(max_pages_per_retailer=MAX_PAGES_TO_SCRAPE):
    """ Orchestrates scraping across multiple retailers for CPUs. """
    all_scraped_products = []
    db_connection = get_db_connection() # Get the DB connection

    # Define retailers and their scraping configurations
    retailers_to_scrape = {
        1: {'name': 'Star Tech', 'url': CPU_CATEGORY_URL_ST, 'scraper': scrape_category_startech, 'headers': HEADERS},
        2: {'name': 'Ryans Computers', 'url': RYANS_CPU_CATEGORY_URL, 'scraper': scrape_category_ryans, 'headers': RYANS_HEADERS},
        3: {'name': 'Tech Land BD', 'url': TECHLAND_CPU_CATEGORY_URL, 'scraper': scrape_category_techland, 'headers': TECHLAND_HEADERS}
        # Add more retailers here as needed with their respective URLs and scrapers
    }

    for retailer_id, config in retailers_to_scrape.items():
        logging.info(f"\n--- Starting Scraper for {config['name']} (Retailer ID: {retailer_id}) ---")
        current_page_url = config['url']
        page_count = 1
        retailer_products = []

        while current_page_url and page_count <= max_pages_per_retailer:
            products, next_url = config['scraper'](current_page_url, page_count)
            
            if products:
                for product in products:
                    # Pass the retailer_id to the save_to_db function
                    save_to_db(product, retailer_id, db_conn=db_connection)
                    retailer_products.append(product)
            
            current_page_url = next_url
            page_count += 1
            
            if current_page_url:
                logging.info(f"Waiting {REQUEST_DELAY_SECONDS} seconds before next request for {config['name']}...")
                time.sleep(REQUEST_DELAY_SECONDS)

        logging.info(f"Finished scraping {config['name']}. Processed {len(retailer_products)} products.")
        all_scraped_products.extend(retailer_products)

    if db_connection:
        db_connection.close() # Close the DB connection
        logging.info("Database connection closed.")
    
    logging.info(f"--- Total products scraped across all retailers: {len(all_scraped_products)} ---")
    return all_scraped_products

# --- Database Schema for Historical Data ---
# This SQL would be executed separately to set up the tables.

DB_SCHEMA_SQL = """
-- Drop tables if they exist to allow for re-creation during development (use with caution)
-- DROP TABLE IF EXISTS price_history;
-- DROP TABLE IF EXISTS retailers;
-- Note: 'components' and other specific component tables are assumed to exist from Step 1.

-- Table to store retailer information
CREATE TABLE IF NOT EXISTS retailers (
    retailer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    base_url TEXT UNIQUE NOT NULL
);

-- Table to store historical price data for components
CREATE TABLE IF NOT EXISTS price_history (
    price_id SERIAL PRIMARY KEY,
    component_id INT NOT NULL REFERENCES components(component_id),
    retailer_id INT NOT NULL REFERENCES retailers(retailer_id),
    price DECIMAL(10, 2) NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- Consider a UNIQUE constraint if you only want one price entry per component/retailer per minute/hour/day
    -- UNIQUE (component_id, retailer_id, scraped_at) -- Example: granular uniqueness
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_history_component_id ON price_history (component_id);
CREATE INDEX IF NOT EXISTS idx_price_history_retailer_id ON price_history (retailer_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at ON price_history (scraped_at);

-- Populate retailers table with data for implemented scrapers
-- Use INSERT ... ON CONFLICT to avoid errors if the retailer already exists
INSERT INTO retailers (name, base_url) VALUES
('Star Tech', 'https://www.startech.com.bd') ON CONFLICT (name) DO NOTHING;
INSERT INTO retailers (name, base_url) VALUES
('Ryans Computers', 'https://www.ryanscomputers.com') ON CONFLICT (name) DO NOTHING;
INSERT INTO retailers (name, base_url) VALUES
('Tech Land BD', 'https://www.techlandbd.com') ON CONFLICT (name) DO NOTHING;
-- Add other retailers here as they are implemented. Ensure retailer_id matches the ones used in run_all_retailer_scrapers.
"""

# --- Script Execution ---
if __name__ == "__main__":
    print("--- Starting Multi-Retailer CPU Scraper with DB Integration ---")
    
    # --- IMPORTANT: Database Setup ---
    # Before running this script, you MUST:
    # 1. Have PostgreSQL installed and running.
    # 2. Create the database 'pc_builder_db' (or as per DB_CONFIG).
    # 3. Execute the DB_SCHEMA_SQL commands to create 'retailers' and 'price_history' tables.
    #    You can do this via psql: psql -d pc_builder_db -U your_db_user -f path/to/your/schema.sql
    # 4. Ensure DB_CONFIG in this script matches your connection details.
    
    # Attempt to establish DB connection
    db_connection = get_db_connection()
    
    if db_connection:
        print("Database connection available. Proceeding with scraping and saving.")
        scraped_data = run_all_retailer_scrapers(max_pages_per_retailer=MAX_PAGES_TO_SCRAPE)
        
        print(f"\n--- Scraping Summary ---")
        print(f"Scraping process completed for multiple retailers.")
        print(f"Total products processed/saved to DB: {len(scraped_data)}")
    else:
        print("\n--- DB Connection Failed ---")
        print("Could not establish database connection. Scraping aborted. Please check DB_CONFIG and ensure PostgreSQL is running.")
        print("Proceeding with simulated saving (logging only) for demonstration purposes.")
        # Run without DB connection for demonstration if DB is not set up yet
        scraped_data = run_all_retailer_scrapers(max_pages_per_retailer=MAX_PAGES_TO_SCRAPE) # Will use simulated saving
        print("\n--- Scraping Summary (Simulated Save) ---")
        print(f"Scraping process completed.")
        print(f"Total products processed (simulated save): {len(scraped_data)}")

    # --- Next Steps Reminder ---
    # 1. Complete DB setup and verify 'save_to_db' functionality.
    # 2. Extend extract_specs_* functions for other component types (GPU, Motherboard, etc.).
    # 3. Develop scrapers for other retailers and component categories.
    # 4. Implement logic to manage 12-month price history (archiving/cleanup).
    # 5. Set up the 2-day update schedule.
    # 6. Develop backend logic for graph data and power scores (bottleneck analysis).
    # 7. Implement frontend visualizations.
    # 8. Handle dynamic content/AJAX loading if needed (e.g., using Selenium).
    # 9. Implement robust error handling, retries, and proxy management if necessary.
    # 10. Implement logic to map scraped product names/URLs to existing component_ids in the DB, or insert new components.
