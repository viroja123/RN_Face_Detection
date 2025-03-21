
const invokeGenderDetector = async (photo) => {
  try {
    // console.log("photo------------->", photo);

    const response = await fetch(
      "https://www.nyckel.com/v1/functions/gender-detector/invoke",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: photo,
        }),
      }
    );

    const data = await response.json();
    console.log("Gender Detection Response:", data);
    return data;
  } catch (error) {
    console.error("Error detecting gender:", error);
  }
};

export default invokeGenderDetector;
