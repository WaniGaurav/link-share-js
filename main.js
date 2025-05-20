const form = document.getElementById("linkForm");
const titleInput = document.getElementById("titleInput");
const urlInput = document.getElementById("urlInput");
const categoryInput = document.getElementById("categoryInput");
const searchInput = document.getElementById("searchInput");
const linkList = document.getElementById("linkList");

let links = JSON.parse(localStorage.getItem("linksWithCategory")) || [];

function saveLinks() {
  localStorage.setItem("linksWithCategory", JSON.stringify(links));
}

function getQRCodeURL(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`;
}

// OPTIONAL: Use a public link preview API
async function getThumbnail(url) {
  try {
    const res = await fetch(`https://api.linkpreview.net/?key=61a2412dd2026a028dd86d6a8b363dd7&q=${encodeURIComponent(url)}`);
    const data = await res.json();
    return data.image || null;
  } catch (err) {
    console.error("Preview failed:", err);
    return null;
  }
}

async function renderLinks() {
  linkList.innerHTML = "";
  const filter = searchInput.value.toLowerCase();

  const grouped = {};
  links
    .filter(link =>
      link.title.toLowerCase().includes(filter) ||
      (link.category || "").toLowerCase().includes(filter)
    )
    .forEach(link => {
      const category = link.category || "No category provided";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(link);
    });

  for (const category of Object.keys(grouped)) {
    const catDiv = document.createElement("div");
    catDiv.className = "categoryBlock";

    const title = document.createElement("div");
    title.className = "categoryTitle";
    title.textContent = category;
    catDiv.appendChild(title);

    for (const link of grouped[category]) {
      const div = document.createElement("div");
      div.className = "linkItem";

      const leftSide = document.createElement("div");
      leftSide.style.display = "flex";
      leftSide.style.flexDirection = "column";

      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.textContent = link.title;
      anchor.target = "_blank";
      leftSide.appendChild(anchor);

      const date = document.createElement("small");
      date.textContent = `Added: ${new Date(link.timestamp).toLocaleString()}`;
      leftSide.appendChild(date);

      const qr = document.createElement("img");
      qr.src = getQRCodeURL(link.url);
      qr.className = "qr";
      leftSide.appendChild(qr);

      const thumbnail = document.createElement("img");
      thumbnail.style.width = "100px";
      thumbnail.style.marginTop = "5px";
      if (link.thumbnail) {
        thumbnail.src = link.thumbnail;
        leftSide.appendChild(thumbnail);
      } else {
        // lazy-load thumbnail
        getThumbnail(link.url).then(imgUrl => {
          if (imgUrl) {
            link.thumbnail = imgUrl;
            thumbnail.src = imgUrl;
            leftSide.appendChild(thumbnail);
            saveLinks();
          }
        });
      }

      const delButton = document.createElement("button");
      delButton.textContent = "Delete";
      delButton.onclick = () => {
        links = links.filter(l => l !== link);
        saveLinks();
        renderLinks();
      };

      div.appendChild(leftSide);
      div.appendChild(delButton);
      catDiv.appendChild(div);
    }

    linkList.appendChild(catDiv);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const category = categoryInput.value.trim();

  if (title && url) {
    const newLink = {
      title,
      url,
      category,
      timestamp: Date.now(),
      thumbnail: null
    };
    links.push(newLink);
    saveLinks();
    renderLinks();
    form.reset();
  }
});

searchInput.addEventListener("input", () => {
  renderLinks();
});

renderLinks();