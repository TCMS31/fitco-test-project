import { User } from "../models/index.js";

import { passwordHasher } from "./password/index.js";
import { logger } from "./logger.js";

/**
 * A realistic roster, large enough that pagination is exercised rather than
 * merely present. Addresses use the reserved `.example` TLD so nothing here can
 * ever reach a real inbox.
 */
export const SEED_USERS = Object.freeze([
  ["Amelia", "Hartley", "amelia.hartley@fitco.example"],
  ["Rajesh", "Iyer", "rajesh.iyer@fitco.example"],
  ["Sofia", "Marchetti", "sofia.marchetti@fitco.example"],
  ["Daniel", "Okafor", "daniel.okafor@fitco.example"],
  ["Mei", "Lin", "mei.lin@fitco.example"],
  ["Tomas", "Berg", "tomas.berg@fitco.example"],
  ["Priya", "Raman", "priya.raman@fitco.example"],
  ["Lucas", "Fernandes", "lucas.fernandes@fitco.example"],
  ["Noor", "Al-Sayed", "noor.alsayed@fitco.example"],
  ["Erik", "Johansson", "erik.johansson@fitco.example"],
  ["Chloe", "Dubois", "chloe.dubois@fitco.example"],
  ["Kwame", "Mensah", "kwame.mensah@fitco.example"],
  ["Hannah", "Weiss", "hannah.weiss@fitco.example"],
  ["Diego", "Alvarez", "diego.alvarez@fitco.example"],
  ["Yuki", "Tanaka", "yuki.tanaka@fitco.example"],
  ["Fatima", "Zahra", "fatima.zahra@fitco.example"],
  ["Oliver", "Whitfield", "oliver.whitfield@fitco.example"],
  ["Ingrid", "Solberg", "ingrid.solberg@fitco.example"],
  ["Marcus", "Bello", "marcus.bello@fitco.example"],
  ["Elena", "Petrova", "elena.petrova@fitco.example"],
  ["Samuel", "Nkemdirim", "samuel.nkemdirim@fitco.example"],
  ["Aisha", "Khan", "aisha.khan@fitco.example"],
  ["Jonas", "Lindqvist", "jonas.lindqvist@fitco.example"],
  ["Carla", "Ricci", "carla.ricci@fitco.example"],
  ["Ben", "Halloran", "ben.halloran@fitco.example"],
  ["Nadia", "Haddad", "nadia.haddad@fitco.example"],
  ["Peter", "Novak", "peter.novak@fitco.example"],
  ["Grace", "Adeyemi", "grace.adeyemi@fitco.example"],
  ["Hugo", "Martins", "hugo.martins@fitco.example"],
  ["Leila", "Farsi", "leila.farsi@fitco.example"],
  ["Anton", "Kovacs", "anton.kovacs@fitco.example"],
  ["Rosa", "Delgado", "rosa.delgado@fitco.example"],
  ["Felix", "Braun", "felix.braun@fitco.example"],
  ["Ayana", "Tesfaye", "ayana.tesfaye@fitco.example"],
]);

/** The shared demo password. Never used outside seeded, disposable data. */
export const SEED_PASSWORD = "Passw0rd!seed";

export const seedUsers = async () => {
  const password = await passwordHasher.hash(SEED_PASSWORD);
  let created = 0;

  for (const [firstName, lastName, email] of SEED_USERS) {
    const [, isNew] = await User.scope("withPassword").findOrCreate({
      where: { email },
      defaults: { firstName, lastName, email, password },
    });

    if (isNew) created += 1;
  }

  logger.info(
    `Seed complete: ${created} created, ${SEED_USERS.length - created} already present`
  );

  return { created, total: SEED_USERS.length };
};
