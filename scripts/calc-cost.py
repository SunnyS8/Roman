import re, os

log = os.path.join(os.environ["USERPROFILE"], ".betsy", "bot.log")
with open(log, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

matches = re.findall(r'"promptTokens":(\d+).*?"completionTokens":(\d+)', content)
total_p = sum(int(m[0]) for m in matches)
total_c = sum(int(m[1]) for m in matches)
count = len(matches)

print(f"Total LLM calls: {count}")
print(f"Prompt tokens:   {total_p:,}")
print(f"Completion tokens: {total_c:,}")
print(f"Total tokens:    {total_p+total_c:,}")
print()

# Gemini 2.5 Flash pricing (OpenRouter)
in_cost = total_p * 0.075 / 1_000_000
out_cost = total_c * 0.30 / 1_000_000
cached_cost = total_p * 0.01875 / 1_000_000  # if cached
total_cost = in_cost + out_cost
total_cached = cached_cost + out_cost

print(f"Gemini 2.5 Flash (OpenRouter):")
print(f"  Input:   ${in_cost:.4f} ({total_p} tok x $0.075/M)")
print(f"  Output:  ${out_cost:.4f} ({total_c} tok x $0.30/M)")
print(f"  Total:   ${total_cost:.4f}")
print(f"  (cached: ${total_cached:.4f})")
print()
print(f"Estimated total spent on LLM: ~${total_cost:.2f}")
