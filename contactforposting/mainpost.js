document.getElementById("houseForm").addEventListener("submit", function (e) {
  const uploaded = document.getElementById("imageUpload").files;
  if (uploaded.length === 0) return;

  // In real version: Upload to UploadThing/Cloudinary and fill `imageLinks`
  const links = [];
  for (let i = 0; i < uploaded.length; i++) {
    links.push("Uploaded image placeholder: " + uploaded[i].name);
  }

  document.getElementById("imageLinks").value = links.join("\n");
});