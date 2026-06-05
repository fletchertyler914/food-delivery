import path from "node:path";

import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(__dirname, "../../../.env") });

import { OrderStatus, PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { SEED_IMAGES } from "./seed-images";

const DEFAULT_DATABASE_URL =
  "postgresql://food_delivery:food_delivery@localhost:5432/food_delivery?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env["DATABASE_URL"] ?? DEFAULT_DATABASE_URL
  })
});

interface MealSeed {
  readonly id: string;
  readonly restaurantId: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
  readonly imageUrl: string;
}

interface StatusEventSeed {
  readonly fromStatus: OrderStatus | null;
  readonly toStatus: OrderStatus;
  readonly createdAt: Date;
  readonly actorIsCustomer: boolean;
}

interface OrderItemSeed {
  readonly mealId: string;
  readonly nameSnapshot: string;
  readonly priceCentsSnapshot: number;
  readonly quantity: number;
}

interface OrderSeed {
  readonly id: string;
  readonly customerEmail: string;
  readonly restaurantId: string;
  readonly couponCode?: string;
  readonly status: OrderStatus;
  readonly tipCents: number;
  readonly subtotalCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly placedAt: Date;
  readonly items: readonly OrderItemSeed[];
  readonly timeline: readonly StatusEventSeed[];
}

const RESTAURANTS = [
  {
    id: "seed-rest-mizu",
    name: "Mizu Sushi House",
    description: "Edomae nigiri and seasonal omakase, served at our 8-seat counter.",
    imageUrl: SEED_IMAGES.restaurantMizu
  },
  {
    id: "seed-rest-solera",
    name: "Solera & Vine",
    description: "Spanish tapas, jamón ibérico, and a curated list of natural wines.",
    imageUrl: SEED_IMAGES.restaurantSolera
  },
  {
    id: "seed-rest-cinco",
    name: "Cinco Tacos & Mezcal",
    description: "Yucatán street tacos pressed on house nixtamal masa with small-batch mezcal.",
    imageUrl: SEED_IMAGES.restaurantCinco
  },
  {
    id: "seed-rest-verdura",
    name: "Verdura",
    description: "Mediterranean grain bowls, wood-fired flatbreads, and market-driven salads.",
    imageUrl: SEED_IMAGES.restaurantVerdura
  },
  {
    id: "seed-rest-roost",
    name: "Roost & Rye",
    description:
      "American gastropub fare — smash burgers, buttermilk fried chicken, and bourbon cocktails.",
    imageUrl: SEED_IMAGES.restaurantRoost
  },
  {
    id: "seed-rest-bodhi",
    name: "Bodhi Bowl",
    description: "Plant-based Asian fusion with house-made kimchi and locally sourced produce.",
    imageUrl: SEED_IMAGES.restaurantBodhi
  }
] as const;

const MEALS: readonly MealSeed[] = [
  // Mizu Sushi House
  {
    id: "seed-meal-mizu-nigiri",
    restaurantId: "seed-rest-mizu",
    name: "Bluefin Tuna Nigiri (3pc)",
    description: "Sushi-grade bluefin over seasoned sushi rice with a brush of nikiri.",
    priceCents: 1400,
    imageUrl: SEED_IMAGES.mealSushi
  },
  {
    id: "seed-meal-mizu-hamachi",
    restaurantId: "seed-rest-mizu",
    name: "Hamachi Sashimi",
    description: "Yellowtail belly sliced thin, served with ponzu and daikon.",
    priceCents: 1850,
    imageUrl: SEED_IMAGES.mealSashimi
  },
  {
    id: "seed-meal-mizu-roll",
    restaurantId: "seed-rest-mizu",
    name: "Spicy Salmon Roll",
    description: "Wild salmon, cucumber, and house spicy mayo rolled in nori.",
    priceCents: 1300,
    imageUrl: SEED_IMAGES.mealSushi
  },
  {
    id: "seed-meal-mizu-omakase",
    restaurantId: "seed-rest-mizu",
    name: "Omakase Tasting (8pc)",
    description: "Chef's selection of eight pieces highlighting the day's best catch.",
    priceCents: 3200,
    imageUrl: SEED_IMAGES.mealSashimi
  },
  {
    id: "seed-meal-mizu-miso",
    restaurantId: "seed-rest-mizu",
    name: "Miso Soup",
    description: "White miso broth with tofu, wakame, and scallion.",
    priceCents: 450,
    imageUrl: SEED_IMAGES.mealSoup
  },
  {
    id: "seed-meal-mizu-edamame",
    restaurantId: "seed-rest-mizu",
    name: "Edamame",
    description: "Steamed soybeans finished with flaky sea salt.",
    priceCents: 600,
    imageUrl: SEED_IMAGES.mealEdamame
  },
  {
    id: "seed-meal-mizu-cheesecake",
    restaurantId: "seed-rest-mizu",
    name: "Yuzu Cheesecake",
    description: "Silky cheesecake with yuzu curd and toasted sesame crumble.",
    priceCents: 900,
    imageUrl: SEED_IMAGES.mealDessert
  },
  // Solera & Vine
  {
    id: "seed-meal-solera-bravas",
    restaurantId: "seed-rest-solera",
    name: "Patatas Bravas",
    description: "Crispy potatoes with smoked paprika aioli and brava sauce.",
    priceCents: 950,
    imageUrl: SEED_IMAGES.mealTapas
  },
  {
    id: "seed-meal-solera-jamon",
    restaurantId: "seed-rest-solera",
    name: "Jamón Ibérico (60g)",
    description: "Hand-carved acorn-fed jamón with pan con tomate.",
    priceCents: 2200,
    imageUrl: SEED_IMAGES.mealTapas
  },
  {
    id: "seed-meal-solera-gambas",
    restaurantId: "seed-rest-solera",
    name: "Gambas al Ajillo",
    description: "Head-on prawns sizzling in garlic, chili, and olive oil.",
    priceCents: 1450,
    imageUrl: SEED_IMAGES.mealSeafood
  },
  {
    id: "seed-meal-solera-pan",
    restaurantId: "seed-rest-solera",
    name: "Pan con Tomate",
    description: "Grilled bread rubbed with ripe tomato, garlic, and olive oil.",
    priceCents: 750,
    imageUrl: SEED_IMAGES.mealBread
  },
  {
    id: "seed-meal-solera-croquetas",
    restaurantId: "seed-rest-solera",
    name: "Croquetas de Jamón (4)",
    description: "Creamy béchamel croquettes with jamón serrano.",
    priceCents: 1100,
    imageUrl: SEED_IMAGES.mealTapas
  },
  {
    id: "seed-meal-solera-paella",
    restaurantId: "seed-rest-solera",
    name: "Paella Valenciana (for 2)",
    description: "Bomba rice with rabbit, snails, green beans, and saffron.",
    priceCents: 4200,
    imageUrl: SEED_IMAGES.mealPaella
  },
  {
    id: "seed-meal-solera-crema",
    restaurantId: "seed-rest-solera",
    name: "Crema Catalana",
    description: "Caramelized custard with cinnamon and citrus zest.",
    priceCents: 850,
    imageUrl: SEED_IMAGES.mealDessert
  },
  // Cinco Tacos & Mezcal
  {
    id: "seed-meal-cinco-alpastor",
    restaurantId: "seed-rest-cinco",
    name: "Al Pastor Tacos (3)",
    description: "Marinated pork, pineapple, cilantro, and onion on corn tortillas.",
    priceCents: 1350,
    imageUrl: SEED_IMAGES.mealTaco
  },
  {
    id: "seed-meal-cinco-carnitas",
    restaurantId: "seed-rest-cinco",
    name: "Carnitas Tacos (3)",
    description: "Slow-braised pork shoulder with salsa verde and pickled onion.",
    priceCents: 1350,
    imageUrl: SEED_IMAGES.mealTaco
  },
  {
    id: "seed-meal-cinco-mahi",
    restaurantId: "seed-rest-cinco",
    name: "Mahi Mahi Tacos (3)",
    description: "Grilled mahi with cabbage slaw, avocado, and chipotle crema.",
    priceCents: 1500,
    imageUrl: SEED_IMAGES.mealTaco
  },
  {
    id: "seed-meal-cinco-elote",
    restaurantId: "seed-rest-cinco",
    name: "Elote",
    description: "Charred corn with cotija, lime, and ancho chili butter.",
    priceCents: 750,
    imageUrl: SEED_IMAGES.mealElote
  },
  {
    id: "seed-meal-cinco-guac",
    restaurantId: "seed-rest-cinco",
    name: "Guacamole & Chips",
    description: "Tableside-style guacamole with house-fried totopos.",
    priceCents: 1100,
    imageUrl: SEED_IMAGES.mealGuacamole
  },
  {
    id: "seed-meal-cinco-tresleches",
    restaurantId: "seed-rest-cinco",
    name: "Tres Leches",
    description: "Sponge cake soaked in three milks with whipped crema.",
    priceCents: 800,
    imageUrl: SEED_IMAGES.mealDessert
  },
  // Verdura
  {
    id: "seed-meal-verdura-harissa",
    restaurantId: "seed-rest-verdura",
    name: "Harissa Chicken Bowl",
    description: "Spiced chicken over freekeh with roasted vegetables and tahini.",
    priceCents: 1550,
    imageUrl: SEED_IMAGES.mealBowl
  },
  {
    id: "seed-meal-verdura-falafel",
    restaurantId: "seed-rest-verdura",
    name: "Falafel Mezze",
    description: "Crispy falafel with hummus, tabbouleh, and warm pita.",
    priceCents: 1400,
    imageUrl: SEED_IMAGES.mealFalafel
  },
  {
    id: "seed-meal-verdura-margherita",
    restaurantId: "seed-rest-verdura",
    name: "Wood-Fired Margherita",
    description: "San Marzano tomato, fresh mozzarella, and basil on sourdough crust.",
    priceCents: 1600,
    imageUrl: SEED_IMAGES.mealPizza
  },
  {
    id: "seed-meal-verdura-burrata",
    restaurantId: "seed-rest-verdura",
    name: "Burrata & Heirloom Tomato",
    description: "Creamy burrata with basil oil, balsamic, and flaky salt.",
    priceCents: 1450,
    imageUrl: SEED_IMAGES.mealSalad
  },
  {
    id: "seed-meal-verdura-cake",
    restaurantId: "seed-rest-verdura",
    name: "Lemon-Olive Oil Cake",
    description: "Moist citrus cake with mascarpone and candied lemon.",
    priceCents: 800,
    imageUrl: SEED_IMAGES.mealCake
  },
  // Roost & Rye
  {
    id: "seed-meal-roost-smash",
    restaurantId: "seed-rest-roost",
    name: "Smash Cheeseburger",
    description: "Double-smash patty, American cheese, pickles, and special sauce.",
    priceCents: 1400,
    imageUrl: SEED_IMAGES.mealBurger
  },
  {
    id: "seed-meal-roost-double",
    restaurantId: "seed-rest-roost",
    name: "Double Smash",
    description: "Two patties, two slices of cheese, grilled onion, and brioche bun.",
    priceCents: 1750,
    imageUrl: SEED_IMAGES.mealBurger
  },
  {
    id: "seed-meal-roost-nashville",
    restaurantId: "seed-rest-roost",
    name: "Nashville Hot Chicken Sandwich",
    description: "Crispy thigh, cayenne honey glaze, slaw, and potato bun.",
    priceCents: 1500,
    imageUrl: SEED_IMAGES.mealChicken
  },
  {
    id: "seed-meal-roost-tenders",
    restaurantId: "seed-rest-roost",
    name: "Buttermilk Tenders",
    description: "Four hand-breaded tenders with ranch and house hot sauce.",
    priceCents: 1350,
    imageUrl: SEED_IMAGES.mealChicken
  },
  {
    id: "seed-meal-roost-fries",
    restaurantId: "seed-rest-roost",
    name: "Truffle Fries",
    description: "Shoestring fries with truffle oil, parmesan, and parsley.",
    priceCents: 900,
    imageUrl: SEED_IMAGES.mealFries
  },
  {
    id: "seed-meal-roost-pie",
    restaurantId: "seed-rest-roost",
    name: "Bourbon Pecan Pie",
    description: "Warm pie with Kentucky bourbon, pecans, and vanilla ice cream.",
    priceCents: 950,
    imageUrl: SEED_IMAGES.mealPie
  },
  // Bodhi Bowl
  {
    id: "seed-meal-bodhi-kimchi",
    restaurantId: "seed-rest-bodhi",
    name: "Kimchi Fried Rice",
    description: "Wok-fried rice with house kimchi, sesame, and a soft egg.",
    priceCents: 1300,
    imageUrl: SEED_IMAGES.mealKimchi
  },
  {
    id: "seed-meal-bodhi-bibimbap",
    restaurantId: "seed-rest-bodhi",
    name: "Tofu Bibimbap",
    description: "Crispy tofu over rice with gochujang and seasonal vegetables.",
    priceCents: 1450,
    imageUrl: SEED_IMAGES.mealBibimbap
  },
  {
    id: "seed-meal-bodhi-bao",
    restaurantId: "seed-rest-bodhi",
    name: "Crispy Tempeh Bao (2)",
    description: "Steamed buns with marinated tempeh, pickled cucumber, and hoisin.",
    priceCents: 1100,
    imageUrl: SEED_IMAGES.mealBao
  },
  {
    id: "seed-meal-bodhi-curry",
    restaurantId: "seed-rest-bodhi",
    name: "Coconut Curry Noodles",
    description: "Rice noodles in coconut curry with bok choy and lime.",
    priceCents: 1450,
    imageUrl: SEED_IMAGES.mealNoodles
  },
  {
    id: "seed-meal-bodhi-brownie",
    restaurantId: "seed-rest-bodhi",
    name: "Matcha Brownie",
    description: "Fudgy brownie with ceremonial-grade matcha and white chocolate.",
    priceCents: 750,
    imageUrl: SEED_IMAGES.mealBrownie
  }
];

const COUPONS = [
  { restaurantId: "seed-rest-roost", code: "WELCOME10", percentOff: 10 },
  { restaurantId: "seed-rest-verdura", code: "LUNCH15", percentOff: 15 },
  { restaurantId: "seed-rest-mizu", code: "FIRSTBITE20", percentOff: 20 }
] as const;

const ORDERS: readonly OrderSeed[] = [
  {
    id: "seed-order-1",
    customerEmail: "customer@example.com",
    restaurantId: "seed-rest-mizu",
    couponCode: "FIRSTBITE20",
    status: OrderStatus.DELIVERED,
    tipCents: 400,
    subtotalCents: 2700,
    discountCents: 540,
    totalCents: 2560,
    placedAt: new Date("2026-05-26T19:00:00.000Z"),
    items: [
      {
        mealId: "seed-meal-mizu-nigiri",
        nameSnapshot: "Bluefin Tuna Nigiri (3pc)",
        priceCentsSnapshot: 1400,
        quantity: 1
      },
      {
        mealId: "seed-meal-mizu-roll",
        nameSnapshot: "Spicy Salmon Roll",
        priceCentsSnapshot: 1300,
        quantity: 1
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-26T19:00:00.000Z"),
        actorIsCustomer: true
      },
      {
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.PROCESSING,
        createdAt: new Date("2026-05-26T19:08:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.PROCESSING,
        toStatus: OrderStatus.IN_ROUTE,
        createdAt: new Date("2026-05-26T19:28:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.IN_ROUTE,
        toStatus: OrderStatus.DELIVERED,
        createdAt: new Date("2026-05-26T19:48:00.000Z"),
        actorIsCustomer: false
      }
    ]
  },
  {
    id: "seed-order-2",
    customerEmail: "customer@example.com",
    restaurantId: "seed-rest-solera",
    status: OrderStatus.DELIVERED,
    tipCents: 500,
    subtotalCents: 3350,
    discountCents: 0,
    totalCents: 3850,
    placedAt: new Date("2026-05-27T20:30:00.000Z"),
    items: [
      {
        mealId: "seed-meal-solera-bravas",
        nameSnapshot: "Patatas Bravas",
        priceCentsSnapshot: 950,
        quantity: 2
      },
      {
        mealId: "seed-meal-solera-gambas",
        nameSnapshot: "Gambas al Ajillo",
        priceCentsSnapshot: 1450,
        quantity: 1
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-27T20:30:00.000Z"),
        actorIsCustomer: true
      },
      {
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.PROCESSING,
        createdAt: new Date("2026-05-27T20:36:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.PROCESSING,
        toStatus: OrderStatus.IN_ROUTE,
        createdAt: new Date("2026-05-27T20:55:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.IN_ROUTE,
        toStatus: OrderStatus.DELIVERED,
        createdAt: new Date("2026-05-27T21:15:00.000Z"),
        actorIsCustomer: false
      }
    ]
  },
  {
    id: "seed-order-3",
    customerEmail: "customer@example.com",
    restaurantId: "seed-rest-verdura",
    couponCode: "LUNCH15",
    status: OrderStatus.RECEIVED,
    tipCents: 300,
    subtotalCents: 2950,
    discountCents: 442,
    totalCents: 2808,
    placedAt: new Date("2026-05-28T12:15:00.000Z"),
    items: [
      {
        mealId: "seed-meal-verdura-harissa",
        nameSnapshot: "Harissa Chicken Bowl",
        priceCentsSnapshot: 1550,
        quantity: 1
      },
      {
        mealId: "seed-meal-verdura-falafel",
        nameSnapshot: "Falafel Mezze",
        priceCentsSnapshot: 1400,
        quantity: 1
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-28T12:15:00.000Z"),
        actorIsCustomer: true
      },
      {
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.PROCESSING,
        createdAt: new Date("2026-05-28T12:22:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.PROCESSING,
        toStatus: OrderStatus.IN_ROUTE,
        createdAt: new Date("2026-05-28T12:40:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.IN_ROUTE,
        toStatus: OrderStatus.DELIVERED,
        createdAt: new Date("2026-05-28T13:00:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.DELIVERED,
        toStatus: OrderStatus.RECEIVED,
        createdAt: new Date("2026-05-28T13:12:00.000Z"),
        actorIsCustomer: true
      }
    ]
  },
  {
    id: "seed-order-4",
    customerEmail: "customer@example.com",
    restaurantId: "seed-rest-roost",
    couponCode: "WELCOME10",
    status: OrderStatus.IN_ROUTE,
    tipCents: 0,
    subtotalCents: 2300,
    discountCents: 230,
    totalCents: 2070,
    placedAt: new Date("2026-05-29T18:00:00.000Z"),
    items: [
      {
        mealId: "seed-meal-roost-smash",
        nameSnapshot: "Smash Cheeseburger",
        priceCentsSnapshot: 1400,
        quantity: 1
      },
      {
        mealId: "seed-meal-roost-fries",
        nameSnapshot: "Truffle Fries",
        priceCentsSnapshot: 900,
        quantity: 1
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-29T18:00:00.000Z"),
        actorIsCustomer: true
      },
      {
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.PROCESSING,
        createdAt: new Date("2026-05-29T18:06:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.PROCESSING,
        toStatus: OrderStatus.IN_ROUTE,
        createdAt: new Date("2026-05-29T18:24:00.000Z"),
        actorIsCustomer: false
      }
    ]
  },
  {
    id: "seed-order-5",
    customerEmail: "customer@example.com",
    restaurantId: "seed-rest-cinco",
    status: OrderStatus.PROCESSING,
    tipCents: 200,
    subtotalCents: 2700,
    discountCents: 0,
    totalCents: 2900,
    placedAt: new Date("2026-05-29T19:30:00.000Z"),
    items: [
      {
        mealId: "seed-meal-cinco-alpastor",
        nameSnapshot: "Al Pastor Tacos (3)",
        priceCentsSnapshot: 1350,
        quantity: 2
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-29T19:30:00.000Z"),
        actorIsCustomer: true
      },
      {
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.PROCESSING,
        createdAt: new Date("2026-05-29T19:36:00.000Z"),
        actorIsCustomer: false
      }
    ]
  },
  {
    id: "seed-order-6",
    customerEmail: "avery.chen@example.com",
    restaurantId: "seed-rest-bodhi",
    status: OrderStatus.PLACED,
    tipCents: 0,
    subtotalCents: 1300,
    discountCents: 0,
    totalCents: 1300,
    placedAt: new Date("2026-05-29T20:00:00.000Z"),
    items: [
      {
        mealId: "seed-meal-bodhi-kimchi",
        nameSnapshot: "Kimchi Fried Rice",
        priceCentsSnapshot: 1300,
        quantity: 1
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-29T20:00:00.000Z"),
        actorIsCustomer: true
      }
    ]
  },
  {
    id: "seed-order-7",
    customerEmail: "customer@example.com",
    restaurantId: "seed-rest-roost",
    status: OrderStatus.CANCELED,
    tipCents: 0,
    subtotalCents: 1500,
    discountCents: 0,
    totalCents: 1500,
    placedAt: new Date("2026-05-29T17:00:00.000Z"),
    items: [
      {
        mealId: "seed-meal-roost-nashville",
        nameSnapshot: "Nashville Hot Chicken Sandwich",
        priceCentsSnapshot: 1500,
        quantity: 1
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-29T17:00:00.000Z"),
        actorIsCustomer: true
      },
      {
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.CANCELED,
        createdAt: new Date("2026-05-29T17:03:00.000Z"),
        actorIsCustomer: true
      }
    ]
  },
  {
    id: "seed-order-8",
    customerEmail: "marcus.patel@example.com",
    restaurantId: "seed-rest-mizu",
    status: OrderStatus.RECEIVED,
    tipCents: 600,
    subtotalCents: 3200,
    discountCents: 0,
    totalCents: 3800,
    placedAt: new Date("2026-05-25T21:00:00.000Z"),
    items: [
      {
        mealId: "seed-meal-mizu-omakase",
        nameSnapshot: "Omakase Tasting (8pc)",
        priceCentsSnapshot: 3200,
        quantity: 1
      }
    ],
    timeline: [
      {
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        createdAt: new Date("2026-05-25T21:00:00.000Z"),
        actorIsCustomer: true
      },
      {
        fromStatus: OrderStatus.PLACED,
        toStatus: OrderStatus.PROCESSING,
        createdAt: new Date("2026-05-25T21:07:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.PROCESSING,
        toStatus: OrderStatus.IN_ROUTE,
        createdAt: new Date("2026-05-25T21:25:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.IN_ROUTE,
        toStatus: OrderStatus.DELIVERED,
        createdAt: new Date("2026-05-25T21:45:00.000Z"),
        actorIsCustomer: false
      },
      {
        fromStatus: OrderStatus.DELIVERED,
        toStatus: OrderStatus.RECEIVED,
        createdAt: new Date("2026-05-25T22:00:00.000Z"),
        actorIsCustomer: true
      }
    ]
  }
];

async function seedOrder(
  order: OrderSeed,
  usersByEmail: ReadonlyMap<string, { id: string }>,
  ownerId: string,
  couponsByKey: ReadonlyMap<string, { id: string }>
): Promise<void> {
  const customer = usersByEmail.get(order.customerEmail);
  if (!customer) {
    throw new Error(`Missing customer for order ${order.id}: ${order.customerEmail}`);
  }

  const couponId =
    order.couponCode === undefined
      ? null
      : (couponsByKey.get(`${order.restaurantId}:${order.couponCode}`)?.id ?? null);

  const existing = await prisma.order.findUnique({ where: { id: order.id } });

  if (existing) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: order.status }
    });
  } else {
    await prisma.order.create({
      data: {
        id: order.id,
        customerId: customer.id,
        restaurantId: order.restaurantId,
        ownerId,
        couponId,
        status: order.status,
        tipCents: order.tipCents,
        subtotalCents: order.subtotalCents,
        discountCents: order.discountCents,
        totalCents: order.totalCents,
        placedAt: order.placedAt,
        items: {
          create: order.items.map((item) => ({
            mealId: item.mealId,
            nameSnapshot: item.nameSnapshot,
            priceCentsSnapshot: item.priceCentsSnapshot,
            quantity: item.quantity
          }))
        }
      }
    });
  }

  for (const [index, event] of order.timeline.entries()) {
    const actorId = event.actorIsCustomer ? customer.id : ownerId;
    const actorRole = event.actorIsCustomer ? UserRole.CUSTOMER : UserRole.OWNER;

    await prisma.orderStatusEvent.upsert({
      where: { id: `${order.id}-event-${String(index)}` },
      update: {
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        createdAt: event.createdAt
      },
      create: {
        id: `${order.id}-event-${String(index)}`,
        orderId: order.id,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        actorId,
        actorRole,
        createdAt: event.createdAt
      }
    });
  }
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: { name: "Jordan Ellis" },
    create: {
      email: "owner@example.com",
      name: "Jordan Ellis",
      passwordHash,
      role: UserRole.OWNER
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: { name: "Sam Rivera" },
    create: {
      email: "customer@example.com",
      name: "Sam Rivera",
      passwordHash,
      role: UserRole.CUSTOMER
    }
  });

  const avery = await prisma.user.upsert({
    where: { email: "avery.chen@example.com" },
    update: { name: "Avery Chen" },
    create: {
      email: "avery.chen@example.com",
      name: "Avery Chen",
      passwordHash,
      role: UserRole.CUSTOMER
    }
  });

  const marcus = await prisma.user.upsert({
    where: { email: "marcus.patel@example.com" },
    update: { name: "Marcus Patel" },
    create: {
      email: "marcus.patel@example.com",
      name: "Marcus Patel",
      passwordHash,
      role: UserRole.CUSTOMER
    }
  });

  const usersByEmail = new Map(
    [owner, customer, avery, marcus].map((user) => [user.email, user] as const)
  );

  for (const restaurant of RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: {
        name: restaurant.name,
        description: restaurant.description,
        imageUrl: restaurant.imageUrl
      },
      create: {
        id: restaurant.id,
        ownerId: owner.id,
        name: restaurant.name,
        description: restaurant.description,
        imageUrl: restaurant.imageUrl
      }
    });
  }

  for (const meal of MEALS) {
    await prisma.meal.upsert({
      where: { id: meal.id },
      update: {
        restaurantId: meal.restaurantId,
        name: meal.name,
        description: meal.description,
        priceCents: meal.priceCents,
        imageUrl: meal.imageUrl,
        isActive: true
      },
      create: {
        id: meal.id,
        restaurantId: meal.restaurantId,
        name: meal.name,
        description: meal.description,
        priceCents: meal.priceCents,
        imageUrl: meal.imageUrl
      }
    });
  }

  const couponsByKey = new Map<string, { id: string }>();

  for (const coupon of COUPONS) {
    const record = await prisma.coupon.upsert({
      where: {
        restaurantId_code: { restaurantId: coupon.restaurantId, code: coupon.code }
      },
      update: { percentOff: coupon.percentOff, isActive: true },
      create: {
        restaurantId: coupon.restaurantId,
        code: coupon.code,
        percentOff: coupon.percentOff
      }
    });
    couponsByKey.set(`${coupon.restaurantId}:${coupon.code}`, record);
  }

  for (const order of ORDERS) {
    await seedOrder(order, usersByEmail, owner.id, couponsByKey);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
