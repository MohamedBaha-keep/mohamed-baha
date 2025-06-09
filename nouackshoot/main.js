

const houses = [

    // for buy here-----?
  {
    id: 1,
    type: "buy",
    city: "الصحراوي",
    title: "فيلا فالصحراوي ",
    descriptions:"فيلا في الصحراوي",
    price: "$120.000.000 اوقية قديمة",
     images: [
      "images/p9.jpeg",
      "images/p10.jpeg",
      "images/p11.jpeg",
      "images/p12.jpeg"
    ],

   rooms: 4,
  size: 300,
  toilets: 3,
  garage: 2
    
  },




  
  {
    id: 3,
    type: "buy",
    city: "الصحراوي",
    title: "House in Atar",
    descriptions:"id = 556 92949478003",
    price: "$80,000",
     images: [
      "images/p13.jpeg",
      "images/p14.jpeg",
      "images/p15.jpeg"
    ],
 rooms: 4,
  size: 300,
  toilets: 3,
  garage: 2

  },






//   for rent  here----?
  {
    id: 2,
    type: "rent",
    city: "عرفات",
    title: "دالر فعرفات جنب مانعرف فيه بت ",
    descriptions:"c",
    price: "$400/month",
     images: [
      "images/p16.jpeg",
      "images/p17.jpeg",
      "images/p18.jpeg",
      "images/p19.jpeg"
    ],

     rooms: 4,
  size: 300,
  toilets: 3,
  garage: 2

  },
 
  {
    id: 4,
    type: "rent",
    city: "عين الطلح",
    title: "دار في عين الطلح جنب بقالة كل شيء",
    descriptions:"asgfiqgegeufq",
    price: "23000000",
     images: [
      "images/p9.jpeg",
      "images/p9.jpeg",
      "images/p9.jpeg",
      "images/p9.jpeg"
    ],


     rooms: 4,
  size: 300,
  toilets: 3,
  garage: 2

  },
   





  // --- for lands (buy only) ---
{
  id: 5,
  type: "land",
  city: "تفرغ زينة",
  title: "أرض للبيع في تفرغ زينة",
  descriptions: "قطعة أرض مساحتها 400م² في موقع مميز.",
  price: "7,000,000 MRU",
  images: [
    "images/land1.jpeg",
    "images/land2.jpeg",
    "images/land1.jpeg"
  ],

   rooms: 0,
  size: 300,
  toilets: 0,
  garage:0 

},
{
  id: 6,
  type: "land",
  city: "كرفور",
  title: "أرض صالحة للبناء",
  descriptions: "قريبة من الطريق العام بمساحة 300مf  mohamed baha sssk mosjs mssissjs sjsi,<br> ha.",
  price: "5,500,000 MRU",
  images: [
    "images/land1.jpeg",
    "images/land12.jpeg"
  ],

   rooms: 0,
  size: 300,
  toilets: 0,
  garage: 0
}
];





const typeFilter = document.getElementById("typeFilter");
const cityFilter = document.getElementById("cityFilter");
const houseList = document.getElementById("houseList");

function displayHouses() {
  const type = typeFilter.value;
  const city = cityFilter.value;

  const filtered = houses.filter(house => {
    return (type === "all" || house.type === type) &&
           (city === "all" || house.city === city);
  });

  houseList.innerHTML = "";

  if (filtered.length === 0) {
    houseList.innerHTML = "<p>.الصفة فارغة, الرجاء تغيير المنطقة</p>";
    return;
  }

  filtered.forEach(house => {
    const card = document.createElement("div");
    card.className = "house-card";
   card.innerHTML = `

  

   <h2><i class="fas fa-map-marker-alt" >  ${house.city.charAt(0).toUpperCase() + house.city.slice(1)}</i></h2>

  <img src="${house.images[0]}" alt="${house.title}" />  
  <button onclick="openGallery(${house.id})">عرض الصور</button>
  <div class="info">

    <h3>${house.title}</h3>




 <div class="icons">
      <span><i class="fas fa-bed"></i> ${house.rooms} غرف</span><br>
      <span><i class="fas fa-ruler-combined"></i> ${house.size} م²</span>
      <span><i class="fas fa-toilet"></i> ${house.toilets} حمام</span>
      <span><i class="fas fa-warehouse"></i> ${house.garage} كراج</span>
    </div>



    <p>${house.price}</p>
  
    <p>${house.descriptions}</p>

 <p class="description" id="desc-${house.id}" data-full="${house.descriptions}">
  ${house.descriptions.slice(-5, 40)}...
  <span class="read-more" onclick="toggleDescription(${house.id}, '${house.descriptions}')">قراءة المزيد</span>
  





  </div>
`;
    houseList.appendChild(card);
  });
}


function toggleDescription(id, fullText) {
  const desc = document.getElementById(`desc-${id}`);
  desc.innerHTML = `
    ${fullText} <span class="read-less" onclick="collapseDescription(${id}, '${fullText.slice(0, 35)}')">إظهار أقل</span>
  `;
}

function collapseDescription(id, shortText) {
  const desc = document.getElementById(`desc-${id}`);
  desc.innerHTML = `
    ${shortText}... <span class="read-more" onclick="toggleDescription(${id}, '${desc.getAttribute('data-full')}')">قراءة المزيد</span>
  `;
}


typeFilter.addEventListener("change", displayHouses);
cityFilter.addEventListener("change", displayHouses);

window.onload = displayHouses;



//   ------------* for images slides  


let currentGallery = [];
let currentIndex = 0;

function openGallery(houseId) {
  const house = houses.find(h => h.id === houseId);
  currentGallery = house.images;
  currentIndex = 0;
  document.getElementById("lightboxImg").src = currentGallery[currentIndex];
  document.getElementById("lightbox").classList.remove("hidden");
}

function closeGallery() {
  document.getElementById("lightbox").classList.add("hidden");
}

function nextImage() {
  currentIndex = (currentIndex + 1) % currentGallery.length;
  document.getElementById("lightboxImg").src = currentGallery[currentIndex];
}

function prevImage() {
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  document.getElementById("lightboxImg").src = currentGallery[currentIndex];
}

//   ------------* for images slides  



