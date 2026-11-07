/**
 * Citizen Dialog System - Full 2-Part Conversation Generator
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * PART 1: Ruler asks citizen (Government + Job weighted)
 * PART 2: Citizen answers (Stat + Reason + Government/Religion colored)
 *
 * Format:
 *   {Ruler asks about status based on government + citizen's job}
 *   {Citizen answers based on lowest stat, colored by government/religion}
 *   {Reason why stat is low/high + how to fix it}
 *
 * Exports: CitizenDialogSystem (global), generateCitizenDialog(citizen, nation),
 *          generateRulerQuestion(citizen, nation), generateCitizenAnswer(citizen, nation)
 */

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const money = (v) => "$" + Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

class CitizenDialogSystem {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN 2-PART CONVERSATION GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a complete 2-part conversation: ruler asks, citizen answers.
   *
   * @param {object} citizen - Citizen object from PopulationSystem
   * @param {object} nation - Nation object (government, religion, nationStats, etc.)
   * @returns {object} { rulerQuestion, citizenAnswer, fullDialog }
   */
  generateConversation(citizen, nation) {
    if (!citizen) return { rulerQuestion: "...", citizenAnswer: "...", fullDialog: "..." };

    const gov = nation?.government || "liberalDemocracy";
    const rel = nation?.religion || "monotheism";
    const nationStats = nation?.nationStats || {};

    const rulerQuestion = this.generateRulerQuestion(citizen, nation);
    const citizenAnswer = this.generateCitizenAnswer(citizen, nation, nationStats);

    return {
      rulerQuestion,
      citizenAnswer,
      fullDialog: `${rulerQuestion} ${citizenAnswer}`.trim()
    };
  }

  /**
   * Backward-compatible single-line dialog (citizen answer only).
   */
  generateCitizenDialog(citizen, nation) {
    if (!citizen) return "...";
    const nationStats = nation?.nationStats || {};
    return this.generateCitizenAnswer(citizen, nation, nationStats);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: RULER ASKS CITIZEN (Government + Job weighted)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate how the nation's ruler addresses the citizen.
   * Based on government type and the citizen's job/occupation.
   */
  generateRulerQuestion(citizen, nation) {
    const gov = nation?.government || "liberalDemocracy";
    const occupation = citizen.occupation || "unemployed";
    const isEmployed = citizen.isEmployed;
    const isRetired = citizen.isRetired;
    const isStudent = citizen.occupation === "student";
    const isMilitary = citizen.isMilitary;
    const happiness = Number(citizen.happiness || 50);
    const loyalty = Number(citizen.loyalty || 50);

    // Determine what status to ask about
    let statusKey;
    if (isStudent) statusKey = "student";
    else if (isRetired) statusKey = "retired";
    else if (isMilitary) statusKey = "military";
    else if (isEmployed) statusKey = "employed";
    else statusKey = "unemployed";

    // Government-weighted opening
    const openers = this.getRulerOpeners(gov, loyalty);
    const opener = openers[Math.floor(Math.random() * openers.length)];

    // Job-specific question
    const question = this.getStatusQuestion(statusKey, occupation, gov, happiness);

    return `${esc(opener)} ${esc(question)}`.trim();
  }

  getRulerOpeners(gov, loyalty) {
    const base = {
      liberalDemocracy: ["Citizen,", "My friend,", "Fellow citizen,", "Greetings,"],
      conservativeRepublic: ["Patriot,", "Good citizen,", "Greetings,"],
      socialism: ["Comrade,", "Worker,", "Friend,", "Greetings,"],
      authoritarianRegime: ["Subject,", "Citizen,", "Speak,"],
      dictatorship: ["Subject,", "Citizen,", "Speak,"],
      absoluteMonarchy: ["Subject,", "Loyal servant,", "Speak,"],
      theocracy: ["Brother,", "Sister,", "Faithful one,", "Greetings,"],
      militaryJunta: ["Soldier,", "Citizen,", "Report,"],
      communism: ["Comrade,", "Worker,", "Greetings,"],
    };

    let list = base[gov] || base.liberalDemocracy;

    // Low loyalty makes the ruler colder
    if (loyalty < 30) {
      list = list.slice(Math.floor(list.length / 2));
    }

    return list;
  }

  getStatusQuestion(statusKey, occupation, gov, happiness) {
    const jobTitle = this.jobTitleLabel(occupation);

    const questions = {
      employed: [
        `Why are you working as a ${jobTitle}?`,
        `How is your work as a ${jobTitle} going?`,
        `You serve as a ${jobTitle} — are you satisfied?`,
        `What do you do as a ${jobTitle} for this nation?`,
      ],
      unemployed: [
        "Why are you not working?",
        "Why do you have no job?",
        "Why are you unemployed?",
        "What keeps you from finding work?",
      ],
      student: [
        "Why are you still studying?",
        "What are you learning in school?",
        "Why haven't you entered the workforce yet?",
      ],
      retired: [
        "Why are you retired?",
        "How is your retirement going?",
        "You no longer work — how do you get by?",
      ],
      military: [
        "Why do you serve in the military?",
        "How is your duty in the ${jobTitle} going?",
        "Why did you enlist?",
      ],
    };

    const list = questions[statusKey] || questions.employed;
    let q = list[Math.floor(Math.random() * list.length)];

    // Government modifies tone
    if (gov === "authoritarianRegime" || gov === "dictatorship" || gov === "absoluteMonarchy") {
      if (happiness < 40) q = q.replace(/\?$/, " — answer truthfully.");
      else q = q.replace(/\?$/, ".");
    }

    return q;
  }

  jobTitleLabel(occupation) {
    const titles = {
      "unemployed": "unemployed",
      "student": "student",
      "retired": "retired",
      "laborer": "laborer",
      "farmer": "farmer",
      "clerk": "clerk",
      "craftsperson": "craftsperson",
      "technician": "technician",
      "manager": "manager",
      "teacher": "teacher",
      "trader": "trader",
      "doctor": "doctor",
      "engineer": "engineer",
      "scientist": "scientist",
      "lawyer": "lawyer",
      "administrator": "administrator",
      "professor": "professor",
      "nurse": "nurse",
      "head_nurse": "head nurse",
      "officer": "police officer",
      "sergeant": "police sergeant",
      "farm_manager": "farm manager",
      "dock_hand": "dock hand",
      "port_manager": "port manager",
      "dealer": "casino dealer",
      "pit_boss": "pit boss",
      "line_worker": "factory line worker",
      "shift_supervisor": "shift supervisor",
      "professor": "university professor",
      "dean": "university dean",
      "missile_technician": "missile technician",
      "silo_commander": "silo commander",
      "interceptor_operator": "interceptor operator",
      "defense_director": "defense director",
      "operations_officer": "operations officer",
      "command_director": "command director",
      "drill_instructor": "drill instructor",
      "academy_commandant": "academy commandant",
      "paramedic": "paramedic",
      "medical_director": "medical director",
      "protocol_officer": "protocol officer",
      "government_liaison": "government liaison",
      "acolyte": "acolyte",
      "high_priest": "high priest",
      "field_agent": "field agent",
      "station_chief": "station chief",
      "swat_officer": "SWAT officer",
      "swat_commander": "SWAT commander",
      "research_assistant": "research assistant",
      "lead_researcher": "lead researcher",
      "detective": "detective",
      "police_chief": "police chief",
      "bookmaker": "bookmaker",
      "casino_director": "casino director",
      "tactical_trainer": "tactical trainer",
      "training_director": "training director",
      "production_lead": "production lead",
      "plant_manager": "plant manager",
      "flight_crew": "flight crew",
      "wing_commander": "wing commander",
      "deck_hand": "naval deck hand",
      "fleet_admiral": "fleet admiral",
      "news_anchor": "news anchor",
      "station_manager": "station manager",
      "aid_officer": "foreign aid officer",
      "foreign_aid_director": "foreign aid director",
      "diplomat": "diplomat",
      "ambassador": "ambassador",
      "recycling_technician": "recycling technician",
      "environmental_director": "environmental director",
      "agronomist": "agronomist",
      "agriculture_director": "agriculture director",
      "crop_specialist": "crop specialist",
      "farm_coordinator": "farm coordinator",
      "hydrologist": "hydrologist",
      "water_director": "water director",
      "water_engineer": "water engineer",
      "resource_manager": "resource manager",
      "salvage_worker": "salvage worker",
      "recovery_director": "recovery director",
      "salvage_technician": "salvage technician",
      "salvage_commander": "salvage commander",
      "state_architect": "state architect",
      "national_governor": "national governor",
      "temple_keeper": "temple keeper",
      "spiritual_leader": "spiritual leader",
      "librarian": "senior librarian",
      "chief_archivist": "chief archivist",
      "senior_researcher": "senior researcher",
      "academy_director": "academy director",
      "eco_scientist": "eco scientist",
      "environmental_director_wonder": "environmental director",
      "education_coordinator": "education coordinator",
      "minister_of_education": "minister of education",
      "healthcare_administrator": "healthcare administrator",
      "minister_of_health": "minister of health",
      "missile_commander": "missile commander",
      "strategic_missile_director": "strategic missile director",
      "intelligence_officer": "intelligence officer",
      "spymaster": "spymaster",
      "salvage_specialist": "salvage specialist",
      "recovery_command": "recovery command",
      "recovery_engineer": "recovery engineer",
      "resource_recovery_director": "resource recovery director",
      "nuclear_technician": "nuclear technician",
      "nuclear_program_director": "nuclear program director",
      "warhead_engineer": "warhead engineer",
      "arsenal_director": "arsenal director",
      "basketball_coach": "head coach",
      "basketball_gm": "general manager",
      "hockey_coach": "head coach",
      "hockey_gm": "general manager",
      "soccer_coach": "head coach",
      "soccer_gm": "general manager",
      "alliance_liaison": "alliance liaison",
      "alliance_director": "alliance director",
      "mine_engineer": "mine engineer",
      "mining_director": "mining director",
      "env_engineer": "environmental engineer",
      "sustainability_director": "sustainability director",
      "assembly_lead": "assembly lead",
      "manufacturing_director": "manufacturing director",
      "green_manufacturing_lead": "green manufacturing lead",
      "clean_production_director": "clean production director",
      "recycling_specialist": "recycling specialist",
      "env_director_wonder": "environmental director",
      "strategic_officer": "strategic officer",
      "supreme_commander": "supreme commander",
      "network_engineer": "network engineer",
      "it_director": "IT director",
      "temple_farmer": "temple farmer",
      "high_provisioner": "high provisioner",
      "water_keeper": "water keeper",
      "high_aqueduct_master": "high aqueduct master",
    };
    return titles[occupation] || occupation;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: CITIZEN ANSWERS (Stat + Reason + Government/Religion colored)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate the citizen's answer based on their lowest stat,
   * colored by their government and religion when addressing the ruler.
   */
  generateCitizenAnswer(citizen, nation, nationStats) {
    if (!citizen) return "...";

    const gov = nation?.government || "liberalDemocracy";
    const rel = nation?.religion || "monotheism";
    const loyalty = Number(citizen.loyalty || 50);
    const occupation = citizen.occupation || "unemployed";
    const isEmployed = citizen.isEmployed;
    const isRetired = citizen.isRetired;
    const isStudent = citizen.occupation === "student";

    // Find the citizen's lowest stat among the four core stats
    const coreStats = {
      happiness: Number(citizen.happiness || 50),
      health: Number(citizen.health || 100),
      wealth: this.wealthToScore(citizen.wealth || 0, citizen.income || 0),
      education: this.educationToScore(citizen.education || "none", citizen.literacyScore || 0),
    };

    const lowestKey = Object.entries(coreStats).reduce((a, b) =>
      b[1] < a[1] ? b : a
    )[0];
    const lowestValue = coreStats[lowestKey];

    // Job-informed stat dialog
    const statDialog = this.generateStatDialog(lowestKey, lowestValue, citizen, nation, occupation);

    // Reason + fix for the low stat
    const reasonDialog = this.generateStatReason(lowestKey, lowestValue, citizen, nation, nationStats, occupation);

    // Address the ruler back (government + religion colored)
    const addressBack = this.generateAddressToRuler(citizen, nation, loyalty);

    // Combine
    let dialog = "";
    if (addressBack) dialog += addressBack + " ";
    if (statDialog) dialog += statDialog + " ";
    if (reasonDialog) dialog += reasonDialog;

    // Apply government/religion coloring to the whole thing
    return this.withGovRelColoring(gov, rel, loyalty, dialog.trim());
  }

  generateAddressToRuler(citizen, nation, loyalty) {
    const gov = nation?.government || "liberalDemocracy";
    const rel = nation?.religion || "monotheism";
    const age = citizen.age || 0;

    // How the citizen addresses the ruler back - religion is more personal
    const relAddresses = {
      monotheism: ["By the One's grace,", "Child of the One here,", "Believer speaking,"],
      polytheism: ["Child of the gods,", "Faithful follower,"],
      atheism: ["By reason alone,", "A free thinker,"],
      buddhism: ["Seeker of peace,", "A humble follower,"],
      hinduism: ["A soul bound by duty,"],
      islam: ["A servant of Allah,", "Believer here,"],
      christianity: ["A child of God,", "Brother in Christ,"],
      judaism: ["A fellow believer,", "Shalom,"],
      shintoism: ["A servant of the kami,"],
      shamanism: ["A spirit-talker here,"],
      none: ["A citizen here,", "Just a person,"],
    };

    const govAddresses = {
      liberalDemocracy: ["I speak freely as a citizen,", "As a fellow citizen,"],
      conservativeRepublic: ["As a patriot,"],
      socialism: ["As a comrade,", "As a worker,"],
      authoritarianRegime: ["As a subject,", "I obey,"],
      dictatorship: ["As a subject,", "I obey,"],
      absoluteMonarchy: ["As your loyal subject,", "I serve,"],
      theocracy: ["As a faithful one,"],
      militaryJunta: ["As a soldier of the state,"],
      communism: ["As a comrade,", "As a worker,"],
    };

    let relPick = relAddresses[rel] ? relAddresses[rel][Math.floor(Math.random() * relAddresses[rel].length)] : "A citizen here,";
    let govPick = govAddresses[gov] ? govAddresses[gov][Math.floor(Math.random() * govAddresses[gov].length)] : "I speak as a citizen,";

    // Low loyalty makes citizen colder toward ruler
    if (loyalty < 30) {
      govPick = "I say,";
      relPick = relPick.replace(/,/, "");
    }

    let ageModifier = "";
    if (age < 18) ageModifier = " I am young,";
    else if (age >= 65) ageModifier = " I am an elder,";

    return `${esc(govPick)} ${esc(relPick)}${ageModifier}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORE HELPERS (0-100 for comparison)
  // ════════════════════════════════════════════════════════════════════════════

  wealthToScore(wealth, income) {
    // Wealth score 0-100 based on wealth and income
    let score = 0;
    if (wealth >= 10000) score += 40;
    else if (wealth >= 3000) score += 25;
    else if (wealth >= 1000) score += 10;
    else if (wealth > 0) score += 5;

    if (income >= 50000) score += 40;
    else if (income >= 25000) score += 25;
    else if (income >= 10000) score += 10;
    else if (income > 0) score += 5;

    return Math.min(100, score);
  }

  educationToScore(education, literacyScore) {
    let score = 0;
    switch (education) {
      case "higher": score += 60; break;
      case "secondary": score += 40; break;
      case "primary": score += 20; break;
      case "none": score += 0; break;
    }
    score += Math.min(40, literacyScore * 0.4);
    return Math.min(100, score);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAT DIALOG (Citizen's answer about their lowest stat, job-informed)
  // ════════════════════════════════════════════════════════════════════════════

  generateStatDialog(key, value, citizen, nation, occupation) {
    const isGood = value >= 60;
    const isBad = value <= 40;

    if (key === "happiness") return this.happinessDialog(value, citizen, nation, occupation, isGood, isBad);
    if (key === "health") return this.healthDialog(value, citizen, nation, occupation, isGood, isBad);
    if (key === "wealth") return this.wealthDialog(value, citizen, nation, occupation, isGood, isBad);
    if (key === "education") return this.educationDialog(value, citizen, nation, occupation, isGood, isBad);
    return "";
  }

  happinessDialog(value, citizen, nation, occupation, isGood, isBad) {
    const jobTitle = this.jobTitleLabel(occupation);
    const isEmployed = citizen.isEmployed;

    if (isGood) {
      const lines = [
        `I'm happy working as a ${jobTitle}.`,
        "Life here suits me well.",
        "I've got no complaints about my lot.",
        "Things feel stable enough for me.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    if (isBad) {
      const lines = [
        `I'm miserable as a ${jobTitle}.`,
        "I can't stand this place anymore.",
        "Every day feels like a struggle.",
        "I'm at my breaking point.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    const lines = [
      `I get by as a ${jobTitle}.`,
      "It's neither good nor bad.",
      "I manage day to day.",
      "Things could be worse.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  healthDialog(value, citizen, nation, occupation, isGood, isBad) {
    const jobTitle = this.jobTitleLabel(occupation);

    if (isGood) {
      const lines = [
        "My health is solid.",
        "I feel fit and well.",
        "No health troubles for me.",
        "I'm in good shape.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    if (isBad) {
      const lines = [
        "My health is poor.",
        "I'm sick much of the time.",
        "My body feels broken down.",
        "I can't shake this illness.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    const lines = [
      "My health is alright.",
      "I have some aches but I'm fine.",
      "I'm not in great health, but I'm not dying.",
      "I manage my health well enough.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  wealthDialog(value, citizen, nation, occupation, isGood, isBad) {
    const jobTitle = this.jobTitleLabel(occupation);
    const income = money(citizen.income || 0);

    if (isGood) {
      const lines = [
        `I'm doing alright as a ${jobTitle} (${income}).`,
        "Money isn't a worry for me.",
        "I live comfortably.",
        "I've got enough to get by and save.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    if (isBad) {
      const lines = [
        `I'm broke as a ${jobTitle} — I only make ${income}.`,
        "I can't afford the basics.",
        "Every coin I earn disappears immediately.",
        "I'm living in poverty.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    const lines = [
      `I scrape by on ${income} as a ${jobTitle}.`,
      "Money is tight but I manage.",
      "I have just enough to survive.",
      "I'm not rich, but I'm not starving.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  educationDialog(value, citizen, nation, occupation, isGood, isBad) {
    const jobTitle = this.jobTitleLabel(occupation);

    if (isGood) {
      const lines = [
        "I'm well educated and it shows.",
        "I've had good schooling.",
        "My education serves me well here.",
        "I can read, write, and think for myself.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    if (isBad) {
      const lines = [
        "I never had much schooling.",
        "I can barely read or write.",
        "I was never taught anything useful.",
        "My lack of education holds me back.",
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    }

    const lines = [
      "I had some schooling.",
      "I know the basics at least.",
      "My education is average.",
      "I learned what I needed to get by.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAT REASON (Why stat is low + how to fix it)
  // ════════════════════════════════════════════════════════════════════════════

  generateStatReason(key, value, citizen, nation, nationStats, occupation) {
    if (value > 40) return "";

    const isBad = value <= 30;
    const gov = nation?.government || "liberalDemocracy";
    const jobTitle = this.jobTitleLabel(occupation);

    if (key === "happiness") return this.happinessReason(value, citizen, nation, nationStats, isBad, jobTitle);
    if (key === "health") return this.healthReason(value, citizen, nation, nationStats, isBad, jobTitle);
    if (key === "wealth") return this.wealthReason(value, citizen, nation, nationStats, isBad, jobTitle);
    if (key === "education") return this.educationReason(value, citizen, nation, nationStats, isBad, jobTitle);
    return "";
  }

  happinessReason(value, citizen, nation, nationStats, isBad, jobTitle) {
    const reasons = [];
    const crime = nationStats.crime || 0;
    const disease = nationStats.disease || 0;
    const pollution = nationStats.pollution || 0;
    const environment = nationStats.environment || 50;

    if (crime > 40) reasons.push(`crime is rampant at ${Math.round(crime)}%`);
    if (disease > 30) reasons.push(`disease is spreading at ${Math.round(disease)}%`);
    if (pollution > 50) reasons.push(`pollution is choking the nation`);
    if (environment < 30) reasons.push(`the environment is ruined`);
    if (!citizen.isEmployed && citizen.age >= 18 && citizen.age < 65) reasons.push("there's no work for me");
    if (citizen.health < 40) reasons.push("my health is failing");

    if (reasons.length === 0) {
      reasons.push("life here is just hard right now");
    }

    const fix = this.happinessFix(nationStats, citizen, jobTitle);

    const prefix = isBad ? "The reason is " : "It's because ";
    return `${prefix}${reasons.join(", ")}. ${fix}`;
  }

  happinessFix(nationStats, citizen, jobTitle) {
    const crime = nationStats.crime || 0;
    const disease = nationStats.disease || 0;
    const pollution = nationStats.pollution || 0;

    if (crime > 40) return "Build police stations and SWAT to lower crime.";
    if (disease > 30) return "Build hospitals and cure disease to improve public health.";
    if (pollution > 50) return "Reduce industry pollution and plant trees.";
    if (!citizen.isEmployed && citizen.age >= 18 && citizen.age < 65) return `Create more ${jobTitle} jobs through buildings and projects.`;
    return "Improve national conditions and I'll feel better.";
  }

  healthReason(value, citizen, nation, nationStats, isBad, jobTitle) {
    const reasons = [];
    const disease = nationStats.disease || 0;
    const pollution = nationStats.pollution || 0;
    const environment = nationStats.environment || 50;

    if (disease > 30) reasons.push(`disease is at ${Math.round(disease)}%`);
    if (pollution > 50) reasons.push(`pollution is at ${Math.round(pollution)}`);
    if (environment < 30) reasons.push("the environment is toxic");
    if (citizen.age >= 65) reasons.push("old age is taking its toll");

    if (reasons.length === 0) {
      reasons.push("I haven't been able to get proper care");
    }

    const fix = this.healthFix(nationStats, jobTitle);

    const prefix = isBad ? "The reason is " : "It's because ";
    return `${prefix}${reasons.join(", ")}. ${fix}`;
  }

  healthFix(nationStats, jobTitle) {
    const disease = nationStats.disease || 0;
    const pollution = nationStats.pollution || 0;

    if (disease > 30) return "Cure disease and build hospitals.";
    if (pollution > 50) return "Cut pollution and build recycling centers.";
    return "Improve healthcare access through hospitals and wonders.";
  }

  wealthReason(value, citizen, nation, nationStats, isBad, jobTitle) {
    const reasons = [];
    const crime = nationStats.crime || 0;
    const literacy = nationStats.literacy || 0;

    if (!citizen.isEmployed && citizen.age >= 18 && citizen.age < 65) reasons.push("I'm unemployed");
    if (citizen.education === "none") reasons.push("I have no education");
    if (crime > 40) reasons.push("crime is hurting business");
    if (literacy < 40) reasons.push("the nation's literacy is too low for good jobs");

    if (reasons.length === 0) {
      reasons.push("wages are just too low here");
    }

    const fix = this.wealthFix(nationStats, citizen, jobTitle);

    const prefix = isBad ? "The reason is " : "It's because ";
    return `${prefix}${reasons.join(", ")}. ${fix}`;
  }

  wealthFix(nationStats, citizen, jobTitle) {
    if (!citizen.isEmployed && citizen.age >= 18 && citizen.age < 65) return `Create ${jobTitle} jobs through industry and commerce.`;
    if (citizen.education === "none") return "Build schools and universities to improve education.";
    return "Improve the national economy to raise wages.";
  }

  educationReason(value, citizen, nation, nationStats, isBad, jobTitle) {
    const reasons = [];
    const literacy = nationStats.literacy || 0;

    if (citizen.age < 18) {
      reasons.push("I'm too young for higher education yet");
    } else if (literacy < 40) {
      reasons.push(`the nation's literacy rate is only ${Math.round(literacy)}%`);
    } else {
      reasons.push("there are no schools near me");
    }

    const fix = this.educationFix(nationStats, citizen, jobTitle);

    const prefix = isBad ? "The reason is " : "It's because ";
    return `${prefix}${reasons.join(", ")}. ${fix}`;
  }

  educationFix(nationStats, citizen, jobTitle) {
    const literacy = nationStats.literacy || 0;

    if (citizen.age < 18) return "Wait until I'm older and build schools now.";
    if (literacy < 40) return "Build schools and fund education to raise literacy.";
    return "Build more educational institutions nearby.";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GOV/REL COLORING (Applied to full citizen answer)
  // ═══════════════════════════════════════════════════════════════════════════

  withGovRelColoring(gov, rel, loyalty, text) {
    if (!text) return text;

    // Government colors the citizen's tone toward the ruler
    if (gov === "authoritarianRegime" || gov === "dictatorship" || gov === "absoluteMonarchy") {
      if (loyalty > 70) return `I dare not complain — ${text}`;
      if (loyalty < 30) return `They watch us closely. ${text}`;
      return `I keep quiet about it. ${text}`;
    }

    if (gov === "theocracy") {
      if (loyalty > 70) return `By divine grace, ${text.toLowerCase()}`;
      return `The gods test us. ${text}`;
    }

    if (gov === "militaryJunta") {
      return `For the nation's strength, ${text.toLowerCase()}`;
    }

    if (gov === "socialism" || gov === "communism") {
      if (loyalty > 70) return `Together we endure. ${text}`;
      return `The collective suffers. ${text}`;
    }

    // Liberal democracy / conservative republic / default — plain speech
    return text;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH GENERATE FOR ALL CITIZENS OF A NATION
  // ═══════════════════════════════════════════════════════════════════════════

  generateAllCitizenDialogs(citizens, nation) {
    const dialogs = {};
    for (const [id, citizen] of citizens) {
      if (citizen.nationId !== nation?.id && citizen.nationId !== nation?.name) continue;
      dialogs[id] = this.generateConversation(citizen, nation);
    }
    return dialogs;
  }

  destroy() {
    this.isInitialized = false;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.CitizenDialogSystem = new CitizenDialogSystem();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
module.exports = { CitizenDialogSystem };
}
