export interface BodyData {
  id: string;
  name: string;
  classification: string;
  parentId?: string;
  shaderType: number;
  // Real Astronomical Metrics
  diameterKm: number;
  massEarths: number;
  gravityMs2: number;
  rotationPeriodHours: number; // Negative = retrograde
  orbitalPeriodDays: number;
  semiMajorAxisAU: number;
  orbitalInclinationDeg: number;
  axialTiltDeg: number;
  meanTempC: number;
  moonsCount: number;
  // Scene Visual vs True Relative Scale
  visualRadius: number;
  trueScaleRadius: number;
  visualOrbitRadius: number;
  trueOrbitRadius: number;
  initialPhaseRad: number;
  // Visual Palette & Audio Signature
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  atmosphereColor: string;
  hasAtmosphere: boolean;
  hasRings?: boolean;
  droneBaseFreq: number;
  // Educational Copy
  description: string;
  facts: string[];
  tourCaption: string;
}

export const SOLAR_BODIES: BodyData[] = [
  {
    id: 'sun',
    name: 'Sun',
    classification: 'G2V Main-Sequence Star',
    shaderType: 0,
    diameterKm: 1392700,
    massEarths: 333000,
    gravityMs2: 274.0,
    rotationPeriodHours: 609.12,
    orbitalPeriodDays: 1,
    semiMajorAxisAU: 0,
    orbitalInclinationDeg: 0,
    axialTiltDeg: 7.25,
    meanTempC: 5505,
    moonsCount: 0,
    visualRadius: 9.5,
    trueScaleRadius: 12.0,
    visualOrbitRadius: 0,
    trueOrbitRadius: 0,
    initialPhaseRad: 0,
    primaryColor: '#ff9e2c',
    secondaryColor: '#ff4500',
    tertiaryColor: '#fff2b2',
    atmosphereColor: '#ffaa33',
    hasAtmosphere: false,
    droneBaseFreq: 65.41,
    description:
      'The gravitational anchor and radiative heart of the Solar System, comprising 99.86% of its total mass. Driven by thermonuclear fusion of hydrogen into helium within a 15-million-kelvin core.',
    facts: [
      'Emits 3.828 × 10²⁶ watts of electromagnetic energy every second.',
      'Magnetic field reversals drive an 11-year solar sunspot and coronal mass ejection cycle.',
      'Photons generated in the core take ~100,000 years to traverse the radiative zone.'
    ],
    tourCaption:
      'Welcome to HELIOS. At the center of our ephemeris burns Sol—a turbulent sphere of magnetized plasma whose convective cells span thousands of kilometers.'
  },
  {
    id: 'mercury',
    name: 'Mercury',
    classification: 'Terrestrial Planet',
    shaderType: 1,
    diameterKm: 4879,
    massEarths: 0.055,
    gravityMs2: 3.7,
    rotationPeriodHours: 1407.6,
    orbitalPeriodDays: 87.97,
    semiMajorAxisAU: 0.387,
    orbitalInclinationDeg: 7.0,
    axialTiltDeg: 0.03,
    meanTempC: 167,
    moonsCount: 0,
    visualRadius: 1.15,
    trueScaleRadius: 0.28,
    visualOrbitRadius: 20,
    trueOrbitRadius: 24,
    initialPhaseRad: 0.8,
    primaryColor: '#8e8a86',
    secondaryColor: '#56524e',
    tertiaryColor: '#c2bdb8',
    atmosphereColor: '#999999',
    hasAtmosphere: false,
    droneBaseFreq: 146.83,
    description:
      'The innermost and smallest planet, scarred by ancient impact basins including the 1,550 km Caloris Planitia. Mercury possesses a disproportionately massive iron core.',
    facts: [
      'Locked in a 3:2 spin-orbit resonance: three sidereal days equal two Mercurian years.',
      'Surface temperatures swing from -180 °C at night to +430 °C at perihelion noon.',
      'Tectonic lobate scarps formed as its interior cooled and contracted by ~7 km.'
    ],
    tourCaption:
      'Scorched by solar wind at 0.39 AU, Mercury races along the steepest orbital gradient in the system.'
  },
  {
    id: 'venus',
    name: 'Venus',
    classification: 'Terrestrial Planet',
    shaderType: 2,
    diameterKm: 12104,
    massEarths: 0.815,
    gravityMs2: 8.87,
    rotationPeriodHours: -5832.5,
    orbitalPeriodDays: 224.7,
    semiMajorAxisAU: 0.723,
    orbitalInclinationDeg: 3.39,
    axialTiltDeg: 177.36,
    meanTempC: 464,
    moonsCount: 0,
    visualRadius: 1.85,
    trueScaleRadius: 0.65,
    visualOrbitRadius: 31,
    trueOrbitRadius: 45,
    initialPhaseRad: 2.1,
    primaryColor: '#e3bb76',
    secondaryColor: '#b57c3c',
    tertiaryColor: '#f7dfa8',
    atmosphereColor: '#ffcf7c',
    hasAtmosphere: true,
    droneBaseFreq: 110.0,
    description:
      'Shrouded beneath opaque sulfuric acid cloud decks, Venus experiences a runaway greenhouse effect with crushing surface pressures 92 times that of Earth.',
    facts: [
      'Rotates retrograde—the Sun rises in the west and sets in the east.',
      'Upper atmosphere super-rotates around the planet in just 4 Earth days.',
      'Volcanic plains and coronae resurfaced most of the crust 300–600 million years ago.'
    ],
    tourCaption:
      'Beneath Venus’s golden super-rotating cloud bands lies a high-pressure volcanic furnace hotter than Mercury.'
  },
  {
    id: 'earth',
    name: 'Earth',
    classification: 'Terrestrial World',
    shaderType: 3,
    diameterKm: 12742,
    massEarths: 1.0,
    gravityMs2: 9.81,
    rotationPeriodHours: 23.93,
    orbitalPeriodDays: 365.256,
    semiMajorAxisAU: 1.0,
    orbitalInclinationDeg: 0.0,
    axialTiltDeg: 23.44,
    meanTempC: 15,
    moonsCount: 1,
    visualRadius: 2.0,
    trueScaleRadius: 0.7,
    visualOrbitRadius: 44,
    trueOrbitRadius: 62,
    initialPhaseRad: 3.6,
    primaryColor: '#1f6ed4',
    secondaryColor: '#2e8b57',
    tertiaryColor: '#ffffff',
    atmosphereColor: '#4da6ff',
    hasAtmosphere: true,
    droneBaseFreq: 130.81,
    description:
      'Our home world and the only known harbor of life. Liquid water oceans cover 71% of its crust, shielded from cosmic radiation by a dipolar magnetosphere.',
    facts: [
      'Active plate tectonics continuously recycle carbon and regulate surface climate.',
      'Nitrogen-oxygen atmosphere scatters blue wavelengths and sustains the biosphere.',
      'Orbital speed averages 29.78 km/s (107,200 km/h) around the solar barycenter.'
    ],
    tourCaption:
      'At 1.00 AU lies the Pale Blue Dot—an oasis of dynamic liquid oceans, swirling weather systems, and nocturnal city lights.'
  },
  {
    id: 'moon',
    name: 'Moon (Luna)',
    classification: 'Natural Satellite',
    parentId: 'earth',
    shaderType: 1,
    diameterKm: 3474,
    massEarths: 0.0123,
    gravityMs2: 1.62,
    rotationPeriodHours: 655.7,
    orbitalPeriodDays: 27.32,
    semiMajorAxisAU: 0.00257,
    orbitalInclinationDeg: 5.14,
    axialTiltDeg: 6.68,
    meanTempC: -23,
    moonsCount: 0,
    visualRadius: 0.54,
    trueScaleRadius: 0.19,
    visualOrbitRadius: 4.8,
    trueOrbitRadius: 2.2,
    initialPhaseRad: 1.2,
    primaryColor: '#b0b5bd',
    secondaryColor: '#696e75',
    tertiaryColor: '#e2e6ec',
    atmosphereColor: '#888888',
    hasAtmosphere: false,
    droneBaseFreq: 196.0,
    description:
      'Earth’s tidally locked companion, formed ~4.5 billion years ago from debris ejected by a giant impact between proto-Earth and a Mars-sized body (Theia).',
    facts: [
      'Stabilizes Earth’s axial obliquity within a narrow ~2.4° oscillation band.',
      'Dark basaltic maria cover ~16% of the surface, mostly on the near side.',
      'Drifts away from Earth at 3.8 cm per year due to tidal angular momentum transfer.'
    ],
    tourCaption:
      'Tidally locked to Earth, Luna’s ancient basaltic seas and highland craters preserve a 4.5-billion-year impact record.'
  },
  {
    id: 'mars',
    name: 'Mars',
    classification: 'Terrestrial Planet',
    shaderType: 4,
    diameterKm: 6779,
    massEarths: 0.107,
    gravityMs2: 3.72,
    rotationPeriodHours: 24.62,
    orbitalPeriodDays: 686.98,
    semiMajorAxisAU: 1.524,
    orbitalInclinationDeg: 1.85,
    axialTiltDeg: 25.19,
    meanTempC: -65,
    moonsCount: 2,
    visualRadius: 1.45,
    trueScaleRadius: 0.38,
    visualOrbitRadius: 58,
    trueOrbitRadius: 94,
    initialPhaseRad: 5.0,
    primaryColor: '#d15630',
    secondaryColor: '#7a2b16',
    tertiaryColor: '#e89b72',
    atmosphereColor: '#e07a5f',
    hasAtmosphere: true,
    droneBaseFreq: 98.0,
    description:
      'The Red Planet, colored by ubiquitous iron(III) oxide dust. Home to Olympus Mons—the largest volcano in the Solar System—and the 4,000 km Valles Marineris canyon.',
    facts: [
      'Tenous CO₂ atmosphere exerts only ~0.6% of Earth’s sea-level pressure.',
      'Ancient river deltas and phyllosilicates confirm liquid water once flowed openly.',
      'Captured asteroid moons Phobos and Deimos orbit rapidly above its equator.'
    ],
    tourCaption:
      'Beyond Earth orbits rusty Mars—a desert world of colossal shield volcanoes, global dust storms, and frozen polar caps.'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    classification: 'Gas Giant',
    shaderType: 5,
    diameterKm: 139820,
    massEarths: 317.8,
    gravityMs2: 24.79,
    rotationPeriodHours: 9.93,
    orbitalPeriodDays: 4332.59,
    semiMajorAxisAU: 5.204,
    orbitalInclinationDeg: 1.3,
    axialTiltDeg: 3.13,
    meanTempC: -110,
    moonsCount: 95,
    visualRadius: 4.6,
    trueScaleRadius: 3.2,
    visualOrbitRadius: 84,
    trueOrbitRadius: 155,
    initialPhaseRad: 1.7,
    primaryColor: '#d9a773',
    secondaryColor: '#9c5a3c',
    tertiaryColor: '#f2dec4',
    atmosphereColor: '#e0b384',
    hasAtmosphere: true,
    droneBaseFreq: 55.0,
    description:
      'The colossus of the planetary system, more than twice as massive as all other planets combined. Rapid 10-hour rotation stretches ammonia clouds into counter-flowing zonal bands.',
    facts: [
      'The Great Red Spot is a high-pressure anticyclonic vortex larger than Earth.',
      'Deep interior compresses hydrogen into a conductive liquid metallic state.',
      'Commands a vast magnetosphere and the four Galilean moons: Io, Europa, Ganymede, Callisto.'
    ],
    tourCaption:
      'Crossing the Main Asteroid Belt brings us to Jupiter—a sovereign gas giant of counter-rotating jet streams and the Great Red Spot.'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    classification: 'Gas Giant',
    shaderType: 6,
    diameterKm: 116460,
    massEarths: 95.16,
    gravityMs2: 10.44,
    rotationPeriodHours: 10.7,
    orbitalPeriodDays: 10759.22,
    semiMajorAxisAU: 9.582,
    orbitalInclinationDeg: 2.49,
    axialTiltDeg: 26.73,
    meanTempC: -140,
    moonsCount: 146,
    visualRadius: 3.85,
    trueScaleRadius: 2.7,
    visualOrbitRadius: 112,
    trueOrbitRadius: 225,
    initialPhaseRad: 4.1,
    primaryColor: '#e6c994',
    secondaryColor: '#b89760',
    tertiaryColor: '#f7ebd4',
    atmosphereColor: '#ebd2a4',
    hasAtmosphere: true,
    hasRings: true,
    droneBaseFreq: 73.42,
    description:
      'Adorned by the most extensive ring system in the Solar System—billions of water-ice particles sculpted by shepherd moons and orbital resonances across 282,000 km.',
    facts: [
      'Mean bulk density is 0.687 g/cm³—less dense than liquid water.',
      'A persistent 30,000-km hexagonal jet stream encircles its north pole.',
      'Moons Titan (methane lakes) and Enceladus (cryovolcanic plumes) are prime astrobiology targets.'
    ],
    tourCaption:
      'Saturn’s crystalline water-ice rings cast sharp geometric shadows across its golden oblate atmosphere.'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    classification: 'Ice Giant',
    shaderType: 7,
    diameterKm: 50724,
    massEarths: 14.54,
    gravityMs2: 8.69,
    rotationPeriodHours: -17.24,
    orbitalPeriodDays: 30688.5,
    semiMajorAxisAU: 19.218,
    orbitalInclinationDeg: 0.77,
    axialTiltDeg: 97.77,
    meanTempC: -195,
    moonsCount: 28,
    visualRadius: 2.65,
    trueScaleRadius: 1.35,
    visualOrbitRadius: 138,
    trueOrbitRadius: 300,
    initialPhaseRad: 2.8,
    primaryColor: '#7de3f4',
    secondaryColor: '#48b2c7',
    tertiaryColor: '#c4f5fc',
    atmosphereColor: '#7de3f4',
    hasAtmosphere: true,
    hasRings: true,
    droneBaseFreq: 82.41,
    description:
      'An ice giant composed primarily of water, ammonia, and methane ices above a rocky core. Knocked onto its side with a 97.8° axial tilt, it rolls along its orbital path.',
    facts: [
      'Exhibits the coldest planetary atmosphere in the Solar System (-224 °C minimum).',
      'Each pole experiences 42 continuous Earth years of sunlight followed by 42 years of darkness.',
      'Encircled by 13 faint, dark narrow rings and moons named after Shakespearean characters.'
    ],
    tourCaption:
      'Tilted nearly 98 degrees on its axis, cyan-hued Uranus rolls through the outer dark at 19.2 AU.'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    classification: 'Ice Giant',
    shaderType: 8,
    diameterKm: 49244,
    massEarths: 17.15,
    gravityMs2: 11.15,
    rotationPeriodHours: 16.11,
    orbitalPeriodDays: 60195.0,
    semiMajorAxisAU: 30.11,
    orbitalInclinationDeg: 1.77,
    axialTiltDeg: 28.32,
    meanTempC: -200,
    moonsCount: 16,
    visualRadius: 2.55,
    trueScaleRadius: 1.3,
    visualOrbitRadius: 162,
    trueOrbitRadius: 380,
    initialPhaseRad: 5.7,
    primaryColor: '#2d63eb',
    secondaryColor: '#19389e',
    tertiaryColor: '#8cb3ff',
    atmosphereColor: '#477eff',
    hasAtmosphere: true,
    droneBaseFreq: 87.31,
    description:
      'The outermost major planet, predicted by mathematical perturbation before its telescopic discovery. Driven by strong internal heat, it hosts supersonic methane winds.',
    facts: [
      'Equatorial wind speeds reach 2,100 km/h—the fastest sustained winds in the Solar System.',
      'Largest moon Triton orbits retrograde and erupts nitrogen-ice geysers.',
      'Completed its first full orbit since its 1846 discovery in July 2011.'
    ],
    tourCaption:
      'Whipped by supersonic winds at 30 AU, cobalt-blue Neptune patrols the edge of the Kuiper frontier.'
  },
  {
    id: 'pluto',
    name: 'Pluto',
    classification: 'Kuiper Belt Dwarf Planet',
    shaderType: 9,
    diameterKm: 2376,
    massEarths: 0.0022,
    gravityMs2: 0.62,
    rotationPeriodHours: -153.29,
    orbitalPeriodDays: 90560.0,
    semiMajorAxisAU: 39.48,
    orbitalInclinationDeg: 17.16,
    axialTiltDeg: 122.53,
    meanTempC: -229,
    moonsCount: 5,
    visualRadius: 0.95,
    trueScaleRadius: 0.18,
    visualOrbitRadius: 185,
    trueOrbitRadius: 450,
    initialPhaseRad: 0.4,
    primaryColor: '#c9b29b',
    secondaryColor: '#755843',
    tertiaryColor: '#f2e8dc',
    atmosphereColor: '#8ab4f8',
    hasAtmosphere: false,
    droneBaseFreq: 164.81,
    description:
      'King of the Kuiper Belt. Far from a dead ice ball, Pluto features nitrogen glaciers convecting across Sputnik Planitia and water-ice mountains towering 3.5 km high.',
    facts: [
      'Forms a binary system with Charon; their barycenter lies in space between them.',
      'Follows a highly eccentric, 17°-inclined orbit in a 2:3 resonance with Neptune.',
      'Thin nitrogen-methane haze layers glow blue when backlit by the distant Sun.'
    ],
    tourCaption:
      'At the icy frontier of 39.5 AU, Pluto’s nitrogen heart Sputnik Planitia gleams under a distant, pinpoint Sun.'
  }
];

export const BODY_MAP = new Map<string, BodyData>(SOLAR_BODIES.map((b) => [b.id, b]));