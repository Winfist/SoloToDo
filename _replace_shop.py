import re

filepath = r'c:\Users\jwuck\OneDrive\Dokumente\SoloToDo\solo-leveling-v5.jsx'

with open(filepath, 'rb') as f:
    content = f.read()

# The diamond chars in this file are \xe2\x97\x86\xc2\x90  (◆ followed by \xc2\x90)
# Search for the SHOP section marker and GEM SHOP marker
start_pattern = b'SHOP '
shop_positions = []
pos = 0
while True:
    idx = content.find(start_pattern, pos)
    if idx == -1:
        break
    # Check context around the match
    context = content[max(0, idx-40):idx+40]
    shop_positions.append((idx, context))
    pos = idx + 1

print("All 'SHOP ' positions:")
for i, (p, ctx) in enumerate(shop_positions):
    print(f"  [{i}] pos={p}: ...{ctx[30:50]}...")

# Find the right markers by looking for the view === "shop" pattern
shop_view_start = content.find(b'view === "shop"')
gem_shop_view_start = content.find(b'view === "gem_shop"')

if shop_view_start == -1:
    print("ERROR: Could not find view === 'shop'")
    exit(1)
if gem_shop_view_start == -1:
    print("ERROR: Could not find view === 'gem_shop'")
    exit(1)

print(f"\nFound view === 'shop' at byte {shop_view_start}")
print(f"Found view === 'gem_shop' at byte {gem_shop_view_start}")

# Go back from view === "shop" to find the comment line start
# The comment is: {/* ◆◆◆ SHOP ◆◆◆ */}
# Find the '{' that starts the block before the comment
line_start = content.rfind(b'\n', 0, shop_view_start)
# Go back one more line to get the comment
comment_start = content.rfind(b'\n', 0, line_start)
# Go back one more to include the {/* marker line
marker_start = content.rfind(b'\n', 0, comment_start)

print(f"\nSection starts around byte {marker_start}")
print(f"Context: {content[marker_start:marker_start+80]}")

# Find the line start of the GEM SHOP section
gem_line_start = content.rfind(b'\n', 0, gem_shop_view_start)
gem_comment_start = content.rfind(b'\n', 0, gem_line_start)
gem_marker_start = content.rfind(b'\n', 0, gem_comment_start)

print(f"\nGEM SHOP section starts around byte {gem_marker_start}")
print(f"Context: {content[gem_marker_start:gem_marker_start+80]}")

# Build the replacement
# Preserve the line ending style (CRLF)
nl = b'\r\n'
indent = b'        '

replacement = (
    nl +
    indent + b'{/* SHOP */}' + nl +
    indent + b'{' + nl +
    indent + b'  view === "shop" && (' + nl +
    indent + b'    <GoldShopView' + nl +
    indent + b'      state={state} theme={theme}' + nl +
    indent + b'      SHOP_ITEMS={SHOP_ITEMS} HUNTER_CODEX={HUNTER_CODEX}' + nl +
    indent + b'      shopUnlocked={shopUnlocked} rank={rank}' + nl +
    indent + b'      getRankIndex={getRankIndex}' + nl +
    indent + b'      buyItem={buyItem} persist={persist}' + nl +
    indent + b'      notify={notify} can={can}' + nl +
    indent + b'      genId={genId} getToday={getToday}' + nl +
    indent + b'    />' + nl +
    indent + b'  )' + nl +
    indent + b'}' + nl
)

# Replace from marker_start to gem_marker_start
new_content = content[:marker_start] + replacement + content[gem_marker_start:]

with open(filepath, 'wb') as f:
    f.write(new_content)

print("\nSUCCESS: Shop section replaced with GoldShopView component")
old_size = gem_marker_start - marker_start
print(f"Replaced {old_size} bytes of inline code with {len(replacement)} bytes")
