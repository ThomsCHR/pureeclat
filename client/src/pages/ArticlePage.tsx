import { useParams, useNavigate } from "react-router-dom";

const articles: Record<
  string,
  {
    title: string;
    category: string;
    readTime: string;
    intro: string;
    sections: { heading: string; body: string }[];
    tip: string;
  }
> = {
  "choisir-son-rituel-visage": {
    title: "Choisir son rituel visage",
    category: "Conseils peau",
    readTime: "5 min de lecture",
    intro:
      "Votre peau est unique. Elle évolue avec les saisons, votre mode de vie, votre alimentation et même votre sommeil. Avant de choisir vos soins, prenez le temps d'identifier votre type de peau pour construire un rituel vraiment adapté.",
    sections: [
      {
        heading: "Identifier votre type de peau",
        body: "Il existe quatre grands types de peau : normale, sèche, grasse et mixte. La peau normale présente peu d'imperfections, un teint lumineux et des pores peu visibles. La peau sèche, elle, manque de sébum et tire souvent après le nettoyage. La peau grasse produit un excès de sébum, ce qui donne un aspect brillant et favorise l'apparition de comédons. La peau mixte combine une zone T (front, nez, menton) grasse et des joues normales ou sèches.",
      },
      {
        heading: "Les soins adaptés à chaque type",
        body: "Pour une peau sèche, privilégiez des soins riches en actifs hydratants comme l'acide hyaluronique, le beurre de karité ou les huiles végétales douces. Pour une peau grasse, tournez-vous vers des textures légères, non comédogènes, avec du niacinamide ou de l'acide salicylique pour réguler le sébum. La peau mixte nécessite une approche zone par zone : un soin équilibrant en global et un gel matifiant sur la zone T.",
      },
      {
        heading: "Construire votre routine pas à pas",
        body: "Un bon rituel visage repose sur trois étapes fondamentales : nettoyer, traiter, protéger. Le matin, optez pour un nettoyage doux pour ne pas déséquilibrer le film hydrolipidique, puis appliquez un sérum ciblé (éclat, hydratation, anti-taches) avant votre crème et votre indispensable SPF. Le soir, un double nettoyage (huile puis eau micellaire ou gel) prépare idéalement la peau à recevoir vos actifs de nuit.",
      },
      {
        heading: "Écouter sa peau au fil des saisons",
        body: "Votre peau n'a pas les mêmes besoins en hiver qu'en été. En hiver, le froid et le chauffage assèchent l'épiderme : enrichissez votre crème habituelle d'une huile réparatrice. En été, allégez les textures, renforcez la protection solaire et misez sur les soins matifiants si vous avez tendance à briller.",
      },
    ],
    tip: "Consultez une esthéticienne au moins une fois par an pour un diagnostic de peau professionnel. Elle saura adapter les actifs à votre profil exact et vous conseiller des soins en cabin complémentaires.",
  },

  "preparer-sa-premiere-visite": {
    title: "Préparer sa première visite",
    category: "Guide pratique",
    readTime: "4 min de lecture",
    intro:
      "Vous avez réservé votre premier soin en institut et vous vous demandez à quoi vous attendre ? Pas de panique. Voici tout ce que vous devez savoir pour arriver sereine et profiter pleinement de votre séance.",
    sections: [
      {
        heading: "Avant la séance : les essentiels à savoir",
        body: "Évitez d'appliquer du maquillage épais le jour de votre rendez-vous, surtout si vous réservez un soin visage. Hydratez-vous bien dans les jours précédents pour que votre peau soit réceptive aux actifs. Si vous avez une peau sensible ou suivez un traitement dermatologique, signalez-le lors de la prise de rendez-vous afin que l'esthéticienne puisse adapter les produits.",
      },
      {
        heading: "Le bilan peau initial",
        body: "À votre arrivée, votre esthéticienne prendra quelques minutes pour faire un bilan de votre peau. Elle vous posera des questions sur votre routine habituelle, vos éventuelles allergies, vos objectifs (éclat, anti-âge, hydratation, rééquilibrage). Ce moment d'échange est précieux : n'hésitez pas à mentionner les zones qui vous préoccupent ou les produits qui vous ont posé problème par le passé.",
      },
      {
        heading: "Pendant le soin : laissez-vous porter",
        body: "Une séance type dure entre 45 minutes et 1 h 30 selon le protocole choisi. Vous serez allongée confortablement, dans une atmosphère douce et apaisante. L'esthéticienne enchaînera différentes étapes : démaquillage, exfoliation, massage, application de masque, soin spécifique. Si une étape vous est inconfortable (pression, température, odeur), dites-le immédiatement sans attendre.",
      },
      {
        heading: "Après le soin : les précautions à prendre",
        body: "Dans les 24 heures suivant un soin, évitez l'exposition au soleil sans protection, le maquillage épais, le sport intensif et les environnements très chauds (sauna, hammam). Votre peau est en pleine régénération : offrez-lui calme et hydratation. L'esthéticienne vous remettra en général une petite feuille de recommandations personnalisées.",
      },
    ],
    tip: "Prévoyez d'arriver 5 minutes en avance pour remplir sereinement votre fiche client et ne pas empiéter sur le temps de votre soin. Et éteignez votre téléphone — vous méritez ce moment de déconnexion totale.",
  },

  "prolonger-leclat-apres-un-soin": {
    title: "Prolonger l'éclat après un soin",
    category: "Gestes beauté",
    readTime: "4 min de lecture",
    intro:
      "Vous sortez d'un soin et votre peau resplendit. Comment faire durer cet éclat le plus longtemps possible ? Avec quelques gestes simples et une routine adaptée, les bienfaits d'une séance peuvent se prolonger plusieurs jours.",
    sections: [
      {
        heading: "Les 24 premières heures : la phase clé",
        body: "Les premières heures après un soin sont cruciales. La peau est plus perméable et réceptive aux actifs mais aussi plus vulnérable. Évitez absolument le maquillage couvrant, le soleil direct et l'eau chaude sur le visage. Privilégiez une eau thermale en brumisation pour apaiser et fixer l'hydratation apportée pendant le soin.",
      },
      {
        heading: "L'hydratation, pilier de l'éclat",
        body: "Un soin professionnel réhydrate en profondeur, mais c'est à vous de maintenir ce capital hydrique au quotidien. Buvez au minimum 1,5 litre d'eau par jour, appliquez votre sérum hydratant matin et soir, et n'oubliez pas la crème contour des yeux, zone souvent négligée mais très révélatrice de la fatigue et du manque d'eau.",
      },
      {
        heading: "La routine douce à adopter",
        body: "Après un soin, simplifiez votre routine pendant 48 h : un nettoyant doux, votre crème habituelle et le SPF. Évitez les exfoliants, les acides concentrés et les masques agressifs pendant au moins 3 à 4 jours. Laissez les actifs du soin agir sans les perturber. Réintroduisez progressivement vos soins ciblés (rétinol, vitamine C, AHA) à partir du troisième jour.",
      },
      {
        heading: "Les habitudes qui font la différence",
        body: "Au-delà des produits, certaines habitudes de vie amplifient les résultats d'un soin : dormez 7 à 8 heures par nuit (la régénération cellulaire se fait la nuit), adoptez une alimentation riche en antioxydants (fruits rouges, agrumes, légumes verts), et pratiquez une activité physique régulière pour stimuler la microcirculation et oxygéner naturellement votre peau.",
      },
    ],
    tip: "Planifiez vos soins en institut le vendredi soir ou la veille d'un jour de repos pour laisser le temps à votre peau de récupérer tranquillement, sans contrainte de maquillage ou d'exposition.",
  },
};

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const article = slug ? articles[slug] : undefined;

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-500">Article introuvable.</p>
        <button
          onClick={() => navigate("/")}
          className="text-sm font-semibold underline underline-offset-4"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-amber-50 pb-12 pt-28">
        <div className="mx-auto max-w-2xl px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            ←
            Retour
          </button>

          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 mb-3">
            {article.category}
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl leading-snug">
            {article.title}
          </h1>
          <p className="mt-2 text-xs text-slate-400">{article.readTime}</p>
          <p className="mt-4 text-slate-600 leading-relaxed">{article.intro}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-10">
        {article.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {section.heading}
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {section.body}
            </p>
          </div>
        ))}

        {/* Tip box */}
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2">
            Le conseil Pure Éclat
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{article.tip}</p>
        </div>

        {/* CTA */}
        <div className="border-t pt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-slate-500">
            Prête à prendre soin de vous ?
          </p>
          <button
            onClick={() => navigate("/soins")}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black transition-colors"
          >
            Découvrir nos soins
          </button>
        </div>
      </div>
    </div>
  );
}
