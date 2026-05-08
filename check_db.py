import sqlite3

def check_data():
    conn = sqlite3.connect('pc_builder_db.sqlite')
    cursor = conn.cursor()
    
    print("--- CPU Data in Database ---")
    cursor.execute("SELECT name, brand, price FROM cpus")
    rows = cursor.fetchall()
    
    if not rows:
        print("No data found in cpus table.")
    else:
        for row in rows:
            print(f"Name: {row[0]}, Brand: {row[1]}, Price: {row[2]}")
            
    conn.close()

if __name__ == '__main__':
    check_data()
