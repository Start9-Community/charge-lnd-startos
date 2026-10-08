import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:9',
  releaseNotes: {
    en_US: `- Preview Policies shows charge-lnd's dry-run output in a copyable text box.
- The Fee Policies field's description points to the upstream policy format and says that a configuration that does not parse is not saved.`,
    es_ES: `- Vista previa de políticas muestra la salida de la prueba de charge-lnd en un cuadro de texto que se puede copiar.
- La descripción del campo Políticas de tarifas remite al formato de políticas de upstream e indica que no se guarda una configuración que no se pueda analizar.`,
    de_DE: `- Die Richtlinien-Vorschau zeigt die Ausgabe des Probelaufs von charge-lnd in einem kopierbaren Textfeld.
- Die Beschreibung des Felds Gebührenrichtlinien verweist auf das Upstream-Richtlinienformat und gibt an, dass eine Konfiguration, die sich nicht einlesen lässt, nicht gespeichert wird.`,
    pl_PL: `- Podgląd polityk pokazuje wynik próbnego uruchomienia charge-lnd w polu tekstowym, które można skopiować.
- Opis pola Polityki opłat odsyła do formatu polityk upstream i informuje, że konfiguracja, której nie da się przetworzyć, nie jest zapisywana.`,
    fr_FR: `- L'aperçu des politiques affiche la sortie de la simulation de charge-lnd dans une zone de texte copiable.
- La description du champ Politiques de frais renvoie au format de politiques upstream et indique qu'une configuration qui ne peut pas être analysée n'est pas enregistrée.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
