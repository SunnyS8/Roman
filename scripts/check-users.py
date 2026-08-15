import sqlite3, os, sys

db = os.path.join(os.environ["USERPROFILE"], ".betsy", "betsy.db")
conn = sqlite3.connect(db)
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", [r[0] for r in cur.fetchall()])

for table in ["subscriptions", "daily_usage"]:
    try:
        cur.execute(f"SELECT * FROM {table}")
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        print(f"\n=== {table} ===")
        if not rows:
            print("(empty)")
        for r in rows:
            print(dict(zip(cols, r)))
    except Exception as e:
        print(f"{table}: {e}")

conn.close()
