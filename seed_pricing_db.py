import sqlite3

def seed_sample_data():
    conn = sqlite3.connect('pc_builder_db.sqlite')
    cursor = conn.cursor()

    # Seed Component
    cursor.execute("INSERT INTO components (name, category, specs) VALUES (?, ?, ?)", 
                   ("Intel Core i9-13900K", "CPU", '{"cores": 24, "socket": "LGA1700"}'))
    comp_id = cursor.lastrowid

    # Seed Prices
    cursor.execute("INSERT INTO retailer_prices (component_id, retailer_name, price, url) VALUES (?, ?, ?, ?)", 
                   (comp_id, "Star Tech", 75000, "https://startech.com.bd/..."))
    cursor.execute("INSERT INTO retailer_prices (component_id, retailer_name, price, url) VALUES (?, ?, ?, ?)", 
                   (comp_id, "Ryans", 74500, "https://ryanscomputers.com/..."))

    conn.commit()
    conn.close()
    print("Seeded sample data with multiple prices.")

if __name__ == '__main__':
    seed_sample_data()
