import argparse
import sqlite3

DB_NAME = "pc_builder_db.sqlite"


def init_catalog_db(reset=True):
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()

    def table_columns(table_name):
        try:
            rows = cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
        except sqlite3.OperationalError:
            return set()
        return {row[1] for row in rows}

    expected_components = {
        "source_name",
        "product_type",
        "category",
        "name",
        "description",
        "brand",
        "model",
        "specs",
        "product_url",
        "image_url",
        "availability",
        "rating_count",
        "source_item_id",
        "first_seen_at",
        "last_seen_at",
        "out_of_stock_since",
        "created_at",
        "updated_at",
    }
    expected_prices = {
        "component_id",
        "retailer_name",
        "price",
        "url",
        "availability",
        "updated_at",
    }

    if not reset:
        current_components = table_columns("components")
        current_prices = table_columns("retailer_prices")
        if current_components and not expected_components.issubset(current_components):
            reset = True
        if current_prices and not expected_prices.issubset(current_prices):
            reset = True

    if reset:
        cursor.executescript(
            """
            DROP TABLE IF EXISTS retailer_prices;
            DROP TABLE IF EXISTS components;
            """
        )

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS components (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_name TEXT NOT NULL,
            product_type TEXT NOT NULL,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            brand TEXT,
            model TEXT,
            specs TEXT NOT NULL DEFAULT '{}',
            product_url TEXT,
            image_url TEXT,
            availability TEXT,
            rating_count INTEGER DEFAULT 0,
            source_item_id TEXT UNIQUE,
            first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            out_of_stock_since TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
        CREATE INDEX IF NOT EXISTS idx_components_product_type ON components(product_type);
        CREATE INDEX IF NOT EXISTS idx_components_source_name ON components(source_name);
        CREATE INDEX IF NOT EXISTS idx_components_source_item_id ON components(source_item_id);
        CREATE INDEX IF NOT EXISTS idx_components_price_name ON components(name);

        CREATE TABLE IF NOT EXISTS retailer_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            component_id INTEGER NOT NULL,
            retailer_name TEXT NOT NULL,
            price REAL NOT NULL,
            url TEXT,
            availability TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
            UNIQUE(component_id, retailer_name, url)
        );

        CREATE INDEX IF NOT EXISTS idx_retailer_prices_component_id ON retailer_prices(component_id);
        CREATE INDEX IF NOT EXISTS idx_retailer_prices_retailer_name ON retailer_prices(retailer_name);
        CREATE INDEX IF NOT EXISTS idx_retailer_prices_price ON retailer_prices(price);
        """
    )

    conn.commit()
    conn.close()
    print("Catalog database initialized.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the catalog database.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate catalog tables before initializing them.",
    )
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="Keep existing rows and only ensure the schema exists.",
    )
    args = parser.parse_args()

    reset = True
    if args.no_reset:
        reset = False
    if args.reset:
        reset = True

    init_catalog_db(reset=reset)
