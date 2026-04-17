export interface Mail {
  id: string
  from: string
  subject: string
  date: string
  read: boolean
  folder: 'inbox' | 'sent' | 'deleted'
  body: string
  to?: string
  previewImage?: string
  previewImageAlt?: string
}

export const mails: Mail[] = [
  {
    id: '1',
    from: 'Sophie Martin',
    subject: 'Opportunité — Développeur Frontend React',
    date: '18/04/2026 09:12',
    read: false,
    folder: 'inbox',
    to: 'terry.barillon@portfolio.dev',
    body: `Bonjour Terry,

Je suis responsable du recrutement chez TechCorp. Votre profil m'a beaucoup impressionné, notamment vos projets TS-Mock-API et GracefulErrors.

Nous recherchons un développeur Frontend React pour rejoindre notre équipe produit. Le poste est basé à Paris, avec possibilité de télétravail à 3 jours par semaine.

Seriez-vous disponible pour un échange cette semaine ?

Cordialement,
Sophie Martin
TechCorp — Responsable RH`,
  },
  {
    id: '2',
    from: 'GitHub Notifications',
    subject: '[ts-mock-api] 3 new stars on your repository',
    date: '17/04/2026 14:35',
    read: false,
    folder: 'inbox',
    to: 'terry.barillon@portfolio.dev',
    body: `Hello Many0nne,

Your repository ts-mock-api received 3 new stars today!

Contributors are also interested in your work:
  @dev_alice starred your repository
  @backend_bob starred your repository
  @fullstack_carol starred your repository

Keep up the great work!

— The GitHub Team`,
  },
  {
    id: '3',
    from: 'Lucas Dupont',
    subject: 'Retour sur ta présentation TypeScript',
    date: '16/04/2026 18:22',
    read: true,
    folder: 'inbox',
    to: 'terry.barillon@portfolio.dev',
    body: `Hey Terry,

Super présentation hier sur TypeScript ! Les exemples avec les génériques étaient vraiment clairs, tout le monde a bien accroché.

J'avais une question sur le pattern que tu utilisais pour les erreurs typées — tu pourrais me partager les slides ?

À +,
Lucas`,
  },
  {
    id: '4',
    from: 'Microsoft Exchange',
    subject: 'Bienvenue dans Microsoft Exchange !',
    date: '01/01/2026 00:00',
    read: true,
    folder: 'inbox',
    to: 'terry.barillon@portfolio.dev',
    body: `Bienvenue dans Microsoft Exchange et dans l'univers de la messagerie électronique.

La messagerie électronique est un moyen rapide et efficace de communiquer avec les autres. Il existe de nombreux systèmes de messagerie différents. Vous pouvez utiliser Microsoft Exchange avec ces systèmes comme une boîte de réception universelle pour :

  • Recevoir des messages des autres utilisateurs
  • Envoyer des messages aux autres utilisateurs
  • Organiser vos messages en dossiers
  • Répondre et transférer des messages

Nous espérons que vous apprécierez l'utilisation de Microsoft Exchange.

— L'équipe Microsoft Exchange`,
  },
  {
    id: '5',
    from: 'terry.barillon@portfolio.dev',
    subject: 'RE: Opportunité — Développeur Frontend React',
    date: '18/04/2026 11:30',
    read: true,
    folder: 'sent',
    to: 'sophie.martin@techcorp.fr',
    body: `Bonjour Sophie,

Merci pour votre message, je suis effectivement très intéressé par cette opportunité !

Je suis disponible jeudi ou vendredi cette semaine pour un premier échange. Mon portfolio est également disponible si vous souhaitez en apprendre plus sur mes projets et ma façon de travailler.

Dans l'attente de votre réponse,
Terry Barillon`,
  },
  {
    id: '6',
    from: 'terry.barillon@portfolio.dev',
    subject: 'RE: Retour sur ta présentation TypeScript',
    date: '16/04/2026 20:05',
    read: true,
    folder: 'sent',
    to: 'lucas.dupont@email.fr',
    body: `Hey Lucas,

Content que ça t'ait plu ! Je t'envoie les slides par mail séparé.

Pour le pattern d'erreurs typées, j'ai justement créé une lib open-source là-dessus : GracefulErrors. Tu peux la trouver directement sur mon GitHub !

@+,
Terry`,
  },
  {
    id: '7',
    from: 'promo@super-newsletter.com',
    subject: 'Offre spéciale — 90% de réduction !!!',
    date: '15/04/2026 08:00',
    read: true,
    folder: 'deleted',
    to: 'terry.barillon@portfolio.dev',
    body: `OFFRE LIMITÉE !!!

Profitez de notre offre exceptionnelle à -90% sur tous nos produits !
Cliquez ici pour en savoir plus !

Félicitations, vous avez été sélectionné parmi des milliers de participants...

[Ce message a été déplacé dans les éléments supprimés]`,
  },
  {
    id: '8',
    from: 'E',
    subject: 'Viens sur mon île',
    date: '14/04/2026 19:42',
    read: true,
    folder: 'deleted',
    to: 'terry.barillon@portfolio.dev',
    previewImage: '/img/pixelated-image.jpg',
    previewImageAlt: 'Aperçu pixelisé de l’île de E',
    body: `Salut Terry,

Je voulais te proposer de venir sur mon île ce week-end. J’ai refait toute la zone du port et j’ai installé un coin détente avec vue sur la mer.

J’ai aussi laissé une petite surprise près de la place centrale. Si tu es disponible, passe quand tu veux.

À bientôt,
E

[Ce message a été déplacé dans les éléments supprimés]`,
  },
]
