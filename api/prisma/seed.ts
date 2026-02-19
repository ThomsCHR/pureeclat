import { PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";
import "dotenv/config";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Pure Éclat...");

  // --- CATEGORIES ---
  const visage = await prisma.category.upsert({
    where: { slug: "rituels-visage" },
    update: {},
    create: {
      name: "Rituels visage",
      slug: "rituels-visage",
      description:
        "Soins dédiés à l’éclat, à la fermeté et au confort de la peau du visage.",
      order: 1,
      isActive: true,
    },
  });

  const corps = await prisma.category.upsert({
    where: { slug: "soins-corps" },
    update: {},
    create: {
      name: "Soins corps",
      slug: "soins-corps",
      description:
        "Modelages, enveloppements et soins ciblés pour le corps et la silhouette.",
      order: 2,
      isActive: true,
    },
  });

  const regard = await prisma.category.upsert({
    where: { slug: "beaute-du-regard" },
    update: {},
    create: {
      name: "Beauté du regard",
      slug: "beaute-du-regard",
      description:
        "Prestations cils & sourcils pour structurer et illuminer le regard.",
      order: 3,
      isActive: true,
    },
  });

  // --- SOINS VISAGE ---
  await prisma.service.upsert({
    where: { slug: "rituel-eclat-signature" },
    update: {},
    create: {
      name: "Rituel Éclat Signature",
      slug: "rituel-eclat-signature",
      shortDescription:
        "Soin complet visage pour révéler l’éclat et la lumière du teint.",
      description:
        "Un protocole visage hautement sensoriel mêlant nettoyage profond, exfoliation douce, massage sculptant et masque sur-mesure. Idéal avant un événement ou pour redonner de la vitalité aux peaux ternes.",
      durationMinutes: 75,
      priceCents: 12000,
      imageUrl: "/images/soins/rituel-eclat.jpg",
      categoryId: visage.id,
      orderInCategory: 1,
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "hydra-glow" },
    update: {},
    create: {
      name: "Hydra Glow",
      slug: "hydra-glow",
      shortDescription: "Hydratation intense & effet peau repulpée immédiat.",
      description:
        "Un soin réhydratant en profondeur qui combine sérums concentrés, massages et masque repulpant pour lisser les traits et redonner souplesse à la peau.",
      durationMinutes: 60,
      priceCents: 9500,
      imageUrl: "/images/soins/hydra-glow-aqua-facial.jpg",
      categoryId: visage.id,
      orderInCategory: 2,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "peeling-doux-renovateur" },
    update: {},
    create: {
      name: "Peeling doux rénovateur",
      slug: "peeling-doux-renovateur",
      shortDescription:
        "Affinez le grain de peau et unifiez le teint en douceur.",
      description:
        "Un peeling superficiel adapté aux peaux sensibles pour estomper les irrégularités, lisser le grain de peau et apporter plus de luminosité.",
      durationMinutes: 45,
      priceCents: 8500,
      imageUrl: "/images/soins/peeling.jpg",
      categoryId: visage.id,
      orderInCategory: 3,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "massage-sculptant" },
    update: {},
    create: {
      name: "Massage sculptant visage",
      slug: "massage-sculptant",
      shortDescription:
        "Technique manuelle pour redessiner les contours du visage.",
      description:
        "Un massage profond inspiré du kobido et des techniques sculptantes pour lifter, drainer et défatiguer les traits.",
      durationMinutes: 50,
      priceCents: 9000,
      imageUrl: "/images/soins/massage-sculptant.jpg",
      categoryId: visage.id,
      orderInCategory: 4,
      isActive: true,
    },
  });

  // --- SOINS CORPS ---
  await prisma.service.upsert({
    where: { slug: "modelage-relaxant" },
    update: {},
    create: {
      name: "Modelage relaxant",
      slug: "modelage-relaxant",
      shortDescription:
        "Un moment de lâcher-prise complet pour le corps et l’esprit.",
      description:
        "Massage corps enveloppant aux manœuvres lentes et fluides pour dénouer les tensions et apaiser le mental.",
      durationMinutes: 60,
      priceCents: 9000,
      imageUrl: "/images/soins/modelage-relaxant.jpg",
      categoryId: corps.id,
      orderInCategory: 1,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "enveloppement-raffermissant" },
    update: {},
    create: {
      name: "Enveloppement raffermissant",
      slug: "enveloppement-raffermissant",
      shortDescription: "Soin corps ciblé pour tonifier et lisser la peau.",
      description:
        "Gommage préparateur suivi d’un enveloppement riche en actifs raffermissants pour une peau plus lisse et plus ferme.",
      durationMinutes: 60,
      priceCents: 9500,
      imageUrl: "/images/soins/enveloppement-raffermissant.jpg",
      categoryId: corps.id,
      orderInCategory: 2,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "drainage-esthetique" },
    update: {},
    create: {
      name: "Drainage esthétique",
      slug: "drainage-esthetique",
      shortDescription:
        "Active la circulation, allège les jambes et affine visuellement.",
      description:
        "Massage inspiré du drainage lymphatique pour améliorer la circulation et diminuer les sensations de jambes lourdes.",
      durationMinutes: 60,
      priceCents: 9800,
      imageUrl: "/images/soins/drainage-esthetique.jpg",
      categoryId: corps.id,
      orderInCategory: 3,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "soin-jambes-legeres" },
    update: {},
    create: {
      name: "Soin jambes légères",
      slug: "soin-jambes-legeres",
      shortDescription:
        "Soin ciblé pour dégonfler, rafraîchir et délasser les jambes.",
      description:
        "Soin combinant massage drainant et sensation cryo pour des jambes légères et confortables.",
      durationMinutes: 40,
      priceCents: 7500,
      imageUrl: "/images/soins/jambes-legeres.jpg",
      categoryId: corps.id,
      orderInCategory: 4,
      isActive: true,
    },
  });

  // --- BEAUTÉ DU REGARD ---
  await prisma.service.upsert({
    where: { slug: "brow-lift" },
    update: {},
    create: {
      name: "Brow Lift & structuration",
      slug: "brow-lift",
      shortDescription:
        "Sourcils liftés, disciplinés et parfaitement dessinés.",
      description:
        "Restructuration de la ligne, brow lift et mise en forme pour un regard ouvert et harmonieux.",
      durationMinutes: 45,
      priceCents: 6500,
      imageUrl: "/images/soins/brow-lift.jpg",
      categoryId: regard.id,
      orderInCategory: 1,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "rehaussement-cils" },
    update: {},
    create: {
      name: "Rehaussement de cils",
      slug: "rehaussement-cils",
      shortDescription: "Courbure naturelle et regard agrandi sans extensions.",
      description:
        "Rehaussement doux depuis la racine, associé à un soin nourrissant pour préserver la douceur et la brillance des cils.",
      durationMinutes: 60,
      priceCents: 7500,
      imageUrl: "/images/soins/rehaussement-cils.jpg",
      categoryId: regard.id,
      orderInCategory: 2,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "teinture-cils-sourcils" },
    update: {},
    create: {
      name: "Teinture cils & sourcils",
      slug: "teinture-cils-sourcils",
      shortDescription:
        "Intensifie le regard tout en restant parfaitement naturel.",
      description:
        "Teinture adaptée à votre carnation pour redonner de la profondeur aux cils et structurer les sourcils.",
      durationMinutes: 30,
      priceCents: 4500,
      imageUrl: "/images/soins/teinture-cils-sourcils.jpg",
      categoryId: regard.id,
      orderInCategory: 3,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "soin-contour-yeux" },
    update: {},
    create: {
      name: "Soin contour des yeux",
      slug: "soin-contour-yeux",
      shortDescription:
        "Lisse, défatigue et illumine la zone la plus délicate du visage.",
      description:
        "Soin ciblé pour atténuer les marques de fatigue, lisser les ridules et apporter de l’éclat à la zone du regard.",
      durationMinutes: 35,
      priceCents: 6000,
      imageUrl: "/images/soins/soin-contour-yeux.jpg",
      categoryId: regard.id,
      orderInCategory: 4,
      isActive: true,
    },
  });

  // users
  const adminEmail = "admin@pureeclat.com";
  const userEmail = "client@pureeclat.com";

  const adminPasswordHash = await argon2.hash("admin1234");
  const userPasswordHash = await argon2.hash("user1234");

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "PureEclat",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      phone: "0600000000",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      firstName: "Emma",
      lastName: "Client",
      email: userEmail,
      passwordHash: userPasswordHash,
      role: "CLIENT",
      phone: "0612345678",
      isActive: true,
    },
  });

  console.log("👤 Users créés avec Argon2 : admin & client");

    // --- ESTHETIENNES ---
  const practitionerPasswordHash = await argon2.hash("esth123456789-!xxx!z590b3z");

  await prisma.user.upsert({
    where: { email: "camille@pureeclat.com" },
    update: {},
    create: {
      firstName: "Camille",
      lastName: "Dupont",
      email: "camille@pureeclat.com",
      passwordHash: practitionerPasswordHash,
      role: UserRole.ESTHETICIENNE,
      phone: "0611111111",
      isActive: true,
      isAdmin: true,
    },
  });

    await prisma.user.upsert({
    where: { email: "cassandra@gmail.com" },
    update: {},
    create: {
      firstName: "Cassandra",
      lastName: "Draijer",
      email: "cassandra@gmail.com",
      passwordHash: practitionerPasswordHash,
      role: UserRole.ESTHETICIENNE,
      phone: "0621111111",
      isActive: true,
      isAdmin: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "lea@pureeclat.com" },
    update: {},
    create: {
      firstName: "Léa",
      lastName: "Martin",
      email: "lea@pureeclat.com",
      passwordHash: practitionerPasswordHash,
      role: UserRole.ESTHETICIENNE,
      phone: "0622222222",
      isActive: true,
    },
  });

  const superAdminEmail = process.env.SUPERADMIN_EMAIL;
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.warn("⚠️  SUPERADMIN_EMAIL ou SUPERADMIN_PASSWORD manquant dans le .env — SUPERADMIN non créé.");
  } else {
    const superAdminHash = await argon2.hash(superAdminPassword);
    await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {},
      create: {
        firstName: "Super",
        lastName: "Admin",
        email: superAdminEmail,
        passwordHash: superAdminHash,
        role: UserRole.SUPERADMIN,
        phone: "0622222238",
        isActive: true,
        isAdmin: true,
      },
    });
    console.log(`👤 SUPERADMIN créé : ${superAdminEmail}`);
  }
  console.log("👤 Users créés avec Argon2 : admin, client & esthéticiennes");




  console.log("✅ Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
