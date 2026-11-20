import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:11',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.2 or later. The package now verifies that the charge-lnd source it builds is the exact v0.3.1 release commit.',
    es_ES:
      'Requiere StartOS 0.4.2 o posterior. El paquete ahora verifica que el código fuente de charge-lnd que compila es exactamente el commit de la versión v0.3.1.',
    de_DE:
      'Erfordert StartOS 0.4.2 oder neuer. Das Paket prüft jetzt, dass der gebaute charge-lnd-Quellcode genau dem Release-Commit von v0.3.1 entspricht.',
    pl_PL:
      'Wymaga StartOS 0.4.2 lub nowszego. Pakiet sprawdza teraz, czy budowany kod źródłowy charge-lnd to dokładnie commit wydania v0.3.1.',
    fr_FR:
      'Nécessite StartOS 0.4.2 ou ultérieur. Le paquet vérifie désormais que le code source de charge-lnd qu’il compile correspond exactement au commit de la version v0.3.1.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
