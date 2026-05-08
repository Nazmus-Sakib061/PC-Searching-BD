import sqlite3

def simplify_db():
    conn = sqlite3.connect('pc_builder_db.sqlite')
    cursor = conn.cursor()

    # Drop price_history and retailers as they aren't needed for lean model
    cursor.execute("DROP TABLE IF EXISTS price_history")
    cursor.execute("DROP TABLE IF EXISTS retailers")
    
    # Ensure components table has a unique name/retailer constraint if needed, 
    # but for now we focus on simply updating the price column
    cursor.execute("UPDATE components SET price = 0") # Reset prices for clean start
    
    conn.commit()
    conn.close()
    print("Database simplified for real-time only data.")

if __name__ == '__main__':
    simplify_db()
