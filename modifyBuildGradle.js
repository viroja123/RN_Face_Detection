const fs = require("fs");
const path = require("path");

const gradleFilePath = path.join(__dirname, "android", "app", "build.gradle");

// Function to modify build.gradle
function modifyBuildGradle() {
  if (!fs.existsSync(gradleFilePath)) {
    console.error(
      "❌ build.gradle file not found. Have you run 'expo prebuild'?"
    );
    return;
  }

  let gradleContent = fs.readFileSync(gradleFilePath, "utf8");

  // Add Maven repository if not present
  const mavenRepo = `maven { url 'https://maven.regulaforensics.com/RegulaDocumentReader' }`;
  if (!gradleContent.includes(mavenRepo)) {
    gradleContent = gradleContent.replace(
      /allprojects\s*{\s*repositories\s*{/,
      `allprojects {\n        repositories {\n            ${mavenRepo}`
    );
    console.log("✅ Added Maven repository.");
  }

  // Add aaptOptions if not present
  const aaptOptions = `aaptOptions {\n        noCompress "Regula/faceSdkResource.dat"\n    }`;
  if (!gradleContent.includes("aaptOptions")) {
    gradleContent = gradleContent.replace(
      /android\s*{/,
      `android {\n    ${aaptOptions}\n`
    );
    console.log("✅ Added aaptOptions.");
  }

  // Write back to build.gradle
  fs.writeFileSync(gradleFilePath, gradleContent, "utf8");
  console.log("🎉 Successfully updated build.gradle!");
}

// Run the function
modifyBuildGradle();
