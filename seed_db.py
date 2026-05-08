import sqlite3

def seed_database():
    # Remove existing db file to start fresh or keep adding (here we re-create)
    conn = sqlite3.connect('pc_builder_db.sqlite')
    cursor = conn.cursor()

    # Clear old data (optional, to avoid duplicates)
    tables = ['cpus', 'gpus', 'motherboards', 'rams', 'storage_devices', 'psus', 'pc_cases', 'cpu_coolers']
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")

    # Seed CPUs
    cpus = [
        ("Intel Core i9-13900K", "Intel", "i9", "LGA1700", 75000),
        ("AMD Ryzen 7 7700X", "AMD", "Ryzen 7", "AM5", 50000),
        ("Intel Core i5-13600K", "Intel", "i5", "LGA1700", 40000),
        ("AMD Ryzen 5 7600", "AMD", "Ryzen 5", "AM5", 28000),
        ("Intel Core i7-13700K", "Intel", "i7", "LGA1700", 55000)
    ]
    cursor.executemany("INSERT INTO cpus (name, brand, model, socket_type, price) VALUES (?, ?, ?, ?, ?)", cpus)

    # Seed GPUs
    gpus = [
        ("NVIDIA RTX 4070", "NVIDIA", "RTX 4070", 12, "PCIe 4.0", 120000),
        ("AMD RX 7800 XT", "AMD", "RX 7800 XT", 16, "PCIe 4.0", 95000),
        ("NVIDIA RTX 4080", "NVIDIA", "RTX 4080", 16, "PCIe 4.0", 180000),
        ("NVIDIA RTX 3060", "NVIDIA", "RTX 3060", 12, "PCIe 4.0", 35000),
        ("AMD RX 6600", "AMD", "RX 6600", 8, "PCIe 4.0", 28000)
    ]
    cursor.executemany("INSERT INTO gpus (name, brand, model, vram_gb, pcie_version, price) VALUES (?, ?, ?, ?, ?, ?)", gpus)

    # Seed Motherboards
    mbs = [
        ("ASUS ROG STRIX Z790-A", "ATX", "DDR5", 4, 45000),
        ("MSI B650 GAMING PLUS WIFI", "ATX", "DDR5", 4, 30000),
        ("Gigabyte B760M DS3H", "Micro-ATX", "DDR5", 2, 22000),
        ("ASRock B650M Pro RS", "Micro-ATX", "DDR5", 4, 25000),
        ("MSI MAG B760 TOMAHAWK", "ATX", "DDR5", 4, 32000)
    ]
    cursor.executemany("INSERT INTO motherboards (name, form_factor, ram_type, ram_slots_count, price) VALUES (?, ?, ?, ?, ?)", mbs)

    # Seed RAM
    rams = [
        ("Corsair Vengeance 32GB DDR5 6000MHz", "DDR5", 6000, 32, "DIMM", 12000),
        ("G.Skill Trident Z5 RGB 64GB DDR5 6400MHz", "DDR5", 6400, 64, "DIMM", 25000),
        ("Kingston Fury Beast 16GB DDR4 3200MHz", "DDR4", 3200, 16, "DIMM", 5500),
        ("Adata XPG Lancer 32GB DDR5 5600MHz", "DDR5", 5600, 32, "DIMM", 11000),
        ("TeamGroup T-Force Delta RGB 16GB DDR4 3600MHz", "DDR4", 3600, 16, "DIMM", 6000)
    ]
    cursor.executemany("INSERT INTO rams (name, type, speed_mhz, capacity_gb, form_factor, price) VALUES (?, ?, ?, ?, ?, ?)", rams)

    # Seed Storage
    storage = [
        ("Samsung 970 EVO Plus 1TB NVMe", "NVMe SSD", "NVMe PCIe Gen3", "M.2", 1000, 9000),
        ("WD Blue 2TB HDD", "HDD", "SATA III", "3.5\"", 2000, 6500),
        ("Crucial MX500 1TB SATA SSD", "SATA SSD", "SATA III", "2.5\"", 1000, 7500),
        ("Samsung 990 Pro 2TB NVMe PCIe 4.0", "NVMe SSD", "NVMe PCIe Gen4", "M.2", 2000, 22000),
        ("Kingston NV2 500GB NVMe", "NVMe SSD", "NVMe PCIe Gen4", "M.2", 500, 4500)
    ]
    cursor.executemany("INSERT INTO storage_devices (name, storage_type, interface, form_factor, capacity_gb, price) VALUES (?, ?, ?, ?, ?, ?)", storage)

    # Seed PSU
    psus = [
        ("Corsair RM850x 850W Gold", 850, "ATX", 15000),
        ("Cooler Master MWE 650 Bronze 650W", 650, "ATX", 8000),
        ("Seasonic FOCUS GX-750 750W Gold", 750, "ATX", 12000),
        ("EVGA 600W White", 600, "ATX", 5000),
        ("Thermaltake Toughpower 750W GF1", 750, "ATX", 10500)
    ]
    cursor.executemany("INSERT INTO psus (name, wattage_w, form_factor, price) VALUES (?, ?, ?, ?)", psus)

    # Seed Cases
    cases = [
        ("Corsair 4000D Airflow ATX", "ATX", 7000),
        ("NZXT H510 Flow", "ATX", 6500),
        ("Lian Li O11 Dynamic Mini", "Mini-ITX", 9500),
        ("Cooler Master NR600", "ATX", 5500),
        ("Fractal Design Meshify C", "ATX", 8500),
        ("Montech Air 100 ARGB", "Micro-ATX", 5000)
    ]
    cursor.executemany("INSERT INTO pc_cases (name, form_factor, price) VALUES (?, ?, ?)", cases)

    # Seed Coolers
    coolers = [
        ("Noctua NH-D15", "Air", 9000),
        ("DeepCool AK620", "Air", 5500),
        ("Cooler Master Hyper 212 EVO", "Air", 3500),
        ("Arctic Liquid Freezer II 280", "AIO Liquid", 11000),
        ("Be Quiet! Dark Rock Pro 4", "Air", 8500)
    ]
    cursor.executemany("INSERT INTO cpu_coolers (name, cooler_type, price) VALUES (?, ?, ?)", coolers)

    conn.commit()
    conn.close()
    print("Database seeded with more sample data.")

if __name__ == '__main__':
    seed_database()
