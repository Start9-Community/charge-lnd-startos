import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:9',
  releaseNotes: {
    en_US: `Keeps the LND connection working when LND changes how it serves TLS.

charge-lnd resolved LND's address from a field that is only populated for one of the two ways a service can publish a port. It now reads the address itself, which is correct either way — so the connection survives LND's next update instead of going unreachable.

- Preview Policies shows charge-lnd's dry-run output in a copyable text box.
- The Fee Policies field's description points to the upstream policy format and says that a configuration that does not parse is not saved.`,
    es_ES: `Mantiene la conexión con LND cuando LND cambia su forma de servir TLS.

charge-lnd resolvía la dirección de LND a partir de un campo que solo se rellena en una de las dos formas en que un servicio puede publicar un puerto. Ahora lee la dirección en sí, que es correcta en ambos casos, así que la conexión sobrevive a la próxima actualización de LND en lugar de quedar inaccesible.

- Vista previa de políticas muestra la salida de la prueba de charge-lnd en un cuadro de texto que se puede copiar.
- La descripción del campo Políticas de tarifas remite al formato de políticas de upstream e indica que no se guarda una configuración que no se pueda analizar.`,
    de_DE: `Hält die LND-Verbindung aufrecht, wenn LND die Art der TLS-Bereitstellung ändert.

charge-lnd ermittelte die Adresse von LND aus einem Feld, das nur bei einer der beiden Arten gefüllt ist, auf die ein Dienst einen Port veröffentlichen kann. Jetzt wird die Adresse selbst gelesen, die in beiden Fällen stimmt — die Verbindung übersteht damit das nächste LND-Update, statt unerreichbar zu werden.

- Die Richtlinien-Vorschau zeigt die Ausgabe des Probelaufs von charge-lnd in einem kopierbaren Textfeld.
- Die Beschreibung des Felds Gebührenrichtlinien verweist auf das Upstream-Richtlinienformat und gibt an, dass eine Konfiguration, die sich nicht einlesen lässt, nicht gespeichert wird.`,
    pl_PL: `Utrzymuje połączenie z LND, gdy LND zmienia sposób udostępniania TLS.

charge-lnd ustalał adres LND na podstawie pola wypełnianego tylko przy jednym z dwóch sposobów publikowania portu przez usługę. Teraz odczytuje sam adres, poprawny w obu przypadkach — dzięki temu połączenie przetrwa kolejną aktualizację LND, zamiast stać się nieosiągalne.

- Podgląd polityk pokazuje wynik próbnego uruchomienia charge-lnd w polu tekstowym, które można skopiować.
- Opis pola Polityki opłat odsyła do formatu polityk upstream i informuje, że konfiguracja, której nie da się przetworzyć, nie jest zapisywana.`,
    fr_FR: `Maintient la connexion à LND lorsque LND change sa façon de servir TLS.

charge-lnd déterminait l'adresse de LND à partir d'un champ renseigné dans un seul des deux modes de publication d'un port par un service. Il lit désormais l'adresse elle-même, correcte dans les deux cas — la connexion survit donc à la prochaine mise à jour de LND au lieu de devenir injoignable.

- L'aperçu des politiques affiche la sortie de la simulation de charge-lnd dans une zone de texte copiable.
- La description du champ Politiques de frais renvoie au format de politiques upstream et indique qu'une configuration qui ne peut pas être analysée n'est pas enregistrée.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
