import Axios from "axios";

const imgbbApi = Axios.create({
  baseURL: "https://api.imgbb.com/1",
  headers: { post: { "Content-Type": "multipart/form-data" } },
});

export async function uploadImage(image, authKey) {
  return imgbbApi
    .post(
      "/upload",
      {
        image: image,
        key: authKey,
      },
      { responseType: "json" }
    )
    .then((resp) => resp.data);
}
