import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:4',
  releaseNotes: {
    en_US: 'Improved Preview Policies UI layout and fixed workflow to accurately display fee diffs.',
    es_ES: 'Mejorado el diseño de la interfaz de Vista Previa de Políticas y corregido el flujo para mostrar correctamente los cambios de tarifas.',
    de_DE: 'Verbessertes UI-Layout der Richtlinien-Vorschau und Workflow korrigiert, um Gebührenänderungen korrekt anzuzeigen.',
    pl_PL: 'Ulepszono układ interfejsu podglądu polityk i naprawiono przepływ pracy, aby poprawnie wyświetlać zmiany opłat.',
    fr_FR: 'Amélioration de l\'interface de l\'aperçu des politiques et correction du flux pour afficher correctement les modifications de frais.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})