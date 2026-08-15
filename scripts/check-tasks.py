import sqlite3, os, sys

sys.stdout.reconfigure(encoding='utf-8')

db = os.path.join(os.environ["USERPROFILE"], ".betsy", "betsy.db")
conn = sqlite3.connect(db)
cur = conn.cursor()

cur.execute("SELECT * FROM scheduled_tasks")
cols = [d[0] for d in cur.description]
rows = cur.fetchall()
print(f"Total scheduled tasks: {len(rows)}")
for r in rows:
    d = dict(zip(cols, r))
    print("---")
    for k, v in d.items():
        if isinstance(v, str):
            v = v.encode('utf-8', errors='replace').decode('utf-8')
        print(f"  {k}: {str(v)[:300]}")

conn.close()
