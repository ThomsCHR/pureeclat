import { useNavigate } from "react-router-dom";

const sections = [
  {
    title: "1. Présentation",
    content: `Pure Éclat est un institut de beauté proposant des soins visage, corps et regard. La réservation en ligne est accessible via notre site à toute personne disposant d'un compte client.

Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme de réservation en ligne de Pure Éclat.`,
  },
  {
    title: "2. Création de compte",
    content: `Pour réserver une prestation, vous devez créer un compte client en fournissant des informations exactes et à jour (prénom, nom, adresse e-mail, mot de passe).

Vous êtes seul responsable de la confidentialité de vos identifiants. Toute connexion effectuée depuis votre compte est réputée effectuée par vous. En cas de perte ou de vol de vos identifiants, contactez-nous immédiatement.`,
  },
  {
    title: "3. Réservation en ligne",
    content: `La réservation est confirmée dès validation de votre choix de soin, praticienne, date et créneau horaire. Un récapitulatif vous est envoyé par e-mail.

Pure Éclat se réserve le droit d'annuler ou de modifier une réservation en cas de circonstance exceptionnelle (absence de la praticienne, fermeture imprévue). Vous en serez informé dans les meilleurs délais.`,
  },
  {
    title: "4. Annulation et modification",
    content: `Vous pouvez annuler ou modifier votre rendez-vous depuis votre espace client jusqu'à 24 heures avant la prestation.

Au-delà de ce délai, l'annulation peut entraîner la facturation de la prestation. En cas de no-show (absence sans annulation préalable), Pure Éclat se réserve le droit de facturer la totalité du soin.`,
  },
  {
    title: "5. Données personnelles",
    content: `Les informations collectées lors de la création de votre compte (nom, prénom, e-mail, téléphone) sont utilisées exclusivement dans le cadre de la gestion de votre relation avec Pure Éclat.

Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous par e-mail.

Vos données ne sont jamais revendues à des tiers.`,
  },
  {
    title: "6. Cookies et authentification",
    content: `Notre site utilise un cookie d'authentification sécurisé (HttpOnly) pour maintenir votre session. Ce cookie ne contient aucune donnée personnelle lisible et ne peut pas être accédé par des scripts tiers.

Aucun cookie publicitaire ou de traçage tiers n'est utilisé sur notre plateforme.`,
  },
  {
    title: "7. Responsabilité",
    content: `Pure Éclat s'engage à mettre en œuvre tous les moyens nécessaires pour assurer la disponibilité de la plateforme de réservation. Cependant, nous ne pouvons garantir une disponibilité ininterrompue.

Pure Éclat ne saurait être tenu responsable des dommages résultant d'une utilisation non conforme de la plateforme ou d'une force majeure.`,
  },
  {
    title: "8. Modification des CGU",
    content: `Pure Éclat se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés de toute modification significative. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles conditions.`,
  },
  {
    title: "9. Contact",
    content: `Pour toute question relative aux présentes conditions générales ou à votre compte, vous pouvez nous contacter par e-mail ou directement à l'accueil de l'un de nos instituts.`,
  },
];

export default function ConditionsGeneralesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF5ED]">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-black via-[#1a1412] to-black text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_#f9b6c8_0,_transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition mb-8"
          >
            ← Retour
          </button>
          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-rose-200/80 mb-3">
            informations légales
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            Conditions générales d'utilisation
          </h1>
          <p className="text-sm text-white/60">
            Dernière mise à jour : février 2026
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-semibold text-slate-900 mb-3">
              {section.title}
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}

        {/* Séparateur */}
        <div className="border-t border-[#e4d4c5] pt-8 text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} Pure Éclat — Tous droits réservés
        </div>
      </div>
    </div>
  );
}
