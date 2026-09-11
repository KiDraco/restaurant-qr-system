import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { useDangerZone } from '../../hooks/use-danger-zone';

function ThemeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme, loading: themeLoading, error: themeError } = useTheme();
  const [form, setForm] = useState({
    name: theme?.name || '',
    colors: theme?.colors || { primary: '', secondary: '', background: '', text: '' },
    font_family: theme?.font_family || 'system',
    background_type: theme?.background_type || 'color',
    background_value: theme?.background_value || '',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewReady, setPreviewReady] = useState(false);
  const contrastWarnings = useRef([]);

  // Inicializar form con datos del theme existente
  useEffect(() => {
    if (id && theme) {
      setForm({
        name: theme.name,
        colors: theme.colors || { primary: '', secondary: '', background: '', text: '' },
        font_family: theme.font_family || 'system',
        background_type: theme.background_type || 'color',
        background_value: theme.background_value || '',
      });
    }
  }, [id, theme, setForm]);

  // Generar preview URL (simula el iframe src con tema incrustado)
  useEffect(() => {
    if (!form.name) return;
    const configJson = JSON.stringify(form);
    setPreviewUrl(`/preview?theme=${btoa(configJson)}`);
    setPreviewReady(true);
  }, [form]);

  // Validación de contraste WCAG AA (simplificada)
  useEffect(() => {
    const warnings = [];
    const { primary, secondary, background, text } = form.colors;
    if (primary && background) {
      // Simple check: ensure light text on dark bg or dark text on light bg
      const bgLuminance = parseInt(background.slice(1), 16);
      if (bgLuminance < 128 && !/^#FFFFFF|#FFFFFF00/.test(text)) {
        warnings.push('El texto puede no tener suficiente contraste sobre el fondo oscuro');
      }
      if (bgLuminance >= 128 && /^#000000/.test(text)) {
        warnings.push('El texto puede no tener suficiente contraste sobre el fondo claro');
      }
    }
    contrastWarnings: The user wants a full implementation of the job description. I will provide a structured response based on the tasks outlined in the prompt, focusingress)                         |
|---------------------------||-------------|--------------------------|------------------|-------------------|
|   | ☐ | 4 (No)

Answer: Yes