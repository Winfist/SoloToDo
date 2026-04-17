import os

filepath = r'c:\Users\jwuck\OneDrive\Dokumente\SoloToDo\solo-leveling-v5.jsx'
with open(filepath, 'rb') as f:
    c = f.read()

# 1. Update imports
c = c.replace(b'import GemShopView from "./components/GemShopView.jsx";\r\n', b'')
if b'import UnifiedShopView from "./components/UnifiedShopView.jsx";\r\n' not in c:
    import_idx = c.find(b'import ')
    c = c[:import_idx] + b'import UnifiedShopView from "./components/UnifiedShopView.jsx";\r\n' + c[import_idx:]

# 2. Update arrays
c = c.replace(b'"gem_shop", ', b'')
c = c.replace(b'gem_shop: "gem_shop", ', b'')

# 3. Replace gem header button
old_gem_btn = b'<button onClick={() => navigateTo("gem_shop")} style={{ display: "flex"'
new_gem_btn = b'<button onClick={() => { window.__SHOP_START_TAB = "gems"; navigateTo("shop"); }} style={{ display: "flex"'
c = c.replace(old_gem_btn, new_gem_btn)

# 4. Replace gold header button
gold_div_start = c.find(b'<div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 10px", borderRadius: 8, background: "rgba(251,191,36,0.06)"')
if gold_div_start != -1:
    style_pos = c.find(b'style={{', gold_div_start)
    c = c[:style_pos] + b'onClick={() => { window.__SHOP_START_TAB = "gold"; navigateTo("shop"); }} style={{ cursor: "pointer", ' + c[style_pos+9:]

# 5. Replace shop rendering
# Look for view === "shop" and view === "gem_shop" using Regex or find.
shop_start = c.find(b'view === "shop" && (')
analytics_start = c.find(b'view === "analytics" && (')

if shop_start != -1 and analytics_start != -1:
    # Find the `{/*` marker before shop_start
    comment_marker = c.rfind(b'{/*', 0, shop_start)
    # Find the `{/*` marker before analytics_start
    analytics_marker = c.rfind(b'{/*', 0, analytics_start)
    
    # We replace from comment_marker to analytics_marker
    replacement = b"""{/* UNIFIED DESIGN SHOP */}
        {
          view === "shop" && (
            <UnifiedShopView
              state={state} theme={theme}
              SHOP_ITEMS={SHOP_ITEMS} HUNTER_CODEX={HUNTER_CODEX}
              GEM_SHOP_ITEMS={GEM_SHOP_ITEMS}
              shopUnlocked={shopUnlocked} rank={rank}
              getRankIndex={getRankIndex}
              buyItem={buyItem} buyGemItem={buyGemItem}
              persist={persist} notify={notify} can={can}
              genId={genId} getToday={getToday}
              watchRewardedAd={watchRewardedAd}
              claimDailyGemBonus={claimDailyGemBonus}
              getActiveGemBoosters={getActiveGemBoosters}
              onWatchAd={() => setShowAdModal(true)}
            />
          )
        }

        """
    c = c[:comment_marker] + replacement + c[analytics_marker:]

with open(filepath, 'wb') as f:
    f.write(c)

print('Updated successfully')
