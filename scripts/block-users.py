import sqlite3, os

db = os.path.join(os.environ["USERPROFILE"], ".betsy", "betsy.db")
conn = sqlite3.connect(db)
cur = conn.cursor()

# Delete all non-owner subscriptions
cur.execute("DELETE FROM subscriptions WHERE user_id != '411711275'")
print(f"Deleted {cur.rowcount} non-owner subscriptions")

# Verify
cur.execute("SELECT * FROM subscriptions")
rows = cur.fetchall()
for r in rows:
    print("Remaining:", r)

conn.commit()
conn.close()
