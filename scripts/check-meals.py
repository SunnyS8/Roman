import sqlite3, os, sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

db = os.path.join(os.environ["USERPROFILE"], ".betsy", "betsy.db")
conn = sqlite3.connect(db)
cur = conn.cursor()

cur.execute("SELECT timestamp, topic, insight FROM knowledge WHERE topic='meal_log' ORDER BY timestamp DESC LIMIT 20")
rows = cur.fetchall()
print(f"Meal log entries: {len(rows)}")
for ts, topic, insight in rows:
    dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
    print(f"  {dt}: {insight[:150]}")

cur.execute("SELECT COUNT(*) FROM knowledge")
print(f"\nTotal knowledge entries: {cur.fetchone()[0]}")

cur.execute("SELECT topic, COUNT(*) FROM knowledge GROUP BY topic ORDER BY COUNT(*) DESC")
print("\nKnowledge topics:")
for topic, count in cur.fetchall():
    print(f"  {topic}: {count}")

conn.close()
