-- Table for CPU (Processors)
CREATE TABLE cpus (
    cpu_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    socket_type VARCHAR(50) NOT NULL, -- e.g., 'LGA1700', 'AM5'
    cores INT,
    threads INT,
    base_clock_ghz DECIMAL(4, 2),
    boost_clock_ghz DECIMAL(4, 2),
    tdps INT, -- Thermal Design Power in Watts, for PSU calculation
    integrated_graphics_support BOOLEAN DEFAULT FALSE,
    release_date DATE,
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for Motherboards
CREATE TABLE motherboards (
    motherboard_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    chipset VARCHAR(100),
    form_factor VARCHAR(50) NOT NULL, -- e.g., 'ATX', 'Micro-ATX', 'Mini-ITX'
    compatible_cpu_sockets JSONB, -- Stores an array of compatible CPU socket types, e.g., '["LGA1700"]'
    ram_type VARCHAR(20) NOT NULL, -- e.g., 'DDR4', 'DDR5'
    ram_slots_count INT NOT NULL,
    max_ram_capacity_gb INT,
    max_ram_speed_mhz INT, -- Maximum supported RAM speed
    pcie_slots_config JSONB, -- JSON array describing PCIe slots, e.g., '[{"version": "PCIe 5.0", "lanes": "x16"}, {"version": "PCIe 4.0", "lanes": "x4"}]'
    m2_slots_count INT DEFAULT 0,
    sata_ports_count INT DEFAULT 0,
    has_wifi BOOLEAN DEFAULT FALSE,
    has_bluetooth BOOLEAN DEFAULT FALSE,
    release_date DATE,
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for RAM (Memory Modules)
CREATE TABLE rams (
    ram_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    type VARCHAR(20) NOT NULL, -- e.g., 'DDR4', 'DDR5'
    speed_mhz INT NOT NULL,
    capacity_gb INT NOT NULL, -- Capacity of a single module
    form_factor VARCHAR(50) NOT NULL, -- e.g., 'DIMM', 'SO-DIMM'
    latency VARCHAR(20), -- e.g., 'CL16-18-18-38'
    modules_in_kit INT DEFAULT 1, -- Number of modules in this kit (e.g., 2 for a dual-channel kit)
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for GPUs (Graphics Cards)
CREATE TABLE gpus (
    gpu_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    vram_gb INT,
    vram_type VARCHAR(20), -- e.g., 'GDDR6', 'GDDR6X'
    pcie_version VARCHAR(20) NOT NULL, -- e.g., 'PCIe 4.0', 'PCIe 5.0'
    power_connectors_required JSONB, -- e.g., '["8-pin", "8-pin"]' or '["12VHPWR"]'
    power_consumption_w INT, -- Estimated power consumption in Watts
    form_factor_length_mm INT,
    form_factor_height_slots INT, -- e.g., 2, 3
    width_mm INT,
    release_date DATE,
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for Storage Devices (SSD, HDD)
CREATE TABLE storage_devices (
    storage_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    storage_type VARCHAR(50) NOT NULL, -- e.g., 'SATA SSD', 'NVMe SSD', 'HDD'
    interface VARCHAR(50) NOT NULL, -- e.g., 'SATA', 'NVMe PCIe', 'SATA III'
    form_factor VARCHAR(50) NOT NULL, -- e.g., '2.5"', 'M.2', '3.5"'
    capacity_gb INT NOT NULL,
    read_speed_mbps INT,
    write_speed_mbps INT,
    release_date DATE,
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for Power Supply Units (PSUs)
CREATE TABLE psus (
    psu_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    wattage_w INT NOT NULL,
    efficiency_rating VARCHAR(50), -- e.g., '80 Plus Bronze', '80 Plus Gold'
    form_factor VARCHAR(50) NOT NULL, -- e.g., 'ATX', 'SFX'
    modularity VARCHAR(50), -- e.g., 'Full', 'Semi', 'Non-Modular'
    cpu_connectors_count INT DEFAULT 0,
    pcie_connectors_count INT DEFAULT 0, -- Total number of 6+2 pin or 8-pin PCIe connectors
    sata_connectors_count INT DEFAULT 0,
    release_date DATE,
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for PC Cases
CREATE TABLE pc_cases (
    case_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    form_factor VARCHAR(50) NOT NULL, -- Describes the primary form factor it supports, e.g. 'ATX Mid-Tower'
    supported_motherboard_form_factors JSONB, -- e.g., '["ATX", "Micro-ATX", "Mini-ITX"]'
    max_gpu_length_mm INT,
    max_cpu_cooler_height_mm INT,
    drive_bays_3_5_inch_count INT DEFAULT 0,
    drive_bays_2_5_inch_count INT DEFAULT 0,
    radiator_support JSONB, -- e.g., '["120mm", "240mm", "360mm"]'
    release_date DATE,
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for CPU Coolers
CREATE TABLE cpu_coolers (
    cooler_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    cooler_type VARCHAR(50) NOT NULL, -- e.g., 'Air', 'AIO Liquid'
    compatible_sockets JSONB, -- e.g., '["LGA1700", "AM5", "AM4"]'
    max_tdp_support_w INT, -- For Air coolers, max TDP they can handle
    radiator_size_mm INT, -- For AIOs, e.g., 120, 240, 360
    fan_size_mm INT, -- For AIOs, the size of the fan
    height_mm INT, -- For Air coolers, height
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Table for Peripherals (Monitors, Keyboards, Mice etc.)
CREATE TABLE peripherals (
    peripheral_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    peripheral_type VARCHAR(50) NOT NULL, -- e.g., 'Monitor', 'Keyboard', 'Mouse', 'Webcam'
    connection_type VARCHAR(50), -- e.g., 'HDMI', 'DisplayPort', 'USB', 'Wireless'
    -- Specific fields for each type could be added here or in separate tables if complex
    -- Monitor specific: resolution, refresh_rate_hz, panel_type, screen_size_inch
    -- Keyboard specific: switch_type, layout, wired_wireless
    -- Mouse specific: dpi, wired_wireless
    release_date DATE,
    price DECIMAL(10, 2),
    manufacturer_url TEXT
);

-- Generic table to hold all hardware components, enabling easier joins for builds
CREATE TABLE components (
    component_id SERIAL PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL, -- e.g., 'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'Monitor', 'Keyboard', 'Mouse'
    -- Foreign keys to specific component tables. Using nullable FKs.
    cpu_id INT REFERENCES cpus(cpu_id),
    gpu_id INT REFERENCES gpus(gpu_id),
    motherboard_id INT REFERENCES motherboards(motherboard_id),
    ram_id INT REFERENCES rams(ram_id),
    storage_id INT REFERENCES storage_devices(storage_id),
    psu_id INT REFERENCES psus(psu_id),
    case_id INT REFERENCES pc_cases(case_id),
    cooler_id INT REFERENCES cpu_coolers(cooler_id),
    peripheral_id INT REFERENCES peripherals(peripheral_id),
    -- Common fields for display/filtering if needed
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    UNIQUE(cpu_id, gpu_id, motherboard_id, ram_id, storage_id, psu_id, case_id, cooler_id, peripheral_id)
);

-- Table for User Accounts
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store hashed passwords, NEVER plain text
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Saved Builds
CREATE TABLE saved_builds (
    build_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    build_name VARCHAR(255) NOT NULL,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table to link components to saved builds
CREATE TABLE build_components (
    build_component_id SERIAL PRIMARY KEY,
    build_id INT NOT NULL REFERENCES saved_builds(build_id) ON DELETE CASCADE,
    component_id INT NOT NULL REFERENCES components(component_id), -- References the generic 'components' table
    quantity INT NOT NULL DEFAULT 1,
    UNIQUE(build_id, component_id)
);