import {
  ACHIEVEMENTS,
  CATEGORIES,
  DIFFICULTIES,
  GEM_SHOP_ITEMS,
  NAMED_SHADOWS,
  SHADOW_CLASSES,
  SHADOW_TIERS,
  SHOP_ITEMS,
  SKILLS,
} from "./gameData.js";
import { getLocaleObject, resolveLocale } from "./i18n.js";

export const GEM_CATEGORY_KEYS = [
  { key: "transition", icon: "FX", color: "#c084fc" },
  { key: "all", icon: "G", color: "#a855f7" },
  { key: "booster", icon: "B", color: "#f59e0b" },
  { key: "theme", icon: "T", color: "#06b6d4" },
  { key: "title", icon: "R", color: "#ef4444" },
  { key: "cosmetic", icon: "C", color: "#6366f1" },
  { key: "convenience", icon: "U", color: "#22c55e" },
];

function getCatalog(localeOrMode) {
  return getLocaleObject(resolveLocale(localeOrMode))?.catalog || {};
}

function getOverride(table, item, keyField = "id") {
  const key = item?.[keyField] || item?.key;
  return key ? table?.[key] : null;
}

function mergeCatalogItem(item, table, keyField = "id") {
  const override = getOverride(table, item, keyField);
  if (!override) return item;
  return {
    ...item,
    ...override,
    reward: item.reward,
    check: item.check,
    effect: item.effect,
    icon: item.icon,
    iconSrc: item.iconSrc,
  };
}

function mergeArray(items, table, keyField = "id") {
  return (items || []).map(item => mergeCatalogItem(item, table, keyField));
}

function mergeObject(source, table) {
  return Object.fromEntries(Object.entries(source || {}).map(([key, value]) => {
    const override = table?.[key] || {};
    return [key, { ...value, ...override }];
  }));
}

function mergeNamedShadows(source, table) {
  return Object.fromEntries(Object.entries(source || {}).map(([key, value]) => {
    const override = table?.[key] || {};
    return [key, {
      ...value,
      ...override,
      unlockCondition: { ...(value.unlockCondition || {}), ...(override.unlockCondition || {}) },
      uniqueAbility: { ...(value.uniqueAbility || {}), ...(override.uniqueAbility || {}) },
    }];
  }));
}

export function getGemCategories(localeOrMode = "auto") {
  const labels = getLocaleObject(resolveLocale(localeOrMode))?.shop?.categories || {};
  return GEM_CATEGORY_KEYS.map(category => ({
    ...category,
    label: labels[category.key] || category.key,
  }));
}

export function getLocalizedCatalog(localeOrMode = "auto") {
  const catalog = getCatalog(localeOrMode);
  return {
    categories: mergeArray(CATEGORIES, catalog.categories, "key"),
    difficulties: mergeArray(DIFFICULTIES, catalog.difficulties, "key"),
    achievements: mergeArray(ACHIEVEMENTS, catalog.achievements, "id"),
    skills: mergeArray(SKILLS, catalog.skills, "id"),
    shopItems: mergeArray(SHOP_ITEMS, catalog.shopItems, "id"),
    gemShopItems: mergeArray(GEM_SHOP_ITEMS, catalog.gemShopItems, "id"),
    shadowClasses: mergeObject(SHADOW_CLASSES, catalog.shadowClasses),
    shadowTiers: mergeObject(SHADOW_TIERS, catalog.shadowTiers),
    namedShadows: mergeNamedShadows(NAMED_SHADOWS, catalog.namedShadows),
  };
}

export function getCategoryLabel(categoryKey, localeOrMode = "auto", variant = "label") {
  const category = getLocalizedCatalog(localeOrMode).categories.find(item => item.key === categoryKey);
  return category?.[variant] || category?.label || categoryKey;
}

export function getDifficultyLabel(difficultyKey, localeOrMode = "auto") {
  const difficulty = getLocalizedCatalog(localeOrMode).difficulties.find(item => item.key === difficultyKey);
  return difficulty?.label || difficultyKey;
}

export function localizeCatalogItems(items = [], kind, localeOrMode = "auto") {
  const catalog = getLocalizedCatalog(localeOrMode);
  const table = {
    categories: catalog.categories,
    difficulties: catalog.difficulties,
    achievements: catalog.achievements,
    skills: catalog.skills,
    shopItems: catalog.shopItems,
    gemShopItems: catalog.gemShopItems,
  }[kind] || [];
  return (items || []).map(item => table.find(entry => entry.id === item.id || entry.key === item.key) || item);
}
