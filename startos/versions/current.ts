import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:3',
  releaseNotes: {
    en_US:
      'Initial Start9 Community Registry release. Hardened scheduling and health reporting, a safe no-op default configuration, and a new dry-run policy preview action.',
    es_ES:
      'Primera versión en el Registro Comunitario de Start9. Programación e informes de estado reforzados, configuración predeterminada segura sin efectos y una nueva acción de vista previa de políticas en modo de prueba.',
    de_DE:
      'Erste Veröffentlichung im Start9 Community-Register. Robustere Zeitplanung und Statusberichte, eine sichere No-Op-Standardkonfiguration und eine neue Aktion zur Richtlinien-Vorschau im Probelauf.',
    pl_PL:
      'Pierwsze wydanie w Rejestrze Społeczności Start9. Wzmocnione harmonogramowanie i raportowanie stanu, bezpieczna domyślna konfiguracja bez działań oraz nowa akcja podglądu polityk w trybie próbnym.',
    fr_FR:
      "Première publication sur le registre communautaire Start9. Planification et rapports d'état renforcés, configuration par défaut sans effet et nouvelle action d'aperçu des politiques en mode simulation.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
