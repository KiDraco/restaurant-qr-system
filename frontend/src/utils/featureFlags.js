// Feature flags utility
// Centralized feature flag management for gradual rollouts

const FEATURE_FLAGS = {
  // Canvas-based theme editor (v2)
  CANVAS_THEMES: process.env.REACT_APP_FEATURE_CANVAS_THEMES === 'true',
};

export function isFeatureEnabled(flag) {
  return FEATURE_FLAGS[flag] ?? false;
}

export function getFeatureFlags() {
  return { ...FEATURE_FLAGS };
}

export default FEATURE_FLAGS;