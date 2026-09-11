import React, { useState } from 'react';
import ThemeList from './ThemeList';
import ThemeEditor from './ThemeEditor';

function ThemesManager() {
  const [selectedThemeId, setSelectedThemeId] = useState(null);

  return (
    <div>
      {selectedThemeId ? (
        <ThemeEditor
          themeId={selectedThemeId}
          onBack={() => setSelectedThemeId(null)}
        />
      ) : (
        <ThemeList onEditTheme={setSelectedThemeId} />
      )}
    </div>
  );
}

export default ThemesManager;