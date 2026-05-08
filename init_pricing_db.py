import sqlite3

def init_pricing_db():
    conn = sqlite3.connect('pc_builder_db.sqlite')
    cursor = conn.cursor()

    # Drop old tables
    cursor.execute("DROP TABLE IF EXISTS cpus")
    cursor.execute("DROP TABLE IF EXISTS gpus")
    cursor.execute("DROP TABLE IF EXISTS motherboards")
    cursor.execute("DROP TABLE IF EXISTS rams")
    cursor.execute("DROP TABLE IF EXISTS storage_devices")
    cursor.execute("DROP TABLE IF EXISTS psus")
    cursor.execute("DROP TABLE IF EXISTS pc_cases")
    cursor.execute("DROP TABLE IF EXISTS cpu_coolers")
    cursor.execute("DROP TABLE IF EXISTS components")

    # New Unified Components Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS components (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            specs TEXT -- JSON string for flexible specs
        )
    """)

    # New Retailer Prices Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS retailer_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            component_id INTEGER NOT NULL,
            retailer_name TEXT NOT NULL,
            price REAL NOT NULL,
            url TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (component_id) REFERENCES components(id)
        )
    """)

    conn.commit()
    conn.close()
    print("New pricing-focused database initialized.")

if __name__ == '__main__':
    init_pricing_db()
