export type BlocDocument =
  | { type: "paragraphe"; texte: string }
  | { type: "article"; numero: number; texte: string }
  | { type: "signature"; texte: string };

export const REGLEMENT_INTERIEUR: {
  titre: string;
  sousTitre: string;
  preambule: string[];
  articles: { numero: number; texte: string }[];
  signature: string;
} = {
  titre: "Règlement Intérieur des Cours Bibliques",
  sousTitre: "Église du Christianisme Céleste — Saint Siège Porto-Novo — Diocèse du Bénin",
  preambule: [
    "« Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit », tel est l'apostolat dont les douze furent les premiers mandataires dans les temps anciens, selon Matthieu 28 verset 19, repris dans Marc 16 verset 15-16, et qui nous est échu, nous chrétiens des temps modernes.",
    "Cette mission reste l'unique et véritable voie de la rédemption du pécheur par la foi en Jésus-Christ, qui par amour s'est offert en guise de victime expiatoire pour le salut humanitaire par le biais de la Parole.",
    "Née à Dahomey, actuel Bénin, le 29 septembre 1947 et fondée par le Prophète Pasteur Samuel Biléou Joseph OSHIFFA sur ordre divin, l'Église du Christianisme Céleste, dite la dernière barque, n'est pas en marge de cette mission.",
    "Amorcée très tôt par le Prophète Pasteur Fondateur lui-même, c'est à Papa Benoît D. AGBAOSSI que le gouvernail sera confié. Celui-ci se chargera d'entériner et de redorer le blason de l'évangélisation dans cette église souvent taxée de congrégation qui ne considère que les travaux spirituels au détriment de la culture biblique, pour ceux qui ignorent les fondements même de notre église.",
    "Le feu Révérend Pasteur va donc initier et organiser les premières séances officielles et formelles de Cours Bibliques, dont l'une des preuves irréfutables et irrévocables reste le règlement intérieur des Cours Bibliques en vigueur au sein de l'Église du Christianisme Céleste, signé de son vivant par lui-même à Porto-Novo le 20 septembre 2004.",
    "Composé d'un petit préambule et de 17 articles, les essences de ce précieux sésame semblent malheureusement inconnues et végètent dans une ignorance notoire qui n'a plus droit de cité.",
    "C'est donc dans le but de valoriser cet important outil au service de l'évangélisation au sein de notre église que la Coordination des Cours Bibliques s'est assignée la responsabilité de le vulgariser, en vue de permettre au grand public d'en prendre connaissance et, pour les ayant-connaissances, raviver sa flamme.",
    "La Coordination des Cours Bibliques souhaite vivement faire imprégner le grand public du contenu de ce Règlement Intérieur, faire appréhender sa portée par les Moniteurs en particulier et les fidèles en général, et susciter une adhésion massive des fidèles de l'Église du Christianisme Céleste aux Cours Bibliques. Et tout ceci pour le salut de tous.",
    "« Demeurer dans l'ignorance pour périr » selon Osée 4 verset 6, ou « méditer quotidiennement le livre de la loi pour agir fidèlement selon tout ce qui y est écrit, afin d'avoir du succès dans ses entreprises » selon Josué 1 verset 8.",
    "Faisons le bon choix en portant haut et très haut le flambeau de toutes les initiatives qui contribuent à la propagation de la Parole de Dieu au sein de notre chère église.",
    "Que le Seigneur nous bénisse et nous fortifie. Amen.",
  ],
  articles: [
    { numero: 1, texte: "La participation aux cours bibliques est obligatoire pour tous les fidèles hommes et femmes de l'Église du Christianisme Céleste." },
    { numero: 2, texte: "Les cours bibliques se déroulent obligatoirement dans l'enceinte des paroisses." },
    { numero: 3, texte: "Le port de la robe de prière est obligatoire pour le Chargé spirituel et le moniteur durant le déroulement des cours bibliques." },
    { numero: 4, texte: "Les hommes s'installent d'un côté et les femmes de l'autre, comme durant les cultes." },
    { numero: 5, texte: "Les apprenants doivent se munir chacun d'une bible, d'un cahier et d'un Bic." },
    { numero: 6, texte: "Le Chargé spirituel fixe les jours et heures de déroulement des cours bibliques." },
    { numero: 7, texte: "La séance de cours bibliques dure au plus deux (02) heures et ne peut en aucun cas aller au-delà de vingt et une heures (21h)." },
    { numero: 8, texte: "Les cours bibliques portent sur les thèmes retenus par le Comité Directeur du Saint Siège." },
    { numero: 9, texte: "Le moniteur des cours bibliques est obligatoirement choisi dans la hiérarchie des Leaders, des Évangélistes, par le Chargé spirituel après avis du Comité Paroissial." },
    { numero: 10, texte: "Le moniteur des cours bibliques dispense ses cours conformément à la Parole de Dieu et ce, dans le respect de la doctrine de l'ECC." },
    { numero: 11, texte: "Le moniteur des cours bibliques s'efforcera autant que cela dépend de lui de réaliser, d'entretenir et de faire entretenir la paix par la pertinence de ses cours et l'atmosphère affective dans laquelle ils sont conduits." },
    { numero: 12, texte: "Le bavardage, les distractions, les communications téléphoniques, la violence et les grossièretés sont interdits lors des cours bibliques." },
    { numero: 13, texte: "Les préoccupations des apprenants ne découlant pas du thème du jour sont enregistrées et soumises au Chargé spirituel." },
    { numero: 14, texte: "Les retards et irrégularités aux cours sont interdits." },
    { numero: 15, texte: "Le non-respect des dispositions du présent règlement intérieur expose le mis en cause aux sanctions ci-après : avertissement, blâme, exclusion des cours bibliques." },
    { numero: 16, texte: "Les sanctions sont prononcées par le Chargé spirituel sur proposition du moniteur de cours bibliques." },
    { numero: 17, texte: "Le présent règlement intérieur prend effet à partir de sa date de signature et sera publié partout besoin sera." },
  ],
  signature: "Porto-Novo, le 20 septembre 2004 — Révérend Pasteur Benoît D. AGBAOSSI, Chef Mondial de l'ECC",
};

// TEXTE PROVISOIRE — à remplacer par la version officielle fournie par la
// Coordination. Conservé volontairement pour démontrer le mécanisme de
// lecture forcée en attendant le texte définitif.
export const CHARTE_MONITEUR: {
  titre: string;
  sousTitre: string;
  preambule: string[];
  articles: { numero: number; texte: string }[];
  signature: string;
} = {
  titre: "Charte du Moniteur des Cours Bibliques",
  sousTitre: "Coordination des Cours Bibliques — Église du Christianisme Céleste — [Texte provisoire]",
  preambule: [
    "« Que celui qui enseigne s'attache à son enseignement » (Romains 12 verset 7). Le moniteur des Cours Bibliques n'est pas un simple exécutant : il est, aux yeux des apprenants, un témoin vivant de la Parole qu'il transmet.",
    "La présente charte fixe les engagements personnels que tout moniteur inscrit sur la plateforme de la Coordination des Cours Bibliques prend, en complément du Règlement Intérieur des Cours Bibliques.",
  ],
  articles: [
    { numero: 1, texte: "Le moniteur s'engage à mener une vie conforme à l'enseignement qu'il dispense, tant au sein de la paroisse qu'en dehors." },
    { numero: 2, texte: "Le moniteur enseigne dans le respect strict de la doctrine de l'Église du Christianisme Céleste, sans y ajouter ni en retrancher selon sa propre interprétation." },
    { numero: 3, texte: "Le moniteur s'engage à honorer ses séances avec régularité et à en informer le Chargé spirituel en cas d'empêchement." },
    { numero: 4, texte: "Le moniteur reconnaît l'autorité du Chargé spirituel, du Comité Paroissial et de la Coordination des Cours Bibliques, et se soumet à leurs orientations." },
    { numero: 5, texte: "Le moniteur s'engage à ne pas divulguer les informations personnelles des apprenants et des membres dont il aurait connaissance dans l'exercice de sa mission." },
    { numero: 6, texte: "Le moniteur s'engage à renseigner des informations exactes lors de son inscription, à protéger ses identifiants de connexion, et à ne pas usurper l'identité d'un autre membre." },
    { numero: 7, texte: "Le moniteur exerce sa mission avec charité, patience et disponibilité envers les apprenants, sans esprit de domination." },
    { numero: 8, texte: "Le moniteur déclare avoir pris connaissance du Règlement Intérieur des Cours Bibliques et s'engage à en respecter l'ensemble des dispositions." },
  ],
  signature: "En cochant la case correspondante, je déclare avoir lu et accepté la présente charte.",
};