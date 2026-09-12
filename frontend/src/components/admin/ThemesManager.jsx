import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeList from './ThemeList';
import CanvasEditor from '../../pages/admin/CanvasEditor';
import { isFeatureEnabled } from '../../utils/featureFlags';

function ThemesManager() {
  const navigate = useNavigate();
  const [selectedThemeId, setSelectedThemeId] = useState(null);

  // If feature flag is disabled, use old ThemeEditor
  const useCanvasEditor = isFeatureEnabled('CANVAS_THEMES');

  if (!useCanvasEditor) {
    // Fallback to old ThemeEditor if needed (not implemented in this version)
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Editor de Themes no disponible</h2>
        <p className="text-gray-600 mb-4">La funcionalidad Canvas Themes está deshabilitada.</p>
      </div>
    );
  }

  return (
    <div>
      {selectedThemeId ? (
        <CanvasEditor />
      ) : (
        <ThemeList onEditTheme={setSelectedThemeId} />
      )}
    </div>
  );
}

export default ThemesManager;