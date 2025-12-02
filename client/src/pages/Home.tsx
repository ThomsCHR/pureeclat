import HeroTitle from "../components/HeroTitle";
import ButtonExplore from "../components/ButtonExplore";


export default function Home() {
  return (
    <div className="bg-white text-slate-900">
      {/* HERO */}
      <section
        id="hero"
        className="relative overflow-hidden"
      >
        {/* Image plein écran */}
        <div className="pointer-events-none absolute inset-y-0 right-[0] w-[100%] hidden md:block">
          <img
              src="/images/acc1-1920.jpg"
              srcSet="
                /images/acc1.jpg 1920w,
                /images/acc1-2560.jpg 2560w,
                /images/acc1-3840.jpg 3840w
                                      "
                sizes="100vw"
                alt="Visuel esthétique"
                className="h-full w-full object-cover object-center"
              />

        </div>

        {/* Version mobile : image en fond léger */}
        <div className="pointer-events-none absolute inset-0 md:hidden opacity-40">
          <img
            src="https://fme.international/wp-content/uploads/2025/07/France-medecine-esthetique-07-2025-1920.webp"
            alt="Visuel esthétique"
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* Gradient léger pour le texte (gauche) */}
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

        {/* Contenu / texte */}
        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 pt-24">
          <div className="w-full md:w-1/2 space-y-6">
            <p className="text-sm uppercase tracking-[0.25em] text-white/80">
              
            </p>

            <HeroTitle />


            <p className="max-w-md text-sm text-white/90 md:text-base">
              Un savoir-faire expert et des technologies exclusives, dans un cadre
              chaleureux et rassurant.
            </p>

            <div className="flex flex-wrap items-center gap-4">
             <ButtonExplore>Découvrir les soins</ButtonExplore>


            </div>

            <div className="flex gap-6 pt-4 text-xs text-white/90">
              <div>
                <p className="font-semibold">+20 500 client-es</p>
                <p>accompagné·es chaque année</p>
              </div>
              <div>
                <p className="font-semibold">Esthéticiennes expertes</p>
                <p>spécialisées en soins du corps </p>
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION BESOINS */}
      <section
        id="needs"
        className="bg-white/80 py-20 text-slate-900 backdrop-blur"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-semibold md:text-4xl">
            Répondez à vos besoins, en toute confiance
          </h2>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-600">
            Qu’il s’agisse de prévenir les signes de l’âge, d’harmoniser votre
            visage ou de prendre soin de votre peau, nos protocoles sont
            personnalisés pour respecter votre naturel.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Rides & relâchement",
                text: "Solutions sur-mesure pour lisser, repulper et redessiner les volumes du visage.",
              },
              {
                title: "Qualité de peau",
                text: "Peelings, skinboosters, lasers… Une peau plus uniforme, lumineuse et éclatante.",
              },
              {
                title: "Harmonisation du visage",
                text: "Approche globale pour respecter vos traits et révéler votre singularité.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-slate-50 p-5 shadow-sm shadow-slate-200"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION SOLUTIONS */}
      <section
        id="solutions"
        className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 py-20"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-center">
          <div className="w-full space-y-4 md:w-1/2">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Des soins d’exception, conçus pour sublimer votre beauté naturelle
            </h2>
            <p className="text-sm md:text-base text-slate-600">
              Une sélection de protocoles signature, alliant expertise, précision et technologies
              d’avant-garde pour des résultats élégants, harmonieux et durables.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
             <li>• Rituel “Éclat Signature” — Hydratation profonde & luminosité immédiate</li>
            <li>• Remodelage du visage — Techniques avancées pour des contours raffinés</li>
            <li>• Soin régénérant cellulaire — Stimulation du collagène & peau repulpée</li>
            <li>• Protocoles anti-âge sur mesure — Approche douce & résultats naturels</li>
            <li>• Traitements haute technologie — Radiofréquence, LED & bio-stimulation</li>
            </ul>
          </div>

          <div className="w-full md:w-1/2">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "/images/hydra.jpg",
                "/images/technique.jpg",
                "/images/corps.png",
                "/images/cheveux.jpg",
              ].map((src) => (
                <div
                  key={src}
                  className="h-40 overflow-hidden rounded-3xl bg-slate-200"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION ADRESSES */}
      <section id="addresses" className="bg-white py-20">
  <div className="mx-auto max-w-6xl px-4">
    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <div>
        <h2 className="text-3xl font-semibold md:text-4xl">
          Des adresses au cœur de la ville
        </h2>
        <p className="mt-3 max-w-xl text-sm md:text-base text-slate-600">
          Des lieux chaleureux et lumineux, pensés pour que chaque visite
          soit un moment pour vous.
        </p>
      </div>

      <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-900 shadow-sm hover:border-slate-300">
        Voir toutes nos adresses
      </button>
    </div>

    {/* --- NOUVEAU TABLEAU --- */}
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {[
        {
          city: "Paris 16-",
          img: "/images/Paris.png",
        },
        {
          city: "Lyon",
          img: "/images/Lyon.png",
        },
        {
          city: "Marseille",
          img: "/images/Marseille.png",
        },
      ].map((loc) => (
        <div
          key={loc.city}
          className="space-y-3 rounded-2xl bg-slate-50 p-5 shadow-sm shadow-slate-100"
        >
          <div className="h-32 overflow-hidden rounded-xl bg-slate-200">
            <img
              src={loc.img}
              alt={`Salon Pure Éclat ${loc.city}`}
              className="h-full w-full object-cover"
            />
          </div>

          <h3 className="text-lg font-semibold">{loc.city}</h3>
          <p className="text-sm text-slate-600">
            Adresse fictive.
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* SECTION À PROPOS */}
      {/* SECTION À PROPOS */}
<section id="about" className="bg-slate-900 py-20 text-slate-50">
  <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row">
    <div className="w-full space-y-4 md:w-1/2">
      <h2 className="text-3xl font-semibold md:text-4xl">
        Une maison d’esthétique dédiée à votre éclat
      </h2>
      <p className="text-sm md:text-base text-slate-200">
        Pure&nbsp;Éclat réunit une équipe d’esthéticiennes expertes, animées par
        la même philosophie&nbsp;: sublimer votre beauté sans la transformer.
        Chaque geste, chaque rituel et chaque conseil est pensé pour respecter
        votre personnalité, vos envies et votre rythme.
      </p>
      <p className="text-sm md:text-base text-slate-300">
        Nos protocoles allient textures sensorielles, techniques manuelles
        précises et technologies esthétiques de pointe, pour des résultats
        visibles, élégants et profondément confortables.
      </p>
    </div>

    <div className="w-full space-y-4 md:w-1/2">
      <div className="rounded-2xl bg-slate-800/70 p-5">
        <p className="text-sm text-slate-100">
          “Nous croyons à une esthétique qui accompagne, jamais qui impose.
          Notre rôle est de révéler vos atouts naturels, de lisser les marques
          de fatigue, d’illuminer le teint… tout en préservant ce qui fait votre
          singularité.”
        </p>
        <p className="mt-4 text-sm font-medium text-emerald-300">
          Cassandra Draijer — Esthéticienne experte & fondatrice Pure&nbsp;Éclat
        </p>
      </div>
    </div>
  </div>
</section>


      {/* SECTION GUIDES & TARIFS */}
     <section id="guides" className="bg-white py-16">
  <div className="mx-auto max-w-6xl px-4">
    <h2 className="text-2xl font-semibold md:text-3xl">
      Mieux comprendre les soins esthétiques
    </h2>
    <p className="mt-2 max-w-xl text-sm md:text-base text-slate-600">
      Des guides et conseils pour vous aider à choisir vos rituels, préparer vos
      rendez-vous et prolonger les effets des soins à la maison.
    </p>

    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {[
        "Choisir son rituel visage",
        "Préparer sa première visite",
        "Prolonger l’éclat après un soin",
      ].map((title) => (
        <article
          key={title}
          className="space-y-2 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700 shadow-sm shadow-slate-100"
        >
          <h3 className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <p>
            Texte fictif, que tu pourras remplacer par de vrais contenus
            pédagogiques autour de tes soins et routines beauté.
          </p>
          <button className="text-xs font-semibold text-slate-900 underline underline-offset-4">
            Lire l&apos;article
          </button>
        </article>
      ))}
    </div>
  </div>
</section>

{/* SECTION TARIFS (vers page dédiée) */}
<section id="pricing" className="bg-amber-50 py-14">
  <div className="mx-auto max-w-6xl px-4 text-center">
    <h2 className="text-2xl font-semibold md:text-3xl">
      Une carte de soins claire & transparente
    </h2>
    <p className="mt-3 text-sm md:text-base text-slate-700">
      Chaque soin est pensé sur-mesure en fonction de vos besoins. Retrouvez le
      détail de nos rituels et de leurs tarifs sur notre page dédiée.
    </p>
    <button className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black">
      Découvrir la carte des soins
    </button>
  </div>
</section>
    </div>
  );
}
