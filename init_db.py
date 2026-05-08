import sqlite3

def create_database():
    conn = sqlite3.connect('pc_builder_db.sqlite')
    cursor = conn.cursor()

    schema = """
    CREATE TABLE IF NOT EXISTS cpus (
        cpu_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        socket_type TEXT NOT NULL,
        cores INTEGER,
        threads INTEGER,
        base_clock_ghz REAL,
        boost_clock_ghz REAL,
        tdps INTEGER,
        integrated_graphics_support BOOLEAN DEFAULT 0,
        release_date DATE,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS motherboards (
        motherboard_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        chipset TEXT,
        form_factor TEXT NOT NULL,
        compatible_cpu_sockets TEXT, 
        ram_type TEXT NOT NULL,
        ram_slots_count INTEGER NOT NULL,
        max_ram_capacity_gb INTEGER,
        max_ram_speed_mhz INTEGER,
        pcie_slots_config TEXT,
        m2_slots_count INTEGER DEFAULT 0,
        sata_ports_count INTEGER DEFAULT 0,
        has_wifi BOOLEAN DEFAULT 0,
        has_bluetooth BOOLEAN DEFAULT 0,
        release_date DATE,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS rams (
        ram_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        type TEXT NOT NULL,
        speed_mhz INTEGER NOT NULL,
        capacity_gb INTEGER NOT NULL,
        form_factor TEXT NOT NULL,
        latency TEXT,
        modules_in_kit INTEGER DEFAULT 1,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS gpus (
        gpu_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        vram_gb INTEGER,
        vram_type TEXT,
        pcie_version TEXT NOT NULL,
        power_connectors_required TEXT,
        power_consumption_w INTEGER,
        form_factor_length_mm INTEGER,
        form_factor_height_slots INTEGER,
        width_mm INTEGER,
        release_date DATE,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS storage_devices (
        storage_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        storage_type TEXT NOT NULL,
        interface TEXT NOT NULL,
        form_factor TEXT NOT NULL,
        capacity_gb INTEGER NOT NULL,
        read_speed_mbps INTEGER,
        write_speed_mbps INTEGER,
        release_date DATE,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS psus (
        psu_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        wattage_w INTEGER NOT NULL,
        efficiency_rating TEXT,
        form_factor TEXT NOT NULL,
        modularity TEXT,
        cpu_connectors_count INTEGER DEFAULT 0,
        pcie_connectors_count INTEGER DEFAULT 0,
        sata_connectors_count INTEGER DEFAULT 0,
        release_date DATE,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS pc_cases (
        case_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        form_factor TEXT NOT NULL,
        supported_motherboard_form_factors TEXT,
        max_gpu_length_mm INTEGER,
        max_cpu_cooler_height_mm INTEGER,
        drive_bays_3_5_inch_count INTEGER DEFAULT 0,
        drive_bays_2_5_inch_count INTEGER DEFAULT 0,
        radiator_support TEXT,
        release_date DATE,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS cpu_coolers (
        cooler_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        cooler_type TEXT NOT NULL,
        compatible_sockets TEXT,
        max_tdp_support_w INTEGER,
        radiator_size_mm INTEGER,
        fan_size_mm INTEGER,
        height_mm INTEGER,
        price REAL,
        manufacturer_url TEXT
    );

    CREATE TABLE IF NOT EXISTS components (
        component_id INTEGER PRIMARY KEY AUTOINCREMENT,
        component_type TEXT NOT NULL,
        cpu_id INTEGER REFERENCES cpus(cpu_id),
        gpu_id INTEGER REFERENCES gpus(gpu_id),
        motherboard_id INTEGER REFERENCES motherboards(motherboard_id),
        ram_id INTEGER REFERENCES rams(ram_id),
        storage_id INTEGER REFERENCES storage_devices(storage_id),
        psu_id INTEGER REFERENCES psus(psu_id),
        case_id INTEGER REFERENCES pc_cases(case_id),
        cooler_id INTEGER REFERENCES cpu_coolers(cooler_id),
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        price REAL NOT NULL
    );
    """
    cursor.executescript(schema)
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    create_database()
