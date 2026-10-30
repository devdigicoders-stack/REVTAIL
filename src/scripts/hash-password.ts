import bcrypt from "bcryptjs";

async function generatePasswordHash() {
  const password = "tester123";

  const hashedPassword = await bcrypt.hash(password, 12);

  console.log("Password:", password);
  console.log("Hashed Password:", hashedPassword);
}

generatePasswordHash();