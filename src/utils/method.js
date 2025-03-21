import { supabase } from "../config/initSupabase";
import RNFS from "react-native-fs";
import { decode } from "base64-arraybuffer";

const uploadImageToStorage = async (path, isBase64) => {
  try {
    let imageName = "";
    if (isBase64) {
      console.log("isBase64 is TRUE--------------------------", isBase64);
      imageName = `${path.split("/").pop()}+${Date.now()}`;
      console.log("imageName", imageName);
      const { data: data11, error } = await supabase.storage
        .from("image")
        .upload(imageName, decode(path), {
          contentType: "image/png",
        });
      console.log("data---------->", data11);

      if (error) {
        console.error("Upload error:", error);
        return null;
      }
    } else {
    //   console.log("isBase64 is FALSE--------------------------", isBase64);
      imageName = path.split("/").pop();
      console.log("Uploading:", imageName);
      const fileData = await RNFS.readFile(path, "base64");
    //   console.log("fileData,", fileData, "fileData--->");
      const { data: data11, error } = await supabase.storage
        .from("image")
        .upload(imageName, decode(fileData), {
          contentType: "image/png",
        });
    //   console.log("data---------->", data11);

      if (error) {
        console.error("Upload error:", error);
        return null;
      }
    }

    const { data } = await supabase.storage
      .from("image")
      .getPublicUrl(imageName);

    console.log("Image URL:", data.publicUrl);
    return data;
  } catch (error) {
    console.error("error", error);
  }
};

export { uploadImageToStorage };
