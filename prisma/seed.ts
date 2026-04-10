import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding LeaseFlow database...");

  // ============================================================
  // COMPANY: Alterra Property Group / APG Living
  // ============================================================
  const alterra = await prisma.company.create({
    data: {
      name: "Alterra Property Group",
      slug: "alterra",
      website: "https://alterraproperty.com",
      phone: "(215) 399-2000",
      email: "info@alterraproperty.com",
      address: "1500 Walnut Street",
      city: "Philadelphia",
      state: "PA",
      zip: "19102",
      plan: "ENTERPRISE",
      portfolioBrowsingEnabled: true,
      settings: {
        applicationFee: 50,
        incomeRequirement: 3, // 3x rent
        defaultLeaseTerm: 12,
        amenityFee: 350,
      },
    },
  });

  // ============================================================
  // REGIONS
  // ============================================================
  const centerCity = await prisma.region.create({
    data: { companyId: alterra.id, name: "Center City Philadelphia" },
  });
  const fairmount = await prisma.region.create({
    data: { companyId: alterra.id, name: "Fairmount / Art Museum" },
  });
  const southPhilly = await prisma.region.create({
    data: { companyId: alterra.id, name: "South Philadelphia" },
  });
  const westPhilly = await prisma.region.create({
    data: { companyId: alterra.id, name: "West Philadelphia" },
  });
  const fishtown = await prisma.region.create({
    data: { companyId: alterra.id, name: "Fishtown / Northern Liberties" },
  });
  const mainLine = await prisma.region.create({
    data: { companyId: alterra.id, name: "Main Line Suburbs" },
  });
  const pittsburgh = await prisma.region.create({
    data: {
      companyId: alterra.id,
      name: "Pittsburgh",
      timezone: "America/New_York",
    },
  });

  // ============================================================
  // PROPERTIES (representative sample of Alterra portfolio)
  // ============================================================
  const versailles = await prisma.property.create({
    data: {
      companyId: alterra.id,
      regionId: centerCity.id,
      name: "The Versailles",
      slug: "versailles",
      address: "1530 Locust Street",
      city: "Philadelphia",
      state: "PA",
      zip: "19102",
      latitude: 39.9469,
      longitude: -75.1667,
      phone: "(833) 860-2019",
      email: "info@versaillesphilly.com",
      website: "versaillesphilly.com",
      description:
        "A 16-story historic high-rise in the heart of Rittenhouse Square, The Versailles underwent a $25M renovation blending classic architecture with modern luxury.",
      yearBuilt: 1920,
      totalUnits: 112,
      stories: 16,
      propertyType: "APARTMENT",
      petPolicy: {
        allowed: true,
        maxPets: 2,
        weightLimit: 75,
        monthlyRent: 35,
        deposit: 500,
      },
      officeHours: {
        mon: { open: "09:00", close: "18:00" },
        tue: { open: "09:00", close: "18:00" },
        wed: { open: "09:00", close: "18:00" },
        thu: { open: "09:00", close: "18:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "10:00", close: "17:00" },
        sun: null,
      },
    },
  });

  const theArch = await prisma.property.create({
    data: {
      companyId: alterra.id,
      regionId: centerCity.id,
      name: "The Arch",
      slug: "the-arch",
      address: "1701 Arch Street",
      city: "Philadelphia",
      state: "PA",
      zip: "19103",
      latitude: 39.9546,
      longitude: -75.1683,
      phone: "(215) 399-2100",
      email: "info@thearchphilly.com",
      description:
        "Modern high-rise living in the heart of Logan Square with panoramic city views and resort-style amenities.",
      yearBuilt: 2018,
      totalUnits: 250,
      stories: 28,
      propertyType: "APARTMENT",
      petPolicy: {
        allowed: true,
        maxPets: 2,
        weightLimit: 75,
        monthlyRent: 50,
        deposit: 500,
      },
      officeHours: {
        mon: { open: "09:00", close: "18:00" },
        tue: { open: "09:00", close: "18:00" },
        wed: { open: "09:00", close: "18:00" },
        thu: { open: "09:00", close: "18:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "10:00", close: "17:00" },
        sun: null,
      },
    },
  });

  const stableLofts = await prisma.property.create({
    data: {
      companyId: alterra.id,
      regionId: centerCity.id,
      name: "Stable Lofts",
      slug: "stable-lofts",
      address: "20 N 3rd Street",
      city: "Philadelphia",
      state: "PA",
      zip: "19106",
      latitude: 39.9512,
      longitude: -75.1465,
      description:
        "Adaptive reuse loft-style apartments in Old City with exposed brick, soaring ceilings, and industrial character.",
      yearBuilt: 1890,
      totalUnits: 45,
      stories: 5,
      propertyType: "APARTMENT",
      petPolicy: {
        allowed: true,
        maxPets: 2,
        weightLimit: 50,
        monthlyRent: 35,
        deposit: 500,
      },
      officeHours: {
        mon: { open: "09:00", close: "18:00" },
        tue: { open: "09:00", close: "18:00" },
        wed: { open: "09:00", close: "18:00" },
        thu: { open: "09:00", close: "18:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "10:00", close: "15:00" },
        sun: null,
      },
    },
  });

  const textileLofts = await prisma.property.create({
    data: {
      companyId: alterra.id,
      regionId: southPhilly.id,
      name: "Textile Lofts",
      slug: "textile-lofts",
      address: "2115 South Street",
      city: "Philadelphia",
      state: "PA",
      zip: "19146",
      latitude: 39.9434,
      longitude: -75.1794,
      description:
        "Converted industrial space offering loft-style living in the Graduate Hospital neighborhood.",
      yearBuilt: 1910,
      totalUnits: 60,
      stories: 4,
      propertyType: "APARTMENT",
      petPolicy: {
        allowed: true,
        maxPets: 2,
        weightLimit: 60,
        monthlyRent: 35,
        deposit: 500,
      },
      officeHours: {
        mon: { open: "09:00", close: "18:00" },
        tue: { open: "09:00", close: "18:00" },
        wed: { open: "09:00", close: "18:00" },
        thu: { open: "09:00", close: "18:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "10:00", close: "15:00" },
        sun: null,
      },
    },
  });

  const fairmountNorth = await prisma.property.create({
    data: {
      companyId: alterra.id,
      regionId: fairmount.id,
      name: "Fairmount North",
      slug: "fairmount-north",
      address: "1833 Fairmount Avenue",
      city: "Philadelphia",
      state: "PA",
      zip: "19130",
      latitude: 39.9674,
      longitude: -75.1715,
      description:
        "Modern apartments in the Fairmount neighborhood, steps from the Art Museum and Fairmount Park.",
      yearBuilt: 2016,
      totalUnits: 80,
      stories: 5,
      propertyType: "APARTMENT",
      petPolicy: {
        allowed: true,
        maxPets: 2,
        weightLimit: 75,
        monthlyRent: 35,
        deposit: 500,
      },
      officeHours: {
        mon: { open: "09:00", close: "18:00" },
        tue: { open: "09:00", close: "18:00" },
        wed: { open: "09:00", close: "18:00" },
        thu: { open: "09:00", close: "18:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "10:00", close: "17:00" },
        sun: null,
      },
    },
  });

  const twentyThreeWest = await prisma.property.create({
    data: {
      companyId: alterra.id,
      regionId: fishtown.id,
      name: "23 West",
      slug: "23-west",
      address: "23 W Girard Avenue",
      city: "Philadelphia",
      state: "PA",
      zip: "19123",
      latitude: 39.9679,
      longitude: -75.1390,
      description:
        "Contemporary living in Fishtown, one of Philadelphia's most vibrant neighborhoods.",
      yearBuilt: 2020,
      totalUnits: 120,
      stories: 6,
      propertyType: "MIXED_USE",
      petPolicy: {
        allowed: true,
        maxPets: 2,
        weightLimit: 75,
        monthlyRent: 35,
        deposit: 500,
      },
      officeHours: {
        mon: { open: "09:00", close: "18:00" },
        tue: { open: "09:00", close: "18:00" },
        wed: { open: "09:00", close: "18:00" },
        thu: { open: "09:00", close: "18:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "10:00", close: "17:00" },
        sun: null,
      },
    },
  });

  const gardenCourt = await prisma.property.create({
    data: {
      companyId: alterra.id,
      regionId: westPhilly.id,
      name: "Garden Court Towers",
      slug: "garden-court-towers",
      address: "4701 Pine Street",
      city: "Philadelphia",
      state: "PA",
      zip: "19143",
      latitude: 39.9525,
      longitude: -75.2137,
      description:
        "Garden-style apartments in West Philadelphia near University City.",
      yearBuilt: 1960,
      totalUnits: 200,
      stories: 12,
      propertyType: "APARTMENT",
      petPolicy: {
        allowed: true,
        maxPets: 2,
        weightLimit: 50,
        monthlyRent: 25,
        deposit: 300,
      },
      officeHours: {
        mon: { open: "09:00", close: "17:00" },
        tue: { open: "09:00", close: "17:00" },
        wed: { open: "09:00", close: "17:00" },
        thu: { open: "09:00", close: "17:00" },
        fri: { open: "09:00", close: "17:00" },
        sat: { open: "10:00", close: "14:00" },
        sun: null,
      },
    },
  });

  // ============================================================
  // AMENITIES
  // ============================================================
  const amenityData = [
    // Versailles
    { propertyId: versailles.id, name: "24hr Concierge", category: "building", icon: "concierge" },
    { propertyId: versailles.id, name: "Fitness Center", category: "fitness", icon: "fitness_center" },
    { propertyId: versailles.id, name: "Yoga Studio", category: "fitness", icon: "self_improvement" },
    { propertyId: versailles.id, name: "Rooftop Lounge", category: "community", icon: "deck" },
    { propertyId: versailles.id, name: "Rooftop Dog Park", category: "outdoor", icon: "pets" },
    { propertyId: versailles.id, name: "Business Center", category: "community", icon: "business_center" },
    { propertyId: versailles.id, name: "Guest Suite", category: "community", icon: "hotel" },
    { propertyId: versailles.id, name: "In-Unit Washer/Dryer", category: "unit", icon: "local_laundry_service" },
    { propertyId: versailles.id, name: "Hardwood Floors", category: "unit", icon: "grid_on" },
    // The Arch
    { propertyId: theArch.id, name: "Rooftop Pool", category: "outdoor", icon: "pool" },
    { propertyId: theArch.id, name: "Fitness Center", category: "fitness", icon: "fitness_center" },
    { propertyId: theArch.id, name: "Co-Working Space", category: "community", icon: "work" },
    { propertyId: theArch.id, name: "Parking Garage", category: "building", icon: "local_parking" },
    { propertyId: theArch.id, name: "Package Lockers", category: "building", icon: "markunread_mailbox" },
    // Stable Lofts
    { propertyId: stableLofts.id, name: "Exposed Brick Walls", category: "unit", icon: "wallpaper" },
    { propertyId: stableLofts.id, name: "14ft Ceilings", category: "unit", icon: "height" },
    { propertyId: stableLofts.id, name: "Bike Storage", category: "building", icon: "pedal_bike" },
  ];

  await prisma.propertyAmenity.createMany({ data: amenityData });

  // ============================================================
  // FLOOR PLANS (sample for Versailles)
  // ============================================================
  const studioClassic = await prisma.floorPlan.create({
    data: {
      propertyId: versailles.id,
      name: "Studio Classic",
      bedrooms: 0,
      bathrooms: 1,
      sqft: 440,
      basePrice: 2088,
    },
  });

  const residenceA = await prisma.floorPlan.create({
    data: {
      propertyId: versailles.id,
      name: "Residence A - Executive",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 1238,
      basePrice: 3205,
    },
  });

  const residenceA1 = await prisma.floorPlan.create({
    data: {
      propertyId: versailles.id,
      name: "Residence A1 - Junior",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 621,
      basePrice: 2108,
    },
  });

  const residenceF = await prisma.floorPlan.create({
    data: {
      propertyId: versailles.id,
      name: "Residence F - Executive 2BR",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1341,
      basePrice: 4355,
    },
  });

  const penthouse3br = await prisma.floorPlan.create({
    data: {
      propertyId: versailles.id,
      name: "Penthouse 3BR + Den",
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 1883,
      basePrice: 8829,
    },
  });

  // Floor plans for The Arch
  const archStudio = await prisma.floorPlan.create({
    data: {
      propertyId: theArch.id,
      name: "Sky Studio",
      bedrooms: 0,
      bathrooms: 1,
      sqft: 520,
      basePrice: 2200,
    },
  });

  const arch1br = await prisma.floorPlan.create({
    data: {
      propertyId: theArch.id,
      name: "City View 1BR",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 750,
      basePrice: 2800,
    },
  });

  const arch2br = await prisma.floorPlan.create({
    data: {
      propertyId: theArch.id,
      name: "Skyline 2BR",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1100,
      basePrice: 4200,
    },
  });

  // ============================================================
  // UNITS (sample units across properties)
  // ============================================================
  const unitData = [
    // Versailles
    { propertyId: versailles.id, floorPlanId: studioClassic.id, unitNumber: "201", floor: 2, bedrooms: 0, bathrooms: 1, sqft: 440, marketRent: 2088, status: "VACANT" as const, availableDate: new Date("2026-05-01") },
    { propertyId: versailles.id, floorPlanId: studioClassic.id, unitNumber: "301", floor: 3, bedrooms: 0, bathrooms: 1, sqft: 445, marketRent: 2125, status: "OCCUPIED" as const },
    { propertyId: versailles.id, floorPlanId: residenceA1.id, unitNumber: "405", floor: 4, bedrooms: 1, bathrooms: 1, sqft: 625, marketRent: 2150, status: "NOTICE_GIVEN" as const, moveOutDate: new Date("2026-05-15"), availableDate: new Date("2026-06-01") },
    { propertyId: versailles.id, floorPlanId: residenceA.id, unitNumber: "802", floor: 8, bedrooms: 1, bathrooms: 1, sqft: 1240, marketRent: 3250, status: "VACANT" as const, availableDate: new Date("2026-04-15") },
    { propertyId: versailles.id, floorPlanId: residenceF.id, unitNumber: "1004", floor: 10, bedrooms: 2, bathrooms: 2, sqft: 1345, marketRent: 4400, status: "OCCUPIED" as const },
    { propertyId: versailles.id, floorPlanId: penthouse3br.id, unitNumber: "PH1", floor: 16, bedrooms: 3, bathrooms: 2.5, sqft: 1890, marketRent: 8900, status: "VACANT" as const, availableDate: new Date("2026-04-10") },
    // The Arch
    { propertyId: theArch.id, floorPlanId: archStudio.id, unitNumber: "1201", floor: 12, bedrooms: 0, bathrooms: 1, sqft: 520, marketRent: 2250, status: "VACANT" as const, availableDate: new Date("2026-04-20") },
    { propertyId: theArch.id, floorPlanId: arch1br.id, unitNumber: "1805", floor: 18, bedrooms: 1, bathrooms: 1, sqft: 755, marketRent: 2950, status: "VACANT" as const, availableDate: new Date("2026-05-01") },
    { propertyId: theArch.id, floorPlanId: arch2br.id, unitNumber: "2201", floor: 22, bedrooms: 2, bathrooms: 2, sqft: 1105, marketRent: 4500, status: "NOTICE_GIVEN" as const, moveOutDate: new Date("2026-06-01"), availableDate: new Date("2026-06-15") },
    { propertyId: theArch.id, floorPlanId: arch1br.id, unitNumber: "503", floor: 5, bedrooms: 1, bathrooms: 1, sqft: 748, marketRent: 2800, status: "OCCUPIED" as const },
    // Stable Lofts
    { propertyId: stableLofts.id, floorPlanId: null, unitNumber: "2A", floor: 2, bedrooms: 1, bathrooms: 1, sqft: 850, marketRent: 2095, status: "VACANT" as const, availableDate: new Date("2026-04-15"), features: { exposedBrick: true, ceilingHeight: 14 } },
    { propertyId: stableLofts.id, floorPlanId: null, unitNumber: "3B", floor: 3, bedrooms: 2, bathrooms: 1, sqft: 1200, marketRent: 2800, status: "OCCUPIED" as const, features: { exposedBrick: true, ceilingHeight: 14, skylight: true } },
    // Textile Lofts
    { propertyId: textileLofts.id, floorPlanId: null, unitNumber: "101", floor: 1, bedrooms: 0, bathrooms: 1, sqft: 500, marketRent: 1395, status: "VACANT" as const, availableDate: new Date("2026-04-10") },
    { propertyId: textileLofts.id, floorPlanId: null, unitNumber: "204", floor: 2, bedrooms: 1, bathrooms: 1, sqft: 700, marketRent: 1750, status: "VACANT" as const, availableDate: new Date("2026-05-01") },
    // Fairmount North
    { propertyId: fairmountNorth.id, floorPlanId: null, unitNumber: "310", floor: 3, bedrooms: 1, bathrooms: 1, sqft: 680, marketRent: 1950, status: "VACANT" as const, availableDate: new Date("2026-04-15") },
    { propertyId: fairmountNorth.id, floorPlanId: null, unitNumber: "415", floor: 4, bedrooms: 2, bathrooms: 2, sqft: 1050, marketRent: 2800, status: "NOTICE_GIVEN" as const, moveOutDate: new Date("2026-05-30"), availableDate: new Date("2026-06-15") },
    // 23 West
    { propertyId: twentyThreeWest.id, floorPlanId: null, unitNumber: "102", floor: 1, bedrooms: 0, bathrooms: 1, sqft: 480, marketRent: 1650, status: "VACANT" as const, availableDate: new Date("2026-04-10") },
    { propertyId: twentyThreeWest.id, floorPlanId: null, unitNumber: "305", floor: 3, bedrooms: 1, bathrooms: 1, sqft: 720, marketRent: 2100, status: "VACANT" as const, availableDate: new Date("2026-04-20") },
    // Garden Court
    { propertyId: gardenCourt.id, floorPlanId: null, unitNumber: "601", floor: 6, bedrooms: 1, bathrooms: 1, sqft: 650, marketRent: 1450, status: "VACANT" as const, availableDate: new Date("2026-04-10") },
    { propertyId: gardenCourt.id, floorPlanId: null, unitNumber: "802", floor: 8, bedrooms: 2, bathrooms: 1, sqft: 900, marketRent: 1850, status: "VACANT" as const, availableDate: new Date("2026-05-01") },
  ];

  for (const unit of unitData) {
    await prisma.unit.create({ data: unit });
  }

  // ============================================================
  // USERS & AGENTS
  // ============================================================
  const passwordHash = await bcrypt.hash("leaseflow2026", 12);

  // Company Admin
  const adminUser = await prisma.user.create({
    data: {
      companyId: alterra.id,
      email: "eric.babroff@alterra.com",
      name: "Eric Babroff",
      role: "COMPANY_ADMIN",
      passwordHash,
    },
  });

  // Regional Manager
  const regionalUser = await prisma.user.create({
    data: {
      companyId: alterra.id,
      email: "teresa.steinberger@alterra.com",
      name: "Teresa Steinberger",
      role: "REGIONAL_MANAGER",
      passwordHash,
    },
  });

  // Property Managers / Agents
  const agents = [
    {
      email: "bryan.causey@alterra.com",
      name: "Bryan Causey",
      role: "PROPERTY_MANAGER" as const,
      title: "Property Manager",
      transportMode: "CAR" as const,
      bufferMinutes: 15,
      properties: [versailles.id, theArch.id], // Manages two Center City buildings
    },
    {
      email: "shelton.hackett@alterra.com",
      name: "Shelton Hackett Jr.",
      role: "PROPERTY_MANAGER" as const,
      title: "Property Manager",
      transportMode: "BIKE" as const,
      bufferMinutes: 10,
      properties: [stableLofts.id, textileLofts.id], // Manages two loft properties
    },
    {
      email: "justina.hill@alterra.com",
      name: "Justina Hill",
      role: "PROPERTY_MANAGER" as const,
      title: "Property Manager",
      transportMode: "TRANSIT" as const,
      bufferMinutes: 20,
      properties: [fairmountNorth.id, twentyThreeWest.id], // North Philly properties
    },
    {
      email: "avery.martin@alterra.com",
      name: "Avery Martin-Chadwick",
      role: "AGENT" as const,
      title: "Leasing Agent",
      transportMode: "CAR" as const,
      bufferMinutes: 15,
      properties: [versailles.id, theArch.id, stableLofts.id], // Roaming agent, Center City
    },
    {
      email: "kevin.stone@alterra.com",
      name: "Kevin Stone",
      role: "PROPERTY_MANAGER" as const,
      title: "Property Manager",
      transportMode: "CAR" as const,
      bufferMinutes: 20,
      properties: [gardenCourt.id], // West Philly - dedicated PM
    },
  ];

  for (const agentData of agents) {
    const user = await prisma.user.create({
      data: {
        companyId: alterra.id,
        email: agentData.email,
        name: agentData.name,
        role: agentData.role,
        passwordHash,
      },
    });

    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        companyId: alterra.id,
        title: agentData.title,
        transportMode: agentData.transportMode,
        bufferMinutes: agentData.bufferMinutes,
      },
    });

    // Assign properties
    for (let i = 0; i < agentData.properties.length; i++) {
      await prisma.agentProperty.create({
        data: {
          agentId: agent.id,
          propertyId: agentData.properties[i],
          isPrimary: i === 0,
        },
      });
    }
  }

  // ============================================================
  // SAMPLE PROSPECTS
  // ============================================================
  const prospect1 = await prisma.prospect.create({
    data: {
      companyId: alterra.id,
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@example.com",
      phone: "(215) 555-0101",
      desiredBedrooms: 1,
      budgetMin: 2000,
      budgetMax: 3000,
      desiredMoveIn: new Date("2026-05-01"),
      hasPets: false,
      status: "TOUR_SCHEDULED",
      source: "apartments.com",
    },
  });

  const prospect2 = await prisma.prospect.create({
    data: {
      companyId: alterra.id,
      firstName: "Marcus",
      lastName: "Williams",
      email: "marcus.w@example.com",
      phone: "(215) 555-0202",
      desiredBedrooms: 2,
      budgetMin: 3500,
      budgetMax: 5000,
      desiredMoveIn: new Date("2026-06-01"),
      hasPets: true,
      petDetails: "1 golden retriever, 60 lbs",
      status: "INQUIRY",
      source: "website",
    },
  });

  const prospect3 = await prisma.prospect.create({
    data: {
      companyId: alterra.id,
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "emily.r@example.com",
      phone: "(267) 555-0303",
      desiredBedrooms: 0,
      budgetMin: 1300,
      budgetMax: 1800,
      desiredMoveIn: new Date("2026-04-15"),
      hasPets: false,
      status: "TOURED",
      source: "zillow",
    },
  });

  // Super admin (platform admin - us)
  await prisma.user.create({
    data: {
      email: "admin@leaseflow.app",
      name: "LeaseFlow Admin",
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  console.log("Seed complete!");
  console.log(`  Company: ${alterra.name}`);
  console.log(`  Regions: 7`);
  console.log(`  Properties: 7`);
  console.log(`  Units: ${unitData.length}`);
  console.log(`  Users: ${agents.length + 3}`);
  console.log(`  Prospects: 3`);
  console.log(`\n  Login: any email above / password: leaseflow2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
