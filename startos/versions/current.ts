import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:10',
  releaseNotes: {
    en_US:
      "Requires StartOS 0.4.1 or later. charge-lnd now reads only LND's TLS certificate and admin macaroon, and can no longer read LND's seed or other files. Requires LND 0.21.6-beta:3 or later.",
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. charge-lnd ahora lee solo el certificado TLS y el macaroon de administrador de LND, y ya no puede leer la semilla ni otros archivos de LND. Requiere LND 0.21.6-beta:3 o posterior.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. charge-lnd liest jetzt nur noch das TLS-Zertifikat und das Admin-Macaroon von LND und kann den Seed und andere Dateien von LND nicht mehr lesen. Erfordert LND 0.21.6-beta:3 oder neuer.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. charge-lnd odczytuje teraz tylko certyfikat TLS i macaroon administratora LND i nie może już odczytać seeda ani innych plików LND. Wymaga LND 0.21.6-beta:3 lub nowszego.',
    fr_FR:
      'Nécessite StartOS 0.4.1 ou ultérieur. charge-lnd ne lit désormais que le certificat TLS et le macaron administrateur de LND, et ne peut plus lire la seed ni les autres fichiers de LND. Nécessite LND 0.21.6-beta:3 ou ultérieur.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
